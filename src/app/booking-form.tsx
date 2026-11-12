

"use client";

import { useEffect, useState } from "react";

const eventTypes = [
  "Club / Nightlife",
  "Wedding",
  "Private Party",
  "Corporate Event",
  "Festival",
  "Other",
];

export default function BookingForm() {
  const [quote, setQuote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [minimumDate, setMinimumDate] = useState("");

useEffect(() => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  setMinimumDate(`${year}-${month}-${day}`);
}, []);
  const total = Number(quote) || 0;
  const deposit = Math.round(total * 0.3 * 100) / 100;

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      customer_name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || null,
      event_type: String(formData.get("eventType") ?? ""),
      event_date: String(formData.get("eventDate") ?? ""),
      duration: String(formData.get("duration") ?? ""),
      location: String(formData.get("location") ?? "").trim(),
      message: String(formData.get("message") ?? "").trim() || null,
     
    };

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to save your booking. Please try again."
        );
      }

      setSubmitted(true);
      setQuote("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="booking" className="bg-[#071b3a] px-6 py-24">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            Booking enquiries
          </p>

          <h2 className="mt-4 text-4xl font-black sm:text-6xl">
            LET&apos;S MAKE IT HAPPEN.
          </h2>

          <p className="mt-6 leading-7 text-white/60">
            Tell me about your event. Share your preferred date, venue and
            music requirements to start planning your DJ experience.
          </p>

          <div className="mt-8 border border-purple-400/30 bg-[#0c2852] p-6">
            <p className="font-bold">Simple deposit policy</p>
            <p className="mt-2 text-sm leading-6 text-white/60">
              The booking deposit is 30% of the final agreed price. The
              remaining balance and payment deadline will be confirmed
              with your booking.
            </p>
          </div>
        </div>

        <div className="border border-blue-200/15 bg-[#0b2449] p-6 sm:p-8">
          {submitted ? (
            <div role="status" className="py-8">
              <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
                Booking request received
              </p>

              <h3 className="mt-4 text-3xl font-black">
                Thank you for your enquiry.
              </h3>

              <p className="mt-4 leading-7 text-white/60">
                Your booking enquiry has been saved. DJ Murphy will review
                your request. Your booking is not confirmed until it has
                been approved.
              </p>

              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setErrorMessage("");
                }}
                className="mt-6 border border-white/20 px-5 py-3 text-sm hover:border-purple-400"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <p
                  role="alert"
                  className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
                >
                  {errorMessage}
                </p>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Your name *
                  <input
                    name="name"
                    required
                    maxLength={150}
                    autoComplete="name"
                    placeholder="Full name"
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Email address *
                  <input
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Phone number
                  <input
                    name="phone"
                    type="tel"
                    maxLength={50}
                    autoComplete="tel"
                    placeholder="+49 ..."
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Event type *
                  <select
                    name="eventType"
                    required
                    defaultValue=""
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  >
                    <option value="" disabled>
                      Select event type
                    </option>
                    {eventTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm text-white/70">
                  Event date *
                  <input
                    name="eventDate"
                    type="date"
                    required
                    min={minimumDate || undefined}
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </label>

                <label className="block text-sm text-white/70">
                  Performance duration *
                  <select
                    name="duration"
                    required
                    defaultValue=""
                    className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  >
                    <option value="" disabled>
                      Select duration
                    </option>
                    <option value="2 hours">2 hours</option>
                    <option value="3 hours">3 hours</option>
                    <option value="4 hours">4 hours</option>
                    <option value="5 hours">5 hours</option>
                    <option value="6+ hours">6+ hours</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm text-white/70">
                Venue / city / country *
                <input
                  name="location"
                  required
                  maxLength={300}
                  placeholder="Venue, city, country"
                  className="mt-2 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>

              <label className="block text-sm text-white/70">
                Event details and music preferences
                <textarea
                  name="message"
                  rows={4}
                  maxLength={5000}
                  placeholder="Tell me about your event, audience, music style and any special requirements..."
                  className="mt-2 w-full resize-y border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                />
              </label>

              <div className="border border-blue-100/15 bg-[#081f42] p-5">
                <label className="block text-sm text-white/70">
                  Have you already received a quote? Enter it to calculate
                  your deposit preview.
                  <input
                    name="quotedPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={quote}
                    onChange={(event) => setQuote(event.target.value)}
                    placeholder="Agreed quote in EUR (optional)"
                    className="mt-3 w-full border border-blue-100/20 bg-[#06152c] px-4 py-3 text-white outline-none focus:border-purple-400"
                  />
                </label>

                {total > 0 && (
                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-white/50">
                        30% deposit preview
                      </p>
                      <p className="mt-1 text-2xl font-black text-purple-300">
                        {deposit.toLocaleString("de-DE", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </p>
                    </div>

                    <p className="text-right text-sm text-white/50">
                      Balance after deposit
                      <br />
                      {(total - deposit).toLocaleString("de-DE", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-white/40">
                  This is an estimate only. The final price must be agreed
                  with DJ Murphy. No payment is collected here.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-purple-500 px-6 py-4 text-sm font-bold uppercase tracking-widest transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting
                  ? "Sending enquiry..."
                  : "Send booking enquiry ↗"}
              </button>

              <p className="text-xs leading-5 text-white/40">
                Submitting this form sends your enquiry to DJ Murphy for
                review. No payment is collected at this stage.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
