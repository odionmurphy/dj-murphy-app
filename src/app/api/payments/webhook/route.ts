
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

export async function POST(request: Request) {
  if (
    !stripe ||
    !webhookSecret ||
    !supabaseUrl ||
    !supabaseServiceKey
  ) {
    return NextResponse.json(
      { error: "Webhook service is not configured." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const payload = await request.text();

    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error instanceof Error ? error.message : "Unknown error"
    );

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  const isSuccessfulCheckout =
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded";

  if (isSuccessfulCheckout) {
    const session = event.data.object as Stripe.Checkout.Session;

    // Never mark a booking paid unless Stripe confirms payment.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const bookingId = session.metadata?.booking_id;

    if (
      !bookingId ||
      session.mode !== "payment" ||
      session.metadata?.payment_type !== "booking_deposit"
    ) {
      return NextResponse.json(
        { error: "Invalid booking payment metadata." },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: booking, error: lookupError } = await supabase
      .from("bookings")
      .select("id, quoted_price, status, payment_status")
      .eq("id", bookingId)
      .maybeSingle();

    if (lookupError) {
      console.error("Booking lookup failed:", lookupError.message);

      return NextResponse.json(
        { error: "Could not verify booking." },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 }
      );
    }

    // Repeated webhook deliveries must not overwrite a paid booking.
    if (booking.payment_status === "paid") {
      return NextResponse.json({ received: true });
    }

    if (booking.status !== "approved") {
      return NextResponse.json(
        { error: "Booking is not approved for payment." },
        { status: 400 }
      );
    }

    // Verify the amount actually paid against the booking's current quote.
    const expectedDeposit = Math.round(
      Number(booking.quoted_price) * 100 * 0.3
    );

    if (
      !Number.isFinite(expectedDeposit) ||
      expectedDeposit < 50 ||
      session.amount_total !== expectedDeposit ||
      session.currency !== "eur"
    ) {
      console.error("Stripe payment amount does not match booking.");

      return NextResponse.json(
        { error: "Payment amount verification failed." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        payment_status: "paid",
        stripe_checkout_session_id: session.id,
        deposit_paid_at: new Date().toISOString(),
      })
      .eq("id", bookingId)
      .neq("payment_status", "paid");

    if (updateError) {
      console.error("Booking payment update failed:", updateError.message);

      return NextResponse.json(
        { error: "Could not update booking payment status." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
