import { useEffect, useState } from 'react'
import { FlatList, Text, View } from 'react-native'
import { Avatar } from '@/components/ui'
import { fullName } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface UnpaidMember {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
  unpaid_months: number
}

/**
 * « Membres TSY NAHALOHA ADIDY » — the site's unpaid wall, as a horizontal
 * strip: every validated member with unpaid adidy up to today (view
 * unpaid_members). Names, photos and a month count only, never amounts.
 */
export function UnpaidStrip({ refreshKey }: { refreshKey?: number }) {
  const [members, setMembers] = useState<UnpaidMember[] | null>(null)

  useEffect(() => {
    supabase
      .from('unpaid_members')
      .select('id, last_name, first_names, nickname, photo_url, unpaid_months')
      .order('unpaid_months', { ascending: false })
      .then(({ data }) => setMembers(data ?? []))
  }, [refreshKey])

  return (
    <View
      style={{
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.dangerLine,
        backgroundColor: colors.dangerBg,
        paddingVertical: 14,
        gap: 10,
      }}
    >
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={{ color: colors.danger, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 }}>MEMBRES TSY NAHALOHA ADIDY</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 12, marginTop: 2 }}>Cotisations non réglées à la date du jour</Text>
      </View>

      {members === null ? (
        <Text style={{ color: colors.inkSubtle, paddingHorizontal: 16 }}>Chargement…</Text>
      ) : members.length === 0 ? (
        <Text style={{ color: colors.accent, fontWeight: '600', paddingHorizontal: 16 }}>Tout le monde est à jour. Misaotra betsaka !</Text>
      ) : (
        <FlatList
          horizontal
          data={members}
          keyExtractor={(m) => m.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View
              style={{
                width: 112,
                alignItems: 'center',
                gap: 6,
                padding: 10,
                borderRadius: 16,
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderWidth: 1,
                borderColor: colors.dangerLine,
              }}
            >
              <Avatar name={fullName(item)} photoUrl={item.photo_url} size={48} />
              <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                {fullName(item)}
              </Text>
              <Text style={{ color: colors.danger, fontSize: 11, fontWeight: '600' }}>
                {item.unpaid_months} mois impayé{item.unpaid_months > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  )
}
