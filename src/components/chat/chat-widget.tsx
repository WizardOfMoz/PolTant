"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { answerQuestion } from "@/lib/chat-assistant";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
}

const SUGGESTIONS = [
  "Which constituencies need attention?",
  "What's driving sentiment this week?",
  "Any rising accounts right now?",
  "What issues are trending?",
];

let nextId = 0;
function messageId(): string {
  nextId += 1;
  return `msg-${nextId}`;
}

const INTRO_MESSAGE: ChatMessage = {
  id: "intro",
  role: "assistant",
  text:
    "Hi — I'm a mock data assistant for this demo. Ask me about the accounts, sentiment, " +
    "alerts, constituencies, issues, or amplification events tracked here. I answer from the " +
    "same synthetic dataset every page reads (no live model call) — see /methodology.",
};

/**
 * Floating chat widget mounted once in `AppShell` so it persists across
 * navigation. Answers come from `answerQuestion` (`src/lib/chat-assistant.ts`,
 * a Server Action) — deterministic keyword-routing over this app's existing
 * mock-data modules, not a real LLM. This is a capability demo: it shows
 * what a "conversational query" surface over the tracked data could look
 * like, using the same synthetic dataset as the rest of the app.
 */
export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO_MESSAGE]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  async function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending) return;
    setMessages((prev) => [...prev, { id: messageId(), role: "user", text: trimmed }]);
    setInput("");
    setPending(true);
    try {
      const answer = await answerQuestion(trimmed);
      setMessages((prev) => [...prev, { id: messageId(), role: "assistant", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: messageId(),
          role: "assistant",
          text: "Something went wrong generating a mock answer — try rephrasing the question.",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(input);
  }

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Ask about this data"
          className="fixed bottom-20 right-4 z-50 flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg ring-1 ring-foreground/5 sm:right-6 sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">Ask about this data</p>
                <p className="text-[11px] text-muted-foreground">Mock assistant · synthetic data</p>
              </div>
            </div>
            <Button variant="ghost" size="icon-sm" aria-label="Close chat" onClick={() => setOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Thinking…
                </div>
              </div>
            )}
            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void ask(s)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              disabled={pending}
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
            />
            <Button type="submit" size="icon-sm" disabled={pending || !input.trim()} aria-label="Send">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <Button
        onClick={() => setOpen((v) => !v)}
        size="icon"
        aria-label={open ? "Close chat" : "Ask about this data"}
        className="fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg sm:right-6"
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </Button>
    </>
  );
}
