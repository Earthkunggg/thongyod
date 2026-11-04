import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { isOnboarded } from './storage'

/** Sends first-time visitors of Home to /welcome. Deep links (invites, profiles) are never blocked. */
export function OnboardingGate({ children }: { children: ReactNode }) {
  if (!isOnboarded()) return <Navigate to="/welcome" replace />
  return children
}
