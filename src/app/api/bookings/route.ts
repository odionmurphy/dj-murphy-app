
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      customer_name,
      email,
      phone,
      event_type,
      event_date,
      duration,
      location,
      message,
    } = body;

    // Check required fields
    if (
      typeof customer_name !== "string" ||
      !customer_name.trim() ||
      customer_name.length > 150 ||
      typeof email !== "string" ||
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      typeof event_type !== "string" ||
      !event_type.trim() ||
      event_type.length > 100 ||
      typeof event_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event_date) ||
      !Number.isFinite(Date.parse(event_date)) ||
      event_date < new Date().toISOString().slice(0, 10) ||
      typeof duration !== "string" ||
      !duration.trim() ||
      duration.length > 50 ||
      typeof location !== "string" ||
      !location.trim() ||
      location.length > 300
    ) {
      return NextResponse.json(
        { error: "Please check the required booking details." },
        { status: 400 }
      );
    }

       if (
      (phone != null &&
        (typeof phone !== "string" || phone.length > 50)) ||
      (message != null &&
        (typeof message !== "string" || message.length > 5000))
    ) {
      return NextResponse.json(
        { error: "One or more optional fields are invalid." },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("bookings").insert({
      customer_name: customer_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      event_type: event_type.trim(),
      event_date,
      duration: duration.trim(),
      location: location.trim(),
      message: message?.trim() || null,
           quoted_price: null, // only the admin sets the price, from the dashboard
      status: "pending",
    });

    if (error) {
      console.error("Supabase booking insert failed:", error.message);

      return NextResponse.json(
        { error: "We couldn't save your booking. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Booking request saved successfully." },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request. Please check your booking details." },
      { status: 400 }
    );
  }
}
