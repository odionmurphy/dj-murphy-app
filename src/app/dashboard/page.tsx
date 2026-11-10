

"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  event_type: string;
  event_date: string;
  duration: string;
  location: string;
  message: string | null;
  quoted_price: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function DashboardPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(
    null
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const loadBookings = useCallback(async () => {
    setError("");

    const { data: membership, error: membershipError } = await supabase
      .from("admin_users")
      .select("user_id")
      .maybeSingle();

    if (membershipError || !membership) {
      setLoggedIn(false);
      setBookings([]);
      setError(
        "This account is not authorized to access the DJ Murphy dashboard."
      );
      return;
    }

    const { data, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bookingsError) {
      setError(bookingsError.message);
      return;
    }

    setBookings((data ?? []) as Booking[]);
    setLoggedIn(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!active) return;

        if (data.session) {
          await loadBookings();
        }
      } catch {
        if (active) setError("Unable to check your login session.");
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void supabase.auth.getSession().then(({ data }) => {
        if (!active) return;

        if (data.session) {
          void loadBookings();
        } else {
          setLoggedIn(false);
          setBookings([]);
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadBookings]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      await loadBookings();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      setError(logoutError.message);
      return;
    }

    setLoggedIn(false);
    setBookings([]);
    setPassword("");
    setNotice("");
    setError("");
  }

  async function updateStatus(
    bookingId: string,
    status: Booking["status"]
  ) {
    setError("");
    setNotice("");

    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId)
      .select("id")
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (!data) {
      setError("Booking status was not changed. Check admin permissions.");
      return;
    }

    setBookings((current) =>
      current.map((booking) =>
        booking.id === bookingId ? { ...booking, status } : booking
      )
    );

    setNotice("Booking status updated.");
  }

    async function savePrice(booking: Booking) {
    setError("");
    setNotice("");

    const raw = priceDrafts[booking.id] ?? "";
    const price = Number(raw);

    if (raw.trim() === "" || !Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than 0.");
      return;
    }

    const rounded = Math.round(price * 100) / 100;

    const { data, error: updateError } = await supabase
      .from("bookings")
      .update({ quoted_price: rounded })
      .eq("id", booking.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    if (!data) {
      setError("Price was not saved. Check admin permissions.");
      return;
    }

    setBookings((current) =>
      current.map((b) =>
        b.id === booking.id ? { ...b, quoted_price: rounded } : b
      )
    );
    setPriceDrafts((current) => {
      const next = { ...current };
      delete next[booking.id];
      return next;
    });
    setNotice("Quoted price saved.");
  }

  async function startDepositCheckout(booking: Booking) {
    if (paymentLoadingId) return;

    setError("");
    setNotice("");
    setPaymentLoadingId(booking.id);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Please sign in again before starting checkout.");
      }

      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data: { url?: string; error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start deposit checkout.");
      }

      if (
        typeof data.url !== "string" ||
        !data.url.startsWith("https://checkout.stripe.com/")
      ) {
        throw new Error("Stripe returned an invalid checkout link.");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to start checkout. Please try again."
      );
      setPaymentLoadingId(null);
    }
  }

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  const upcomingCount = bookings.filter(
    (booking) =>
      booking.status === "approved" &&
      booking.event_date >= new Date().toLocaleDateString("en-CA")
  ).length;

  const quotedTotal = bookings.reduce(
    (total, booking) => total + Number(booking.quoted_price ?? 0),
    0
  );

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070b] text-white">
        Checking admin access...
      </main>
    );
  }

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08070b] px-6 py-12 text-white">
        <section className="w-full max-w-md border border-white/10 bg-white/[0.03] p-8">
          <Link
            href="/"
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            ← Back to website
          </Link>

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            DJ Murphy · Management
          </p>
          <h1 className="mt-3 text-3xl font-black">Admin login</h1>
          <p className="mt-3 text-sm text-white/50">
            Sign in with your authorized administrator account.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-white/15 bg-black/40 px-4 py-3 outline-none focus:border-purple-400"
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 px-5 py-3 font-bold transition hover:bg-purple-500 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08070b] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            ← Back to website
          </Link>
        
                  <a
            href="/dashboard/mixes"
            className="text-sm text-purple-300 hover:text-purple-200"
          >
            Manage mixes →
          </a>
                  <a
                    href="/dashboard/gigs"
                    className="text-sm text-purple-300 hover:text-purple-200"
                  >
                    Manage gigs →
                  </a>

          <button
            onClick={handleLogout}
            className="border border-white/15 px-4 py-2 text-sm hover:border-purple-400"
          >
            Sign out
          </button>
        </div>

        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-purple-300">
            DJ Murphy · Management
          </p>
          <h1 className="mt-3 text-4xl font-black">Dashboard</h1>
          <p className="mt-3 text-white/50">
            Manage customer requests and upcoming events.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 border border-red-400/30 p-4 text-sm text-red-300"
          >
            {error}
          </p>
        )}

        {notice && (
          <p className="mt-6 border border-green-400/30 p-4 text-sm text-green-300">
            {notice}
          </p>
        )}

        <section className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total bookings", value: bookings.length },
            { label: "Pending requests", value: pendingCount },
            { label: "Upcoming events", value: upcomingCount },
            {
              label: "Quoted total",
              value: `€${quotedTotal.toLocaleString("en-IE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
            },
          ].map((stat) => (
            <article
              key={stat.label}
              className="border border-white/10 bg-white/[0.03] p-6"
            >
              <p className="text-sm text-white/50">{stat.label}</p>
              <p className="mt-4 break-words text-3xl font-black">
                {stat.value}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-8 border border-white/10 bg-white/[0.02] p-6">
          <h2 className="text-xl font-bold">Bookings</h2>

          {bookings.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">
              No bookings have been submitted yet.
            </p>
          ) : (
            <div className="mt-6 space-y-5">
              {bookings.map((booking) => {
                const validQuote =
                  booking.quoted_price !== null &&
                  Number.isFinite(Number(booking.quoted_price)) &&
                  Number(booking.quoted_price) > 0;

                const deposit = validQuote
                  ? Math.round(Number(booking.quoted_price) * 30) / 100
                  : null;

                return (
                  <article
                    key={booking.id}
                    className="border border-white/10 p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {booking.customer_name}
                        </h3>
                        <p className="mt-1 break-all text-sm text-purple-300">
                          {booking.email}
                        </p>
                        {booking.phone && (
                          <p className="mt-1 text-sm text-white/60">
                            {booking.phone}
                          </p>
                        )}
                      </div>

                      <span className="border border-white/15 px-3 py-1 text-xs uppercase tracking-wider">
                        {booking.status}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                      <p>
                        <span className="text-white/40">Event: </span>
                        {booking.event_type}
                      </p>
                      <p>
                        <span className="text-white/40">Date: </span>
                        {booking.event_date}
                      </p>
                      <p>
                        <span className="text-white/40">Duration: </span>
                        {booking.duration}
                      </p>
                      <p>
                        <span className="text-white/40">Location: </span>
                        {booking.location}
                      </p>
                      <p>
                        <span className="text-white/40">Quoted price: </span>
                        {booking.quoted_price == null
                          ? "Not set"
                          : `€${Number(booking.quoted_price).toLocaleString(
                              "en-IE",
                              {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }
                            )}`}
                      </p>
                      {booking.status === "approved" && deposit !== null && (
                        <p>
                          <span className="text-white/40">
                            30% deposit:{" "}
                          </span>
                          €{deposit.toLocaleString("en-IE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      )}
                    </div>
                  
                                      <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                      <label className="text-xs uppercase tracking-wider text-white/40">
                        Set quoted price (EUR)
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceDrafts[booking.id] ?? ""}
                          onChange={(event) =>
                            setPriceDrafts((current) => ({
                              ...current,
                              [booking.id]: event.target.value,
                            }))
                          }
                          placeholder={
                            booking.quoted_price == null
                              ? "e.g. 800"
                              : String(booking.quoted_price)
                          }
                          className="mt-2 block w-44 border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-purple-400"
                        />
                      </label>
                      <button
                        onClick={() => void savePrice(booking)}
                        className="border border-white/15 px-4 py-2 text-sm hover:border-purple-400"
                      >
                        Save price
                      </button>
                    </div>

                    {booking.message && (
                      <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="text-xs uppercase tracking-wider text-white/40">
                          Customer message
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">
                          {booking.message}
                        </p>
                      </div>
                    )}

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        onClick={() =>
                          void updateStatus(booking.id, "approved")
                        }
                        disabled={booking.status === "approved"}
                        className="bg-purple-600 px-4 py-2 text-sm font-bold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          void updateStatus(booking.id, "rejected")
                        }
                        disabled={booking.status === "rejected"}
                        className="border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() =>
                          void updateStatus(booking.id, "pending")
                        }
                        disabled={booking.status === "pending"}
                        className="border border-white/15 px-4 py-2 text-sm hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mark pending
                      </button>

                      {booking.status === "approved" && validQuote && (
                        <button
                          onClick={() => void startDepositCheckout(booking)}
                          disabled={paymentLoadingId !== null}
                          className="bg-emerald-600 px-4 py-2 text-sm font-bold hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {paymentLoadingId === booking.id
                            ? "Opening checkout..."
                            : "Request 30% deposit"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
