
import OpenAI from "openai";
import { NextResponse } from "next/server";



const apiKey = process.env.OPENAI_API_KEY;

const openai = apiKey ? new OpenAI({ apiKey }) : null;

const instructions = `
You are the DJ Murphy AI Booking Assistant for a premium DJ service.

Your role:
- Help customers plan DJ bookings for weddings, birthdays,
  private parties, corporate events, clubs, and other occasions.
- Ask concise questions to understand their event.
- Help them identify their event type, date, location, and
  required DJ duration.
- Guide customers to submit the booking form on the website.
- Be professional, welcoming, concise, and helpful.
- Use EUR (€) when discussing prices.

Booking rules:
- DJ Murphy takes a 30% deposit according to the website's
  stated booking policy.
- Do not invent prices, packages, availability, or equipment.
- If a price has not been provided, explain that a quote is needed.
- Never claim that a date is available unless the website verifies it.
- Never claim that a booking is approved or a deposit is paid
  unless the system has verified that information.
- Explain that submitting a request does not itself confirm a booking.
- Do not ask customers to provide card details, passwords,
  or other sensitive payment information in chat.
- Do not claim to have submitted a booking. The customer must
  complete the website booking form.
- If you do not know an answer, say so and direct the customer
  to contact DJ Murphy.

Keep replies friendly and normally under 120 words.
`;

export async function POST(request: Request) {
  if (!openai) {
    return NextResponse.json(
      { error: "The AI assistant is not configured on the server." },
      { status: 500 }
    );
  }

  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("messages" in body) ||
      !Array.isArray(body.messages)
    ) {
      return NextResponse.json(
        { error: "Please provide a valid message history." },
        { status: 400 }
      );
    }

    const rawMessages = body.messages;

    if (rawMessages.length === 0 || rawMessages.length > 12) {
      return NextResponse.json(
        { error: "Please send between 1 and 12 messages." },
        { status: 400 }
      );
    }

    const messages: { role: "user" | "assistant"; content: string }[] = [];

    for (const message of rawMessages) {
      if (
        !message ||
        typeof message !== "object" ||
        !("role" in message) ||
        !("content" in message) ||
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        message.content.trim().length === 0 ||
        message.content.length > 2000
      ) {
        return NextResponse.json(
          { error: "One of your messages is invalid." },
          { status: 400 }
        );
      }

      messages.push({
        role: message.role,
        content: message.content.trim(),
      });
    }

    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "Your latest message must be from the user." },
        { status: 400 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.5",
      instructions,
      input: messages,
      max_output_tokens: 300,
      store: false,
    });

    return NextResponse.json({
      reply: response.output_text,
    });
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI assistant request failed:", {
        status: error.status,
        code: error.code,
        requestId: error.requestID,
      });

      if (
        error.code === "insufficient_quota" ||
        error.code === "credit_balance_exhausted"
      ) {
        return NextResponse.json(
          {
            error:
              "The AI assistant is temporarily unavailable. Please use the booking form to send your request.",
            retryable: false,
          },
          { status: 503 }
        );
      }

      if (error.status === 429) {
        return NextResponse.json(
          {
            error:
              "The AI assistant is busy right now. Please try again shortly or use the booking form.",
            retryable: true,
          },
          { status: 503 }
        );
      }
    }

    console.error(
      "DJ Murphy assistant error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      {
        error: "The assistant could not respond. Please try again.",
        retryable: true,
      },
      { status: 500 }
    );
  }
}
