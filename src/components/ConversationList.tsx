import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { FlatList, Pressable, Text, View } from 'react-native'
import { Avatar, Badge, EmptyState, Field, Loading } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { personFrom, useMessaging, type Person } from '@/context/messaging'
import { useOnlineMembers } from '@/context/presence'
import { shortTime } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface Conversation {
  other_id: string
  last_content: string
  last_sender_id: string
  last_at: string
  unread: number
}

/** Private conversations (view my_conversations), plus a member search to
 *  start a new one. */
export function ConversationList() {
  const { profile } = useAuth()
  const { person, loadPeople, onMessage, onResync, unread } = useMessaging()
  const online = useOnlineMembers()
  const [conversations, setConversations] = useState<Conversation[] | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('my_conversations').select('*')
    const rows = (data ?? []).sort((a, b) => b.last_at.localeCompare(a.last_at))
    await loadPeople(rows.map((r) => r.other_id))
    setConversations(rows)
  }, [loadPeople])

  // Reload on every new message, whenever the unread total moves, after a
  // Realtime gap, and when coming back from a conversation.
  useEffect(() => {
    // False positive: the loader awaits the server before any setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    const offMessage = onMessage(() => void load())
    const offResync = onResync(() => void load())
    return () => {
      offMessage()
      offResync()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread])
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    const timer = setTimeout(async () => {
      const pattern = `%${q.replace(/[%_,()]/g, ' ')}%`
      const { data } = await supabase
        .from('directory_profiles')
        .select('id, last_name, first_names, nickname, photo_url')
        .or(`last_name.ilike.${pattern},first_names.ilike.${pattern},nickname.ilike.${pattern}`)
        .neq('id', profile?.id ?? '')
        .limit(12)
      setResults((data ?? []).map(personFrom))
    }, 250)
    return () => clearTimeout(timer)
  }, [query, profile?.id])

  const searching = query.trim().length >= 2
  const open = (id: string) => router.push({ pathname: '/conversation/[id]', params: { id } })

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        <Field value={query} onChangeText={setQuery} placeholder="Écrire à un membre…" autoCorrect={false} style={{ borderRadius: 999 }} />
      </View>

      {searching ? (
        <FlatList
          data={results}
          keyExtractor={(p) => p.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<EmptyState icon="search-outline" title="Aucun membre trouvé." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setQuery('')
                open(item.id)
              }}
              style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: pressed ? colors.glass : 'transparent' })}
            >
              <Avatar name={item.name} photoUrl={item.photoUrl} size={40} online={online.has(item.id)} />
              <Text style={{ color: colors.ink, fontSize: 15 }}>{item.name}</Text>
            </Pressable>
          )}
        />
      ) : conversations === null ? (
        <Loading />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.other_id}
          ListEmptyComponent={
            <EmptyState icon="mail-outline" title="Aucune conversation" text="Cherchez un membre ci-dessus, ou utilisez « Écrire » dans l'annuaire." />
          }
          renderItem={({ item: c }) => {
            const other = person(c.other_id)
            const name = other?.name ?? 'Membre'
            return (
              <Pressable
                onPress={() => open(c.other_id)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: pressed ? colors.glass : 'transparent' })}
              >
                <Avatar name={name} photoUrl={other?.photoUrl} size={50} online={online.has(c.other_id)} />
                <View style={{ flex: 1, gap: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: colors.ink, fontSize: 15, fontWeight: c.unread ? '700' : '500' }}>
                      {name}
                    </Text>
                    <Text style={{ color: c.unread ? colors.accent : colors.inkSubtle, fontSize: 12 }}>{shortTime(c.last_at)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text numberOfLines={1} style={{ flex: 1, color: c.unread ? colors.ink : colors.inkSubtle, fontSize: 13 }}>
                      {c.last_sender_id === profile?.id ? 'Vous : ' : ''}
                      {c.last_content}
                    </Text>
                    <Badge count={c.unread} />
                  </View>
                </View>
              </Pressable>
            )
          }}
        />
      )}
    </View>
  )
}
