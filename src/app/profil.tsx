import { useHeaderHeight } from 'expo-router/react-navigation'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from 'react-native'
import { Avatar, Backdrop, Button, Card, ErrorText, Field, Loading, Subtitle } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { fullName } from '@/lib/format'
import { ACCESS_LEVEL_LABELS, CATEGORY_LABELS, VALIDATION_STATUS_LABELS } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: 130 }}>
      <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '600', marginTop: 2 }}>{value}</Text>
    </View>
  )
}

/** Contact details a member keeps up to date from the phone. Studies and
 *  the photo stay on the site's profile page. */
export default function ProfileScreen() {
  const { profile, reloadProfile, signOut } = useAuth()
  const headerHeight = useHeaderHeight()
  const [form, setForm] = useState({ nickname: '', phone: '', phone_secondary: '', residence: '', show_email_in_directory: false })
  const [emergency, setEmergency] = useState({ contact_name: '', contact_phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fill the form once per member, during render rather than in an effect
  // (same approach as the site), and not again after each save's reload.
  const profileId = profile?.id
  const [formFor, setFormFor] = useState<string | null>(null)
  if (profile && formFor !== profile.id) {
    setFormFor(profile.id)
    setForm({
      nickname: profile.nickname ?? '',
      phone: profile.phone ?? '',
      phone_secondary: profile.phone_secondary ?? '',
      residence: profile.residence ?? '',
      show_email_in_directory: profile.show_email_in_directory,
    })
  }

  useEffect(() => {
    if (!profileId) return
    supabase
      .from('emergency_contacts')
      .select('contact_name, contact_phone')
      .eq('profile_id', profileId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setEmergency(data)
        setLoading(false)
      })
  }, [profileId])

  if (!profile || loading) {
    return (
      <Backdrop>
        <Loading />
      </Backdrop>
    )
  }

  async function save() {
    if (!profile) return
    setSaving(true)
    setError('')
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        nickname: form.nickname.trim() || null,
        phone: form.phone.trim(),
        phone_secondary: form.phone_secondary.trim() || null,
        residence: form.residence.trim(),
        show_email_in_directory: form.show_email_in_directory,
      })
      .eq('id', profile.id)
    if (profileError) {
      setSaving(false)
      setError(profileError.message)
      return
    }
    if (emergency.contact_name.trim() || emergency.contact_phone.trim()) {
      const { error: emergencyError } = await supabase
        .from('emergency_contacts')
        .upsert(
          { profile_id: profile.id, contact_name: emergency.contact_name.trim(), contact_phone: emergency.contact_phone.trim() },
          { onConflict: 'profile_id' },
        )
      if (emergencyError) {
        setSaving(false)
        setError(emergencyError.message)
        return
      }
    }
    await reloadProfile()
    setSaving(false)
    Alert.alert('Profil enregistré', 'Vos informations sont à jour.')
  }

  function confirmSignOut() {
    Alert.alert('Se déconnecter ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: () => void signOut() },
    ])
  }

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={headerHeight}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Avatar name={fullName(profile)} photoUrl={profile.photo_url} size={96} />
            <Text style={{ color: colors.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' }}>{fullName(profile)}</Text>
            <Text style={{ color: colors.inkSubtle }}>{profile.email}</Text>
          </View>

          <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
            <Info label="Numéro de membre" value={profile.member_number ?? '—'} />
            <Info label="Catégorie" value={CATEGORY_LABELS[profile.category]} />
            <Info label="Statut" value={VALIDATION_STATUS_LABELS[profile.status]} />
            <Info label="Accès" value={ACCESS_LEVEL_LABELS[profile.access_level]} />
          </Card>

          <Card style={{ gap: 14 }}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Coordonnées</Text>
            <Field label="Surnom" value={form.nickname} onChangeText={set('nickname')} />
            <Field label="Téléphone" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
            <Field label="Second téléphone" value={form.phone_secondary} onChangeText={set('phone_secondary')} keyboardType="phone-pad" />
            <Field label="Résidence" value={form.residence} onChangeText={set('residence')} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ color: colors.ink, flex: 1 }}>Afficher mon email dans l’annuaire</Text>
              <Switch
                value={form.show_email_in_directory}
                onValueChange={(v) => setForm((f) => ({ ...f, show_email_in_directory: v }))}
                trackColor={{ true: colors.accentStrong, false: 'rgba(255,255,255,0.2)' }}
              />
            </View>
            <Subtitle style={{ fontSize: 12 }}>Votre téléphone est toujours visible des membres validés.</Subtitle>
          </Card>

          <Card style={{ gap: 14 }}>
            <Text style={{ color: colors.accent, fontWeight: '700' }}>Contact d’urgence</Text>
            <Field label="Nom" value={emergency.contact_name} onChangeText={(v) => setEmergency((e) => ({ ...e, contact_name: v }))} />
            <Field
              label="Téléphone"
              value={emergency.contact_phone}
              onChangeText={(v) => setEmergency((e) => ({ ...e, contact_phone: v }))}
              keyboardType="phone-pad"
            />
          </Card>

          <ErrorText>{error}</ErrorText>
          <Button title={saving ? 'Enregistrement…' : 'Enregistrer'} onPress={save} loading={saving} />
          <Subtitle style={{ fontSize: 12, textAlign: 'center' }}>Photo et études se modifient depuis le site SAMBO.</Subtitle>
          <Button title="Se déconnecter" icon="log-out-outline" variant="danger" onPress={confirmSignOut} style={{ marginTop: 12 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Backdrop>
  )
}
