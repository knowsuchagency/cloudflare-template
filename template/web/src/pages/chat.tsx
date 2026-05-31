import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowLeft, Bot, Loader, Send, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Streaming chat against the auth-gated Worker route POST /api/chat.
// History is ephemeral: useChat keeps it in React state and re-sends the
// full transcript each turn, so there is no D1 table to migrate.
// `credentials: "include"` ships the session cookie so the server's
// getSession() succeeds (same origin in prod; `mise dev` proxies /api).
export function Chat() {
  const [input, setInput] = useState("")
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    }),
  })

  const busy = status === "submitted" || status === "streaming"
  const scrollRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/status are intentional triggers to auto-scroll on new chat activity, not values read in the effect
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, status])

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-[var(--bg-0)]">
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--border-1)] px-6 py-5 sm:px-14">
        <Link
          to="/app"
          className="flex items-center gap-2 text-sm text-[var(--fg-2)] no-underline hover:text-[var(--fg-1)]"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-2 text-sm text-[var(--fg-2)]">
          <Bot className="size-5 text-[var(--bf-orange)]" />
          <span>Assistant</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8 sm:px-14">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pb-4">
          {messages.length === 0 && (
            <div className="mt-12 text-center">
              <Bot className="mx-auto mb-4 size-10 text-[var(--bf-orange)]" />
              <p className="font-sans text-lg font-semibold text-[var(--fg-1)]">
                Ask me anything.
              </p>
              <p className="mt-1 text-sm text-[var(--fg-3)]">
                Powered by Workers AI · llama-4-scout.
              </p>
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === "user"
            const text = message.parts
              .filter((part) => part.type === "text")
              .map((part) => part.text)
              .join("")
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={
                    "mt-1 flex size-7 shrink-0 items-center justify-center rounded-full border " +
                    (isUser
                      ? "border-[var(--bf-orange)] text-[var(--bf-orange)]"
                      : "border-[var(--border-1)] text-[var(--fg-2)]")
                  }
                >
                  {isUser ? (
                    <User className="size-4" />
                  ) : (
                    <Bot className="size-4" />
                  )}
                </div>
                <div
                  className={
                    "max-w-[80%] rounded-md border px-4 py-2.5 text-sm whitespace-pre-wrap " +
                    (isUser
                      ? "border-[var(--bf-orange)]/40 bg-[var(--bf-orange)]/10 text-[var(--fg-1)]"
                      : "border-[var(--border-1)] bg-[var(--bg-1)] text-[var(--fg-1)]")
                  }
                >
                  {text || (
                    <Loader className="size-4 animate-spin text-[var(--fg-3)]" />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="mb-2 text-sm text-[var(--term-amber)]">
            Something went wrong. Try again.
          </p>
        )}

        <form onSubmit={onSubmit} className="flex items-center gap-2 pt-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send a message…"
            autoFocus
            disabled={busy}
            aria-label="Message"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            {busy ? <Loader className="animate-spin" /> : <Send />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </main>
    </div>
  )
}
