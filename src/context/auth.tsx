import type { Session, User } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

export interface AuthContextValue {
  session: Session | null
  user: User | null
  profile: Profile | null
  /** True while the stored session is being restored. */
  loading: boolean
  /** True while the profile row of the signed-in user is not fetched yet. */
  profileLoading: boolean
  /** Re-reads the profile row (after an edit). */
  reloadProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** What was fetched, tagged with which user it's for (same approach as the
 *  site's AuthContext: profile and profileLoading derive from it). */
interface LoadedProfile {
  userId: string
  profile: Profile | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null)

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession((prev) => {
        // A session momentarily reported as null next to a real previous
        // one (not an actual sign-out) is noise, not a logout.
        if (!newSession && prev && event !== 'SIGNED_OUT') return prev
        return newSession
      })
      setLoading(false)
    })
    return () => subscription.subscription.unsubscribe()
  }, [])

  const userId = session?.user?.id
  const profile = loaded && loaded.userId === userId ? loaded.profile : null
  const profileLoading = !!userId && loaded?.userId !== userId

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', uid).maybeSingle()
    return data
  }, [])

  useEffect(() => {
    if (!userId || loaded?.userId === userId) return
    let cancelled = false
    fetchProfile(userId).then((data) => {
      if (!cancelled) setLoaded({ userId, profile: data })
    })
    return () => {
      cancelled = true
    }
  }, [userId, loaded, fetchProfile])

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileLoading,
    reloadProfile: async () => {
      if (!userId) return
      const data = await fetchProfile(userId)
      setLoaded({ userId, profile: data })
    },
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
