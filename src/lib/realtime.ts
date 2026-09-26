import type { RealtimeChannel } from '@supabase/supabase-js'
import { AppState } from 'react-native'
import { supabase } from '@/lib/supabase'

// Port of Sambo-web src/lib/realtime.ts: the browser's visibilitychange /
// online events become AppState changes (a phone suspends sockets while
// the app is in the background).

type ChannelOptions = Parameters<typeof supabase.channel>[1]
export type ChannelStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR'

export interface ChannelHandlers {
  /** Every status change of the underlying channel. */
  onStatus?: (status: ChannelStatus, channel: RealtimeChannel) => void
  /**
   * The channel is live again after a gap during which events may have been
   * missed: reconnection, rejoin after an error, the app back in the
   * foreground. Refetch what the screen shows.
   */
  onResync?: () => void
}

// Pending removals, per topic.
const removals = new Map<string, Promise<unknown>>()

const RETRY_DELAYS_MS = [1000, 2000, 5000, 10_000, 30_000]
/** While the channel is down, the screen still refreshes this often. */
const FALLBACK_POLL_MS = 10_000

/**
 * Opens a Realtime channel, keeps it alive, and returns its cleanup, for
 * use in effects. `setup` binds the listeners (it runs again for each new
 * channel); this function subscribes.
 *
 * - The session token is handed to Realtime *before* joining, otherwise the
 *   join can go out as the anonymous key and RLS silently delivers nothing.
 * - On error, time-out or unexpected close, the channel is rebuilt with a
 *   growing delay.
 * - A quick unmount/remount waits for the previous removal of the same
 *   topic, so its listeners don't die with the old channel.
 */
export function openChannel(
  topic: string,
  options: ChannelOptions,
  setup: (channel: RealtimeChannel) => void,
  handlers: ChannelHandlers = {},
): () => void {
  let channel: RealtimeChannel | null = null
  let cancelled = false
  let everSubscribed = false
  let attempt = 0
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let pollTimer: ReturnType<typeof setInterval> | undefined

  function setLive(live: boolean) {
    if (live || !handlers.onResync) {
      clearInterval(pollTimer)
      pollTimer = undefined
    } else if (pollTimer === undefined) {
      pollTimer = setInterval(() => handlers.onResync?.(), FALLBACK_POLL_MS)
    }
  }

  function remove(ch: RealtimeChannel) {
    const removal = supabase.removeChannel(ch)
    removals.set(topic, removal)
    removal.finally(() => {
      if (removals.get(topic) === removal) removals.delete(topic)
    })
  }

  async function connect() {
    await (removals.get(topic) ?? Promise.resolve())
    if (cancelled) return
    try {
      await supabase.realtime.setAuth()
    } catch {
      // A failure shows up as a channel error below and is retried.
    }
    if (cancelled) return

    const ch = supabase.channel(topic, options)
    channel = ch
    setup(ch)
    ch.subscribe((status, err) => {
      if (cancelled || ch !== channel) return
      handlers.onStatus?.(status as ChannelStatus, ch)
      setLive(status === 'SUBSCRIBED')
      if (status === 'SUBSCRIBED') {
        attempt = 0
        if (everSubscribed) handlers.onResync?.()
        everSubscribed = true
      } else {
        if (err) console.warn(`Realtime « ${topic} » : ${status}`, err)
        scheduleRetry()
      }
    })
  }

  function scheduleRetry() {
    if (cancelled || retryTimer !== undefined) return
    const ch = channel
    channel = null
    if (ch) remove(ch)
    const delay = RETRY_DELAYS_MS[Math.min(attempt, RETRY_DELAYS_MS.length - 1)]
    attempt++
    retryTimer = setTimeout(() => {
      retryTimer = undefined
      void connect()
    }, delay)
  }

  // Back to the foreground: the socket may have died, and events may have
  // been missed either way.
  const appState = AppState.addEventListener('change', (state) => {
    if (cancelled || state !== 'active') return
    handlers.onResync?.()
    if (!supabase.realtime.isConnected()) supabase.realtime.connect()
    if (!channel && retryTimer !== undefined) {
      clearTimeout(retryTimer)
      retryTimer = undefined
      attempt = 0
      void connect()
    }
  })

  setLive(false)
  void connect()

  return () => {
    cancelled = true
    appState.remove()
    clearTimeout(retryTimer)
    clearInterval(pollTimer)
    if (channel) remove(channel)
    channel = null
  }
}
