import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from '@/context/auth'
import { MessagingProvider } from '@/context/messaging'
import { PresenceProvider } from '@/context/presence'
import { colors } from '@/lib/theme'

void SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { session, profile, loading, profileLoading } = useAuth()
  const ready = !loading && !(session && profileLoading)
  const validated = !!session && profile?.status === 'valide'

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Signed in but not (yet) validated by the bureau. */}
      <Stack.Protected guard={!!session && !validated}>
        <Stack.Screen name="en-attente" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={validated}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="carte" options={{ title: 'Ma carte de membre' }} />
        <Stack.Screen name="adidy" options={{ title: 'Mes adidy' }} />
        <Stack.Screen name="profil" options={{ title: 'Mon profil' }} />
        <Stack.Screen name="conversation/[id]" options={{ title: '' }} />
        <Stack.Screen name="membre/[id]" options={{ title: 'Fiche membre' }} />
        <Stack.Screen name="publication/[id]" options={{ title: 'Publication' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <MessagingProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </MessagingProvider>
      </PresenceProvider>
    </AuthProvider>
  )
}
