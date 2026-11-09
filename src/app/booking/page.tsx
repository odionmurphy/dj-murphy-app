import type { Metadata } from "next";
import BookingForm from "../booking-form";

export const metadata: Metadata = {
  title: "Book DJ Murphy",
  description:
    "Request a booking for your club night, wedding, private party, corporate event or festival.",
};

export default function BookingPage() {
  return <BookingForm />;
}