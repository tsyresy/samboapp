import { Ionicons } from '@expo/vector-icons'
import { ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { MembershipCard } from '@/components/MembershipCard'
import { Backdrop, Card, EmptyState, Loading, Subtitle } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { useMyCard } from '@/lib/card'
import { colors } from '@/lib/theme'

export default function CardScreen() {
  const { profile } = useAuth()
  const { width } = useWindowDimensions()
  const { card, loading } = useMyCard(profile)

  if (!profile || loading) {
    return (
      <Backdrop>
        <Loading />
      </Backdrop>
    )
  }

  if (!card) {
    return (
      <Backdrop>
        <EmptyState
          icon="card-outline"
          title="Carte pas encore générée"
          text="Réessayez dans un instant, ou contactez un administrateur si cela persiste."
        />
      </Backdrop>
    )
  }

  return (
    <Backdrop>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20, alignItems: 'center' }}>
        {card.status === 'revoked' && (
          <Card tone="danger" style={{ alignSelf: 'stretch' }}>
            <Text style={{ color: colors.danger }}>Cette carte est révoquée et n’est plus valide.</Text>
          </Card>
        )}

        <MembershipCard profile={profile} roleLabel={card.roleLabel} verificationId={card.verificationId} width={Math.min(width - 32, 520)} />

        <Card style={{ alignSelf: 'stretch', flexDirection: 'row', gap: 12 }}>
          <Ionicons name="qr-code-outline" size={22} color={colors.accent} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ color: colors.ink, fontWeight: '600' }}>Présentez cette carte</Text>
            <Subtitle>
              Un membre SAMBO qui scanne le QR code avec l’application voit votre fiche. Une personne extérieure ne peut rien lire : le
              code ne contient aucune information personnelle.
            </Subtitle>
          </View>
        </Card>
      </ScrollView>
    </Backdrop>
  )
}
