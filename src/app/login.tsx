import { Image } from 'expo-image'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Backdrop, Button, Card, ErrorText, Field, Subtitle, Title } from '@/components/ui'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    if (!email.trim() || !password) return
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    // On success the root layout's guards take the member to the app.
    if (authError) setError('Email ou mot de passe incorrect.')
  }

  return (
    <Backdrop>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, gap: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Image source={require('../../assets/sambo-logo.png')} style={{ width: 104, height: 104 }} contentFit="contain" />
              <Title>SAMBO</Title>
              <Subtitle style={{ textAlign: 'center' }}>Connectez-vous à votre espace membre.</Subtitle>
            </View>

            <Card style={{ gap: 16, padding: 20 }}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <Field
                label="Mot de passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={signIn}
              />
              <ErrorText>{error}</ErrorText>
              <Button title={loading ? 'Connexion…' : 'Se connecter'} onPress={signIn} loading={loading} disabled={!email.trim() || !password} />
            </Card>

            <Text style={{ color: colors.inkSubtle, textAlign: 'center', fontSize: 13 }}>
              Pas encore membre ? L’inscription se fait sur le site SAMBO, puis le bureau valide votre adhésion.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Backdrop>
  )
}
