import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState, type ReactNode } from 'react'
import { Linking, ScrollView, Text, View } from 'react-native'
import { Avatar, Backdrop, Button, Card, EmptyState, Loading, Pill } from '@/components/ui'
import { useAuth } from '@/context/auth'
import type { MemberCardDetails } from '@/lib/database'
import { formatDate } from '@/lib/format'
import { categoryLabel } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>{label}</Text>
      <Text selectable style={{ color: colors.ink, fontSize: 15, marginTop: 2 }}>
        {value || '—'}
      </Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card style={{ paddingVertical: 8 }}>
      <Text style={{ color: colors.accent, fontSize: 13, fontWeight: '700', marginTop: 6, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.6 }}>
        {title}
      </Text>
      {children}
    </Card>
  )
}

/** Full record of a member, reached by scanning their card
 *  (sambo://membre/<verification id>). Same data as the site's page. */
export default function MemberDetails() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const [member, setMember] = useState<MemberCardDetails | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'not_found' | 'error'>('loading')
  const [error, setError] = useState('')

  const validId = !!id && UUID.test(id)

  useEffect(() => {
    if (!validId) return
    let cancelled = false
    supabase.rpc('member_card_details', { p_verification_id: id.toLowerCase() }).then(({ data, error: rpcError }) => {
      if (cancelled) return
      if (rpcError) {
        setError(rpcError.message)
        setState('error')
      } else if (!data) {
        setState('not_found')
      } else {
        setMember(data)
        setState('ready')
      }
    })
    return () => {
      cancelled = true
    }
  }, [id, validId])

  if (validId && state === 'loading') {
    return (
      <Backdrop>
        <Loading />
      </Backdrop>
    )
  }

  if (!validId || state !== 'ready' || !member) {
    return (
      <Backdrop>
        <EmptyState
          icon="alert-circle-outline"
          title={!validId || state === 'not_found' ? 'Carte introuvable' : "Impossible d'afficher ce membre"}
          text={!validId || state === 'not_found' ? 'Ce code ne correspond à aucune carte SAMBO.' : error}
        />
      </Backdrop>
    )
  }

  const name = [member.last_name, member.first_names].filter(Boolean).join(' ')
  const active = member.card_status === 'active' && member.status === 'valide'
  const isMe = member.profile_id === profile?.id

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        {/* Validity first: that's what a scan is for. */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            padding: 14,
            borderRadius: 18,
            backgroundColor: active ? 'rgba(116,224,161,0.14)' : colors.dangerBg,
            borderWidth: 1,
            borderColor: active ? 'rgba(116,224,161,0.35)' : colors.dangerLine,
          }}
        >
          <Text style={{ fontSize: 22 }}>{active ? '✅' : '⛔'}</Text>
          <Text style={{ color: active ? colors.accent : colors.danger, fontSize: 16, fontWeight: '700', flex: 1 }}>
            {active ? 'Carte valide — membre actif' : 'Carte révoquée ou membre suspendu'}
          </Text>
        </View>

        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 22 }}>
          <Avatar name={name} photoUrl={member.photo_url} size={112} rounded="md" />
          <Text selectable style={{ color: colors.ink, fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 6 }}>
            {name || '(nom non renseigné)'}
          </Text>
          {member.nickname && <Text style={{ color: colors.inkMuted }}>« {member.nickname} »</Text>}
          <Pill label={member.position ?? categoryLabel(member.category)} tone="accent" />
          {member.member_number && <Text style={{ color: colors.inkSubtle, fontSize: 13 }}>N° {member.member_number}</Text>}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            {member.profile_id && !isMe && (
              <Button
                title="Écrire"
                icon="chatbubble-outline"
                small
                onPress={() => router.push({ pathname: '/conversation/[id]', params: { id: member.profile_id! } })}
              />
            )}
            {member.phone && <Button title="Appeler" icon="call-outline" variant="glass" small onPress={() => void Linking.openURL(`tel:${member.phone}`)} />}
          </View>
        </Card>

        <Section title="Identité">
          <Field label="Nom" value={member.last_name} />
          <Field label="Prénom(s)" value={member.first_names} />
          <Field label="Date de naissance" value={formatDate(member.birth_date)} />
          <Field label="Numéro CIN" value={member.cin_number} />
          <Field label="Catégorie" value={categoryLabel(member.category)} />
          <Field label="Fonction au bureau" value={member.position} />
        </Section>

        <Section title="Contact">
          <Field label="Téléphone" value={member.phone} />
          <Field label="Second téléphone" value={member.phone_secondary} />
          <Field label="Email" value={member.email} />
          <Field label="Résidence" value={member.residence} />
        </Section>

        <Section title="Études">
          <Field label="Situation" value={member.still_studying ? 'Étudiant(e)' : "N'étudie plus"} />
          <Field label="Faculté / établissement" value={member.faculty} />
          <Field label="Mention / parcours" value={member.program} />
          <Field label="Niveau" value={member.study_level} />
          <Field label="Carte étudiant" value={member.student_id} />
        </Section>

        <Section title="Contact d'urgence">
          <Field label="Nom" value={member.emergency_contact_name} />
          <Field label="Téléphone" value={member.emergency_contact_phone} />
        </Section>

        <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>
          Carte émise le {formatDate(member.issued_at)}
          {member.revoked_at && ` · révoquée le ${formatDate(member.revoked_at)}`}. Ces informations sont réservées aux membres validés.
        </Text>
      </ScrollView>
    </Backdrop>
  )
}
