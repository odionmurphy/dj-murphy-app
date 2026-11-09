
"use client";

import { useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  "I'm planning a wedding",
  "I need a DJ for a birthday",
  "How does booking work?",
];

export default function AssistantChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Welcome to DJ Murphy! 🎧 Tell me about your event, and I'll help you plan your DJ booking.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text: string) {
    const content = text.trim();

    if (!content || loading) return;

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.slice(-12),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "The assistant couldn't respond. Please try again."
        );
      }

      if (typeof data.reply !== "string" || !data.reply.trim()) {
        throw new Error("The assistant returned an empty response.");
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Connection error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <section
          aria-label="DJ Murphy AI booking assistant"
          className="flex h-[min(580px,75vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-purple-400/30 bg-[#100d18] text-white shadow-2xl shadow-purple-950/50"
        >
          <header className="flex items-center justify-between border-b border-white/10 bg-[#191225] p-4">
            <div>
              <p className="font-bold tracking-wide">DJ MURPHY</p>
              <p className="mt-1 text-xs text-purple-300">
                AI Booking Assistant
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg px-3 py-2 text-xl text-white/70 hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </header>

          <div
            className="flex-1 space-y-4 overflow-y-auto p-4"
            aria-live="polite"
          >
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <p
                  className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2.5 text-sm leading-6 ${
                    message.role === "user"
                      ? "rounded-br-sm bg-purple-600 text-white"
                      : "rounded-bl-sm bg-white/[0.07] text-white/90"
                  }`}
                >
                  {message.content}
                </p>
              </div>
            ))}

            {messages.length === 1 && !loading && (
              <div className="space-y-2 pt-2">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    className="block w-full rounded-xl border border-purple-400/30 px-3 py-2 text-left text-sm text-purple-200 transition hover:bg-purple-500/10"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <p className="text-sm text-purple-300">
                DJ Murphy is typing...
              </p>
            )}

            {error && (
              <div className="rounded-lg border border-red-400/30 p-3 text-sm text-red-300">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    const lastUserMessage = [...messages]
                      .reverse()
                      .find((message) => message.role === "user");

                    if (lastUserMessage) {
                      setMessages((current) => current.slice(0, -1));
                      void sendMessage(lastUserMessage.content);
                    }
                  }}
                  className="mt-2 underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          <form
            className="border-t border-white/10 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void sendMessage(input);
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing
                  ) {
                    event.preventDefault();
                    void sendMessage(input);
                  }
                }}
                placeholder="Tell us about your event..."
                aria-label="Your message"
                rows={1}
                maxLength={2000}
                className="max-h-24 min-h-11 flex-1 resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-purple-400"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
            </div>

            <p className="mt-2 text-[10px] text-white/40">
              AI-generated answers may need verification. Bookings require
              submission through the website.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close DJ Murphy chat" : "Chat with DJ Murphy"}
        className="flex items-center gap-3 rounded-full border border-purple-300/30 bg-purple-600 px-5 py-4 font-bold text-white shadow-xl shadow-purple-950/40 transition hover:bg-purple-500"
      >
        <span aria-hidden="true">♫</span>
        <span>{isOpen ? "Close chat" : "Ask DJ Murphy AI"}</span>
      </button>
    </div>
  );
}
