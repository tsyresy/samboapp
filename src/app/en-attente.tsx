import { Ionicons } from '@expo/vector-icons'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Backdrop, Button, Subtitle, Title } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { VALIDATION_STATUS_LABELS } from '@/lib/membership'
import { colors } from '@/lib/theme'

export default function PendingApproval() {
  const { profile, signOut, reloadProfile } = useAuth()
  const status = profile?.status
  const refused = status === 'refuse' || status === 'suspendu'

  return (
    <Backdrop>
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <View style={{ alignItems: 'center', gap: 14 }}>
          <Ionicons name={refused ? 'close-circle-outline' : 'hourglass-outline'} size={48} color={refused ? colors.danger : colors.gold} />
          <Title style={{ textAlign: 'center' }}>{refused ? `Adhésion ${VALIDATION_STATUS_LABELS[status!].toLowerCase()}` : "Demande en cours d'examen"}</Title>
          <Subtitle style={{ textAlign: 'center', maxWidth: 340 }}>
            {refused
              ? "Votre accès à l'espace membre n'est pas actif. Contactez le bureau de SAMBO pour en savoir plus."
              : "Votre compte a bien été créé. Un administrateur doit encore valider votre adhésion avant que vous puissiez accéder à l'espace membre."}
          </Subtitle>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
            <Button title="Actualiser" icon="refresh" variant="glass" onPress={() => void reloadProfile()} />
            <Button title="Se déconnecter" variant="glass" onPress={() => void signOut()} />
          </View>
        </View>
      </SafeAreaView>
    </Backdrop>
  )
}
