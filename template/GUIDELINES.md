# Project guidelines

Conventions that aren't enforced by the type checker or the test suite, but should be honored on every new feature in this project. Imported into `CLAUDE.md` so coding agents see them by default.

## Loading states

Any async path the user can wait on must show a loading indicator. That covers form submissions, route guards waiting on a session check, route transitions that fetch data, and toasts for in-flight mutations. A silent disabled button or a blank screen is not acceptable.

References:

- Button-level: `web/src/pages/login.tsx`, `signup.tsx`, `app.tsx` — disable the button and swap the action icon to `<Loader className="animate-spin" />` while the mutation is pending.
- Full-page guards: `SessionPending` in `web/src/lib/auth-guards.tsx`.
- Toasts: `web/src/components/ui/sonner.tsx` — sonner's `loading` icon is themed to the orange spinner.

## Context menus on CRUDable cards

Higher-level components that encapsulate a CRUDable object — cards, list rows, tile views — must expose a context menu with the relevant actions (edit, delete, duplicate, etc.). The menu must be invokable in two ways:

- **Desktop:** right-click anywhere on the card surface.
- **Mobile / touch:** long-press the card surface.

Use `ContextMenu` from `@/components/ui/context-menu` — radix's primitive (which shadcn wraps) handles both invocation paths and keyboard focus out of the box. Don't ship a card whose only path to destructive actions is a hover-revealed icon button; touch users won't find it.

## End-to-end tests for full-stack features

Any feature that crosses the frontend ↔ backend boundary (a new auth flow, a new mutation that hits a Worker route, a query that depends on a new D1 table) must ship with an end-to-end test that exercises the full path through `SELF.fetch()` (Worker side) or a wired-up component test that round-trips through the API.

Pattern reference: `test/auth.test.ts` — sign-up → `/api/me` → sign-in → sign-out. The auth gotchas in `CLAUDE.md` are pinned by exactly this test, and any new full-stack feature should be pinned the same way before it ships.
