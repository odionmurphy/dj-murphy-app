
import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export async function POST(request: Request) {
  if (!stripe || !supabaseUrl || !supabasePublishableKey) {
    return NextResponse.json(
      { error: "Payment service is not configured." },
      { status: 500 }
    );
  }

  try {
    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Please sign in as an administrator." },
        { status: 401 }
      );
    }

    const accessToken = authorization.slice("Bearer ".length);

    const supabase = createClient(
      supabaseUrl,
      supabasePublishableKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session is invalid. Please sign in again." },
        { status: 401 }
      );
    }

    const { data: admin, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminError || !admin) {
      return NextResponse.json(
        { error: "Administrator access is required." },
        { status: 403 }
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("bookingId" in body) ||
      typeof body.bookingId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        body.bookingId
      )
    ) {
      return NextResponse.json(
        { error: "A valid booking ID is required." },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, email, event_date, quoted_price, status"
      )
      .eq("id", body.bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    if (booking.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved bookings can receive a deposit payment." },
        { status: 400 }
      );
    }

    const quotedPrice = Number(booking.quoted_price);

    if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
      return NextResponse.json(
        { error: "Add a valid quoted price before requesting a deposit." },
        { status: 400 }
      );
    }

    const depositCents = Math.round(quotedPrice * 100 * 0.3);

    if (depositCents < 50) {
      return NextResponse.json(
        { error: "The deposit must be at least €0.50." },
        { status: 400 }
      );
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      
      customer_email: booking.email,
      client_reference_id: booking.id,
      metadata: {
        booking_id: booking.id,
        payment_type: "booking_deposit",
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: depositCents,
            product_data: {
              name: "DJ Murphy booking deposit",
              description: `30% deposit for event on ${booking.event_date}`,
            },
          },
        },
      ],
      success_url: `${origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not create the payment checkout." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(
      "Stripe checkout error:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 500 }
    );
  }
}
