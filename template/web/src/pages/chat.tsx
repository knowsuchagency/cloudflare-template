import { useState } from "react"
import { Link } from "react-router"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Bot, CreditCard, Loader, Send } from "lucide-react"

import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { Message, MessageContent } from "@/components/ui/message"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller"
import { ThemeToggle } from "@/components/theme-toggle"

// Streaming chat against the auth-gated Worker route POST /api/chat.
// History is ephemeral: useChat keeps it in React state and re-sends the
// full transcript each turn — only token *usage* is persisted (D1 ai_usage,
// via the server's onFinish hook). `credentials: "include"` ships the
// session cookie so the server's getSession() succeeds (same origin in
// prod; `mise dev` proxies /api).
//
// The transcript renders inside shadcn's MessageScroller, which handles
// scroll anchoring and auto-follow of the streaming reply (only while the
// reader is at the live edge). User turns are scroll anchors, so each new
// exchange snaps near the top with a peek of the previous turn.
export function Chat() {
  const [input, setInput] = useState("")
  const queryClient = useQueryClient()

  const { data: usage } = useQuery({
    queryKey: ["usage"],
    queryFn: authClient.getUsage,
  })

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      credentials: "include",
    }),
    onFinish: () => {
      // Server-side metering ran in onFinish/waitUntil — refresh the meter.
      queryClient.invalidateQueries({ queryKey: ["usage"] })
    },
    onError: () => {
      // A 402 means the free allotment ran out mid-conversation; refetching
      // usage flips `exhausted` below and swaps the composer for the CTA.
      queryClient.invalidateQueries({ queryKey: ["usage"] })
    },
  })

  const busy = status === "submitted" || status === "streaming"
  // Belt and suspenders: trust the 402 body when the transport surfaces it,
  // but derive the same state from /api/usage so a page reload agrees.
  const exhausted =
    (error?.message.includes("free_quota_exhausted") ?? false) ||
    (usage?.plan === "free" && usage.tokensUsed >= usage.allotment)

  function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy || exhausted) return
    sendMessage({ text })
    setInput("")
  }

  return (
    <div className="relative flex h-svh flex-col bg-[var(--bg-0)]">
      <header className="relative z-10 flex items-center justify-between border-b border-[var(--border-1)] px-6 py-5 sm:px-14">
        <Link
          to="/app"
          className="flex items-center gap-2 text-sm text-[var(--fg-2)] no-underline hover:text-[var(--fg-1)]"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
        <div className="flex items-center gap-3 text-sm text-[var(--fg-2)]">
          <UsageBadge usage={usage} />
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-[var(--fg-3)]" />
            <span>Assistant</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col px-6 pb-8 sm:px-14">
        <MessageScrollerProvider autoScroll>
          <MessageScroller className="flex-1">
            <MessageScrollerViewport className="pt-8">
              <MessageScrollerContent className="gap-4 pb-4">
                {messages.length === 0 && (
                  <div className="mt-12 text-center">
                    <Bot className="mx-auto mb-4 size-10 text-[var(--fg-3)]" />
                    <p className="font-sans text-lg font-medium text-[var(--fg-0)]">
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
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      scrollAnchor={isUser}
                    >
                      <Message align={isUser ? "end" : "start"}>
                        <MessageContent>
                          <Bubble
                            variant={isUser ? "default" : "ghost"}
                            align={isUser ? "end" : "start"}
                          >
                            <BubbleContent className="text-sm whitespace-pre-wrap">
                              {text || (
                                <Loader className="size-4 animate-spin text-[var(--fg-3)]" />
                              )}
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton aria-label="Scroll to latest" />
          </MessageScroller>
        </MessageScrollerProvider>

        {exhausted ? (
          <div className="flex flex-col items-center gap-3 border border-[var(--border-1)] bg-[var(--bg-1)] p-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <p className="m-0 text-sm text-[var(--fg-1)]">
              You've used your{" "}
              {usage ? usage.allotment.toLocaleString() : "free"} free tokens
              this month. Upgrade to keep chatting.
            </p>
            <Button asChild>
              <Link to="/billing">
                <CreditCard />
                Upgrade
              </Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            {error && !exhausted && (
              <p className="mb-2 text-sm text-[var(--term-amber)]">
                Something went wrong. Try again.
              </p>
            )}
            <InputGroup>
              <InputGroupTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    e.currentTarget.form?.requestSubmit()
                  }
                }}
                placeholder="Send a message…"
                autoFocus
                disabled={busy}
                aria-label="Message"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  type="submit"
                  size="icon-sm"
                  disabled={busy || !input.trim()}
                  aria-label="Send"
                >
                  {busy ? <Loader className="animate-spin" /> : <Send />}
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </form>
        )}
      </main>
    </div>
  )
}

function UsageBadge({
  usage,
}: {
  usage: Awaited<ReturnType<typeof authClient.getUsage>> | undefined
}) {
  if (!usage) return null
  if (usage.plan === "pro") {
    return (
      <span className="border border-[var(--accent)]/40 px-2 py-0.5 font-mono text-[11px] tracking-[0.12em] text-[var(--accent)] uppercase">
        Pro
      </span>
    )
  }
  return (
    <Link
      to="/billing"
      className="font-mono text-[11px] text-[var(--fg-3)] no-underline hover:text-[var(--fg-1)]"
      title="Free-tier token usage this month"
    >
      {usage.tokensUsed.toLocaleString()} / {usage.allotment.toLocaleString()}
    </Link>
  )
}
