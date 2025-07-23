"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export interface User {
  id: number
  username: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is authenticated on initial load
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await checkAuth()
      setIsLoading(false)
    }
    initAuth()
  }, [])

  // Function to check authentication status
  const checkAuth = async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/session")
      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setUser(data.user)
          return true
        }
      }
      setUser(null)
      return false
    } catch (error) {
      console.error("Authentication check failed:", error)
      setUser(null)
      return false
    }
  }

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)

        // Track login activity in local storage
        if (data.activity && data.user.id) {
          const storedActivities = localStorage.getItem(`user_activities_${data.user.id}`)
          const activities = storedActivities ? JSON.parse(storedActivities) : []

          const newActivity = {
            id: `activity-${Date.now()}`,
            action: data.activity.action,
            timestamp: new Date().toISOString(),
            details: data.activity.details,
          }

          const updatedActivities = [newActivity, ...activities].slice(0, 10)
          localStorage.setItem(`user_activities_${data.user.id}`, JSON.stringify(updatedActivities))

          // Initialize performance data if it doesn't exist
          if (!localStorage.getItem(`user_performance_${data.user.id}`)) {
            localStorage.setItem(
              `user_performance_${data.user.id}`,
              JSON.stringify({
                resolved: Math.floor(Math.random() * 30) + 50,
                pending: Math.floor(Math.random() * 15) + 5,
                overdue: Math.floor(Math.random() * 10),
              }),
            )
          }
        }

        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await fetch("/api/auth/logout", {
        method: "POST",
      })
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

