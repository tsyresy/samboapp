import { useEffect, useMemo, useState } from 'react'
import { Alert, FlatList, Pressable, Text, View } from 'react-native'
import { Composer } from '@/components/Composer'
import { Avatar, EmptyState, Loading } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { useOnlineMembers } from '@/context/presence'
import { fetchMemberMap, type MemberInfo } from '@/lib/authors'
import { formatDay, formatTime, fullName, sameDay, shortName } from '@/lib/format'
import { openChannel } from '@/lib/realtime'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface MessageRow {
  id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

const HISTORY_LIMIT = 200

/** The site's global chat room (chat_messages, channel « chat:global »). */
export function GroupChat() {
  const { profile } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const online = useOnlineMembers()
  const [members, setMembers] = useState<Record<string, MemberInfo>>({})
  // Newest first: the list is inverted so it opens on the latest message.
  const [messages, setMessages] = useState<MessageRow[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () =>
      Promise.all([
        supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(HISTORY_LIMIT),
        fetchMemberMap(),
      ]).then(([messagesRes, memberMap]) => {
        if (messagesRes.error) setError(messagesRes.error.message)
        setMessages(messagesRes.data ?? [])
        setMembers(memberMap)
        setLoading(false)
      })
    void load()

    return openChannel(
      'chat:global',
      undefined,
      (channel) => {
        channel.on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as MessageRow
            setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [row, ...prev]))
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as MessageRow
            setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)))
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as Partial<MessageRow>).id
            setMessages((prev) => prev.filter((m) => m.id !== id))
          }
        })
      },
      // Messages sent while the connection was down: reload the history.
      { onResync: () => void load() },
    )
  }, [])

  // Online members first, then alphabetical.
  const memberList = useMemo(
    () =>
      Object.values(members).sort((a, b) => {
        const byOnline = Number(online.has(b.id)) - Number(online.has(a.id))
        return byOnline || fullName(a).localeCompare(fullName(b), 'fr')
      }),
    [members, online],
  )
  const onlineCount = memberList.filter((m) => online.has(m.id)).length

  async function send() {
    const content = draft.trim()
    if (!profile || !content || sending) return
    setSending(true)
    const { data, error: insertError } = await supabase.from('chat_messages').insert({ author_id: profile.id, content }).select().single()
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setError('')
    setDraft('')
    setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [data, ...prev]))
  }

  function openActions(msg: MessageRow) {
    const mine = msg.author_id === profile?.id
    const hidden = msg.status === 'hidden'
    if (!mine && !isAdmin) return
    Alert.alert('Message', undefined, [
      ...(mine
        ? [
            {
              text: 'Supprimer',
              style: 'destructive' as const,
              onPress: async () => {
                const { error: e } = await supabase.from('chat_messages').delete().eq('id', msg.id)
                if (e) setError(e.message)
                else setMessages((prev) => prev.filter((m) => m.id !== msg.id))
              },
            },
          ]
        : []),
      ...(isAdmin && !mine
        ? [
            {
              text: hidden ? 'Réafficher' : 'Masquer',
              onPress: async () => {
                const status = hidden ? 'visible' : 'hidden'
                const { error: e } = await supabase.from('chat_messages').update({ status }).eq('id', msg.id)
                if (e) setError(e.message)
                else setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, status } : m)))
              },
            },
          ]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ])
  }

  if (!profile || loading) return <Loading />

  return (
    <View style={{ flex: 1 }}>
      {/* Who's here */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 10 }}>
        <Text style={{ color: colors.inkSubtle, fontSize: 12, paddingHorizontal: 16, marginBottom: 8 }}>
          {onlineCount} en ligne · {memberList.length} membres
        </Text>
        <FlatList
          horizontal
          data={memberList}
          keyExtractor={(m) => m.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={{ width: 54, alignItems: 'center', gap: 4 }}>
              <Avatar name={fullName(item)} photoUrl={item.photo_url} size={46} online={online.has(item.id)} />
              <Text numberOfLines={1} style={{ color: colors.inkMuted, fontSize: 11 }}>
                {shortName(item)}
              </Text>
            </View>
          )}
        />
      </View>

      <FlatList
        inverted
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 4 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={{ transform: [{ scaleY: -1 }] }}>
            <EmptyState icon="chatbubbles-outline" title="Aucun message pour l'instant." text="Lancez la conversation !" />
          </View>
        }
        renderItem={({ item: msg, index }) => {
          // Inverted: the previous message in time is the next in the array.
          const older = messages[index + 1]
          const author = members[msg.author_id]
          const mine = msg.author_id === profile.id
          const hidden = msg.status === 'hidden'
          const newDay = !older || !sameDay(older.created_at, msg.created_at)
          const grouped = !newDay && older?.author_id === msg.author_id
          return (
            <View>
              {newDay && <Text style={{ color: colors.inkSubtle, fontSize: 12, fontWeight: '500', textAlign: 'center', marginVertical: 12 }}>{formatDay(msg.created_at)}</Text>}
              <Pressable
                onLongPress={() => openActions(msg)}
                style={{ flexDirection: mine ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, marginTop: grouped ? 0 : 6, opacity: hidden ? 0.5 : 1 }}
              >
                {!mine && (grouped ? <View style={{ width: 30 }} /> : <Avatar name={fullName(author)} photoUrl={author?.photo_url} size={30} />)}
                <View style={{ maxWidth: '78%' }}>
                  {!mine && !grouped && <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: '500', marginLeft: 10, marginBottom: 2 }}>{fullName(author)}</Text>}
                  <View
                    style={{
                      borderRadius: 18,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      backgroundColor: mine ? colors.accentStrong : colors.bubble,
                      borderBottomRightRadius: mine ? 6 : 18,
                      borderBottomLeftRadius: mine ? 18 : 6,
                    }}
                  >
                    <Text style={{ color: mine ? colors.onAccent : colors.ink, fontSize: 15, lineHeight: 21 }}>{msg.content}</Text>
                  </View>
                  <Text style={{ color: colors.inkSubtle, fontSize: 11, marginTop: 2, marginHorizontal: 8, textAlign: mine ? 'right' : 'left' }}>
                    {formatTime(msg.created_at)}
                    {hidden ? ' · masqué' : ''}
                  </Text>
                </View>
              </Pressable>
            </View>
          )
        }}
      />

      <Composer value={draft} onChange={setDraft} onSend={() => void send()} sending={sending} placeholder="Écrire au groupe…" maxLength={2000} error={error} insetBottom={false} />
    </View>
  )
}
