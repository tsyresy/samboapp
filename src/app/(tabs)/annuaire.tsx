import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar, Backdrop, EmptyState, ErrorText, Field, IconButton, Loading, Title } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { useOnlineMembers } from '@/context/presence'
import { fullName } from '@/lib/format'
import { CATEGORY_LABELS } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'
import type { MembershipCategory } from '@/lib/types'

interface DirectoryEntry {
  id: string
  member_number: string | null
  last_name: string | null
  first_names: string | null
  nickname: string | null
  category: MembershipCategory
  photo_url: string | null
  phone: string | null
  email: string | null
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected: active }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: active ? colors.accentStrong : 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: active ? colors.accentStrong : colors.line,
      }}
    >
      <Text style={{ color: active ? colors.onAccent : colors.inkMuted, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  )
}

/** Validated members (view directory_profiles), searchable by name,
 *  nickname, number or bureau position. */
export default function Directory() {
  const { profile } = useAuth()
  const online = useOnlineMembers()
  const [members, setMembers] = useState<DirectoryEntry[] | null>(null)
  const [positions, setPositions] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<MembershipCategory | ''>('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const [membersRes, positionsRes] = await Promise.all([
      supabase.from('directory_profiles').select('*'),
      supabase.from('public_office_team').select('profile_id, position_title'),
    ])
    if (membersRes.error) setError(membersRes.error.message)
    setMembers((membersRes.data ?? []).sort((a, b) => fullName(a).localeCompare(fullName(b), 'fr')))
    const posMap: Record<string, string> = {}
    for (const p of positionsRes.data ?? []) posMap[p.profile_id] = p.position_title
    setPositions(posMap)
  }, [])

  useEffect(() => {
    // False positive: the loader awaits the server before any setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (members ?? []).filter((m) => {
      if (category && m.category !== category) return false
      if (!q) return true
      return [m.last_name, m.first_names, m.nickname, m.member_number, positions[m.id]].filter(Boolean).join(' ').toLowerCase().includes(q)
    })
  }, [members, search, category, positions])

  return (
    <Backdrop>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
          <Title>Annuaire</Title>
          <Field value={search} onChangeText={setSearch} placeholder="Nom, surnom, numéro ou fonction…" autoCorrect={false} style={{ borderRadius: 999 }} />
        </View>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
            <Chip label="Tous" active={!category} onPress={() => setCategory('')} />
            {(Object.entries(CATEGORY_LABELS) as [MembershipCategory, string][]).map(([value, label]) => (
              <Chip key={value} label={label} active={category === value} onPress={() => setCategory(category === value ? '' : value)} />
            ))}
          </ScrollView>
        </View>
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorText>{error}</ErrorText>
        </View>

        {members === null ? (
          <Loading />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(m) => m.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 24 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true)
                  await load()
                  setRefreshing(false)
                }}
                tintColor={colors.accent}
                colors={[colors.accentStrong]}
              />
            }
            ListHeaderComponent={
              <Text style={{ color: colors.inkSubtle, fontSize: 12, paddingHorizontal: 16, marginBottom: 4 }}>
                {filtered.length} membre{filtered.length > 1 ? 's' : ''}
              </Text>
            }
            ListEmptyComponent={<EmptyState icon="people-outline" title="Aucun membre trouvé." />}
            renderItem={({ item: m }) => {
              const isMe = m.id === profile?.id
              return (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}>
                  <Avatar name={fullName(m)} photoUrl={m.photo_url} size={52} online={online.has(m.id)} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={{ color: colors.ink, fontSize: 15, fontWeight: '600' }}>
                      {fullName(m, '(nom non renseigné)')}
                      {isMe ? <Text style={{ color: colors.inkSubtle, fontWeight: '400' }}> (vous)</Text> : null}
                    </Text>
                    {m.nickname && (
                      <Text numberOfLines={1} style={{ color: colors.inkSubtle, fontSize: 12 }}>
                        « {m.nickname} »
                      </Text>
                    )}
                    <Text numberOfLines={1} style={{ color: positions[m.id] ? colors.gold : colors.inkMuted, fontSize: 12, marginTop: 1 }}>
                      {positions[m.id] ?? CATEGORY_LABELS[m.category]}
                      {m.member_number ? <Text style={{ color: colors.inkSubtle }}> · {m.member_number}</Text> : null}
                    </Text>
                    {m.email && (
                      <Text numberOfLines={1} style={{ color: colors.inkSubtle, fontSize: 12 }}>
                        {m.email}
                      </Text>
                    )}
                  </View>
                  {!isMe && (
                    <View style={{ flexDirection: 'row' }}>
                      {m.phone && <IconButton icon="call-outline" label={`Appeler ${fullName(m)}`} color={colors.accent} onPress={() => void Linking.openURL(`tel:${m.phone}`)} />}
                      <IconButton
                        icon="chatbubble-ellipses-outline"
                        label={`Écrire à ${fullName(m)}`}
                        color={colors.accent}
                        onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: m.id } })}
                      />
                    </View>
                  )}
                </View>
              )
            }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 80 }} />}
          />
        )}
      </SafeAreaView>
    </Backdrop>
  )
}
