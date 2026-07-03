import { Navigate, Route, Routes } from "react-router"

import { RequireAuth, RequireGuest } from "@/lib/auth-guards"
import { Toaster } from "@/components/ui/sonner"

import { Landing } from "@/pages/landing"
import { Login } from "@/pages/login"
import { Signup } from "@/pages/signup"
import { ForgotPassword } from "@/pages/forgot-password"
import { ResetPassword } from "@/pages/reset-password"
import { AppPage } from "@/pages/app"
import { Billing } from "@/pages/billing"
import { Chat } from "@/pages/chat"

export function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <RequireGuest>
              <Login />
            </RequireGuest>
          }
        />
        <Route
          path="/signup"
          element={
            <RequireGuest>
              <Signup />
            </RequireGuest>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <RequireGuest>
              <ForgotPassword />
            </RequireGuest>
          }
        />
        <Route
          path="/reset-password"
          element={
            <RequireGuest>
              <ResetPassword />
            </RequireGuest>
          }
        />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppPage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <Chat />
            </RequireAuth>
          }
        />
        <Route
          path="/billing"
          element={
            <RequireAuth>
              <Billing />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </>
  )
}

export default App
