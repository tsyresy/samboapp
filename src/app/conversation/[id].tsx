import { Stack, useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native'
import { Composer } from '@/components/Composer'
import { Avatar, Backdrop, Loading } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { formatCallDuration, useMessaging, type PrivateCall, type PrivateMessage } from '@/context/messaging'
import { useOnlineMembers } from '@/context/presence'
import { formatDay, formatTime, sameDay, shortTime } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

const PAGE_SIZE = 100

type TimelineItem = { kind: 'message'; at: string; message: PrivateMessage } | { kind: 'call'; at: string; call: PrivateCall }

function callLabel(call: PrivateCall, me: string) {
  const outgoing = call.caller_id === me
  switch (call.status) {
    case 'ended':
      return `Appel vidéo · ${formatCallDuration(call)}`
    case 'accepted':
      return 'Appel vidéo en cours'
    case 'ringing':
      return outgoing ? 'Appel vidéo…' : 'Appel vidéo entrant (sur le site)'
    case 'declined':
      return 'Appel refusé'
    case 'cancelled':
      return outgoing ? 'Appel annulé' : 'Appel manqué'
    case 'missed':
      return outgoing ? 'Pas de réponse' : 'Appel manqué'
  }
}

/** A private conversation — only the two members can read it (RLS). */
export default function Conversation() {
  const { id: otherId } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const me = profile!.id
  const headerHeight = useHeaderHeight()
  const online = useOnlineMembers()
  const { person, loadPeople, onMessage, onCallUpdate, onResync, refreshUnread } = useMessaging()
  const other = person(otherId)
  const [messages, setMessages] = useState<PrivateMessage[]>([])
  const [calls, setCalls] = useState<PrivateCall[]>([])
  const [hasOlder, setHasOlder] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const pair = `and(sender_id.eq.${me},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${me})`
  const callPair = `and(caller_id.eq.${me},callee_id.eq.${otherId}),and(caller_id.eq.${otherId},callee_id.eq.${me})`

  async function markRead() {
    const { count } = await supabase
      .from('private_messages')
      .update({ read_at: new Date().toISOString() }, { count: 'exact' })
      .eq('sender_id', otherId)
      .eq('recipient_id', me)
      .is('read_at', null)
    if (count) refreshUnread()
  }

  useEffect(() => {
    let cancelled = false
    void loadPeople([otherId])
    // Latest page. Also run after a Realtime gap (older pages are kept).
    const load = () =>
      Promise.all([
        supabase.from('private_messages').select('*').or(pair).order('created_at', { ascending: false }).limit(PAGE_SIZE),
        supabase.from('private_calls').select('*').or(callPair).order('created_at', { ascending: false }).limit(PAGE_SIZE),
      ]).then(([messagesRes, callsRes]) => {
        if (cancelled) return
        if (messagesRes.error) setError(messagesRes.error.message)
        const latest = (messagesRes.data ?? []).reverse()
        setMessages((prev) => {
          if (!latest.length) return latest
          const older = prev.filter((m) => m.created_at < latest[0].created_at)
          return [...older, ...latest]
        })
        setHasOlder((had) => had || latest.length === PAGE_SIZE)
        setCalls(callsRes.data ?? [])
        setLoaded(true)
        void markRead()
      })
    void load()

    const offMessage = onMessage((message, event) => {
      const inThis =
        (message.sender_id === otherId && message.recipient_id === me) || (message.sender_id === me && message.recipient_id === otherId)
      if (!inThis) return
      if (event === 'INSERT') {
        setMessages((prev) => (prev.some((m) => m.id === message.id) ? prev : [...prev, message]))
        if (message.sender_id === otherId) void markRead()
      } else {
        setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)))
      }
    })
    const offCall = onCallUpdate((call) => {
      if (![call.caller_id, call.callee_id].includes(otherId)) return
      setCalls((prev) => (prev.some((c) => c.id === call.id) ? prev.map((c) => (c.id === call.id ? call : c)) : [call, ...prev]))
    })
    const offResync = onResync(() => void load())
    return () => {
      cancelled = true
      offMessage()
      offCall()
      offResync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherId])

  const oldestLoaded = messages[0]?.created_at
  // Newest first, for the inverted list.
  const timeline = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [
      ...messages.map((message) => ({ kind: 'message' as const, at: message.created_at, message })),
      ...calls
        .filter((call) => !hasOlder || !oldestLoaded || call.created_at >= oldestLoaded)
        .map((call) => ({ kind: 'call' as const, at: call.created_at, call })),
    ]
    return items.sort((a, b) => b.at.localeCompare(a.at))
  }, [messages, calls, hasOlder, oldestLoaded])

  async function loadOlder() {
    if (!oldestLoaded || !hasOlder) return
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .or(pair)
      .lt('created_at', oldestLoaded)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    const rows = data ?? []
    setHasOlder(rows.length === PAGE_SIZE)
    setMessages((prev) => [...rows.reverse(), ...prev])
  }

  async function send() {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    const { data, error: insertError } = await supabase
      .from('private_messages')
      .insert({ sender_id: me, recipient_id: otherId, content })
      .select()
      .single()
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setError('')
    setDraft('')
    setMessages((prev) => [...prev, data])
  }

  function confirmDelete(m: PrivateMessage) {
    Alert.alert('Supprimer ce message ?', 'Il disparaîtra aussi pour votre correspondant.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          const { error: e } = await supabase.from('private_messages').delete().eq('id', m.id)
          if (e) setError(e.message)
          else setMessages((prev) => prev.filter((x) => x.id !== m.id))
        },
      },
    ])
  }

  const lastMineId = [...messages].reverse().find((m) => m.sender_id === me)?.id
  const name = other?.name ?? 'Membre'
  const isOnline = online.has(otherId)

  return (
    <Backdrop>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={name} photoUrl={other?.photoUrl} size={34} online={isOnline} />
              <View>
                <Text numberOfLines={1} style={{ color: colors.ink, fontWeight: '600', fontSize: 16, maxWidth: 220 }}>
                  {name}
                </Text>
                <Text style={{ color: isOnline ? colors.accent : colors.inkSubtle, fontSize: 11 }}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
              </View>
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={headerHeight}>
        {!loaded ? (
          <Loading />
        ) : (
          <FlatList
            inverted
            data={timeline}
            keyExtractor={(item) => (item.kind === 'message' ? item.message.id : item.call.id)}
            contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 4, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            onEndReached={() => void loadOlder()}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={
              <View style={{ transform: [{ scaleY: -1 }], flex: 1, justifyContent: 'center', padding: 24 }}>
                <Text style={{ color: colors.inkSubtle, textAlign: 'center' }}>
                  Début de votre conversation privée avec {name}. Personne d’autre ne peut la lire.
                </Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const older = timeline[index + 1]
              const newDay = !older || !sameDay(older.at, item.at)
              return (
                <View>
                  {newDay && <Text style={{ color: colors.inkSubtle, fontSize: 12, fontWeight: '500', textAlign: 'center', marginVertical: 12 }}>{formatDay(item.at)}</Text>}
                  {item.kind === 'call' ? (
                    <View style={{ alignItems: 'center', marginVertical: 4 }}>
                      <Text style={{ color: colors.inkMuted, fontSize: 12, backgroundColor: 'rgba(255,255,255,0.07)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, overflow: 'hidden' }}>
                        📹 {callLabel(item.call, me)} · {shortTime(item.at)}
                      </Text>
                    </View>
                  ) : (
                    (() => {
                      const m = item.message
                      const mine = m.sender_id === me
                      return (
                        <Pressable onLongPress={mine ? () => confirmDelete(m) : undefined} style={{ alignItems: mine ? 'flex-end' : 'flex-start', marginTop: 2 }}>
                          <View
                            style={{
                              maxWidth: '80%',
                              borderRadius: 18,
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              backgroundColor: mine ? colors.accentStrong : colors.bubble,
                              borderBottomRightRadius: mine ? 6 : 18,
                              borderBottomLeftRadius: mine ? 18 : 6,
                            }}
                          >
                            <Text selectable style={{ color: mine ? colors.onAccent : colors.ink, fontSize: 15, lineHeight: 21 }}>
                              {m.content}
                            </Text>
                          </View>
                          <Text style={{ color: colors.inkSubtle, fontSize: 11, marginTop: 2, marginHorizontal: 8 }}>
                            {formatTime(m.created_at)}
                            {mine && m.id === lastMineId && m.read_at ? ' · Vu' : ''}
                          </Text>
                        </Pressable>
                      )
                    })()
                  )}
                </View>
              )
            }}
          />
        )}
        <Composer value={draft} onChange={setDraft} onSend={() => void send()} sending={sending} placeholder={`Message à ${name}…`} maxLength={4000} error={error} />
      </KeyboardAvoidingView>
    </Backdrop>
  )
}
