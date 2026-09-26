import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '@/context/auth'
import type { Database } from '@/lib/database'
import { openChannel } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'

export type PrivateMessage = Database['public']['Tables']['private_messages']['Row']
export type PrivateCall = Database['public']['Tables']['private_calls']['Row']

export interface Person {
  id: string
  name: string
  photoUrl: string | null
}

interface MessagingValue {
  /** Unread private messages, all conversations (tab badge). */
  unread: number
  refreshUnread: () => void
  /** Live private messages involving me; returns the unsubscribe function. */
  onMessage: (listener: (message: PrivateMessage, event: 'INSERT' | 'UPDATE') => void) => () => void
  onCallUpdate: (listener: (call: PrivateCall) => void) => () => void
  /** Realtime came back after a gap: reload what the screen shows. */
  onResync: (listener: () => void) => () => void
  person: (profileId: string) => Person | undefined
  loadPeople: (profileIds: string[]) => Promise<void>
}

const MessagingContext = createContext<MessagingValue | undefined>(undefined)

export function personFrom(row: {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
}): Person {
  const name = [row.last_name, row.first_names].filter(Boolean).join(' ') || row.nickname || 'Membre'
  return { id: row.id, name, photoUrl: row.photo_url }
}

/**
 * Private messages for the whole app: the unread count and live updates,
 * over the same channel shape as the site (« prive:<profile id> »).
 * Video calls are web-only for now (they need WebRTC in a development
 * build); their history still shows in conversations.
 */
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const me = profile?.status === 'valide' ? profile.id : undefined

  const [unread, setUnread] = useState(0)
  const [people, setPeople] = useState<Record<string, Person>>({})
  const peopleRef = useRef(people)
  const messageListeners = useRef(new Set<(m: PrivateMessage, e: 'INSERT' | 'UPDATE') => void>())
  const callListeners = useRef(new Set<(c: PrivateCall) => void>())
  const resyncListeners = useRef(new Set<() => void>())

  const refreshUnread = useCallback(() => {
    supabase
      .from('my_conversations')
      .select('unread')
      .then(({ data }) => setUnread((data ?? []).reduce((sum, c) => sum + c.unread, 0)))
  }, [])

  const loadPeople = useCallback(async (ids: string[]) => {
    const missing = [...new Set(ids)].filter((id) => !peopleRef.current[id])
    if (!missing.length) return
    const { data } = await supabase
      .from('directory_profiles')
      .select('id, last_name, first_names, nickname, photo_url')
      .in('id', missing)
    const found = Object.fromEntries((data ?? []).map((row) => [row.id, personFrom(row)]))
    peopleRef.current = { ...peopleRef.current, ...found }
    setPeople(peopleRef.current)
  }, [])

  useEffect(() => {
    if (!me) return
    refreshUnread()
    const table = (name: string, event: 'INSERT' | 'UPDATE', filter: string) =>
      ({ event, schema: 'public', table: name, filter }) as const
    const close = openChannel(
      `prive:${me}`,
      undefined,
      (channel) => {
        channel
          .on('postgres_changes', table('private_messages', 'INSERT', `recipient_id=eq.${me}`), ({ new: row }) => {
            for (const listener of messageListeners.current) listener(row as PrivateMessage, 'INSERT')
            refreshUnread()
          })
          // Read receipts on the messages I sent.
          .on('postgres_changes', table('private_messages', 'UPDATE', `sender_id=eq.${me}`), ({ new: row }) => {
            for (const listener of messageListeners.current) listener(row as PrivateMessage, 'UPDATE')
          })
          .on('postgres_changes', table('private_calls', 'INSERT', `callee_id=eq.${me}`), ({ new: row }) => {
            for (const listener of callListeners.current) listener(row as PrivateCall)
          })
          .on('postgres_changes', table('private_calls', 'UPDATE', `caller_id=eq.${me}`), ({ new: row }) => {
            for (const listener of callListeners.current) listener(row as PrivateCall)
          })
          .on('postgres_changes', table('private_calls', 'UPDATE', `callee_id=eq.${me}`), ({ new: row }) => {
            for (const listener of callListeners.current) listener(row as PrivateCall)
          })
      },
      {
        onResync: () => {
          refreshUnread()
          for (const listener of resyncListeners.current) listener()
        },
      },
    )
    return close
  }, [me, refreshUnread])

  const value: MessagingValue = {
    unread,
    refreshUnread,
    onMessage: (listener) => {
      messageListeners.current.add(listener)
      return () => messageListeners.current.delete(listener)
    },
    onCallUpdate: (listener) => {
      callListeners.current.add(listener)
      return () => callListeners.current.delete(listener)
    },
    onResync: (listener) => {
      resyncListeners.current.add(listener)
      return () => resyncListeners.current.delete(listener)
    },
    person: (id) => people[id],
    loadPeople,
  }

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}

export function useMessaging() {
  const ctx = useContext(MessagingContext)
  if (!ctx) throw new Error('useMessaging must be used within MessagingProvider')
  return ctx
}

export function formatCallDuration(call: PrivateCall) {
  if (!call.answered_at || !call.ended_at) return ''
  const seconds = Math.max(0, Math.round((Date.parse(call.ended_at) - Date.parse(call.answered_at)) / 1000))
  if (seconds < 60) return `${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')}`
}
