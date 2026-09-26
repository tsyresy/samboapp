import type { RealtimeChannel } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { AppState } from 'react-native'
import { useAuth } from '@/context/auth'
import { openChannel } from '@/lib/realtime'

const PresenceContext = createContext<Set<string>>(new Set())

/**
 * Same Realtime Presence channel as the website (« presence:membres »), so
 * a member shows as « en ligne » whether they use the site or the app.
 * Leaves while the app is in the background.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const profileId = profile?.status === 'valide' ? profile.id : undefined
  const [online, setOnline] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!profileId) return

    let current: RealtimeChannel | null = null
    const close = openChannel(
      'presence:membres',
      { config: { presence: { key: profileId } } },
      (channel) => {
        current = channel
        channel.on('presence', { event: 'sync' }, () => {
          setOnline(new Set(Object.keys(channel.presenceState())))
        })
      },
      {
        // Also after each rejoin: presence is per connection.
        onStatus: (status, channel) => {
          if (status === 'SUBSCRIBED' && AppState.currentState === 'active') {
            void channel.track({ online_at: new Date().toISOString(), app: 'mobile' })
          }
        },
      },
    )

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void current?.track({ online_at: new Date().toISOString(), app: 'mobile' })
      else void current?.untrack()
    })

    return () => {
      sub.remove()
      close()
      setOnline(new Set())
    }
  }, [profileId])

  return <PresenceContext.Provider value={online}>{children}</PresenceContext.Provider>
}

/** Profile ids of the members currently connected (site or app). */
export function useOnlineMembers() {
  return useContext(PresenceContext)
}
