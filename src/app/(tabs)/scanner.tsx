import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Backdrop, Button, IconButton, Subtitle, Title } from '@/components/ui'
import { parseMemberQr } from '@/lib/membership'
import { colors } from '@/lib/theme'

const FRAME = 250

/**
 * Scans a SAMBO membership card: its QR holds sambo://membre/<verification
 * id>, and the member's full record opens (fetched by member_card_details,
 * validated members only). Any other QR is rejected on the spot.
 */
export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions()
  const [focused, setFocused] = useState(false)
  const [torch, setTorch] = useState(false)
  const [notice, setNotice] = useState('')
  const locked = useRef(false)
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // The camera only runs while this tab is on screen; coming back re-arms it.
  useFocusEffect(
    useCallback(() => {
      setFocused(true)
      locked.current = false
      return () => {
        setFocused(false)
        setTorch(false)
      }
    }, []),
  )

  function onScanned({ data }: BarcodeScanningResult) {
    if (locked.current) return
    const verificationId = parseMemberQr(data)
    if (!verificationId) {
      // Don't repeat the warning on every frame while the same code is in view.
      if (!noticeTimer.current) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        setNotice("Ce QR code n'est pas une carte de membre SAMBO.")
        noticeTimer.current = setTimeout(() => {
          noticeTimer.current = undefined
          setNotice('')
        }, 2500)
      }
      return
    }
    locked.current = true
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push({ pathname: '/membre/[id]', params: { id: verificationId } })
  }

  if (!permission) return <Backdrop />

  if (!permission.granted) {
    return (
      <Backdrop>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center', gap: 14 }}>
          <Ionicons name="camera-outline" size={48} color={colors.accent} />
          <Title style={{ textAlign: 'center' }}>Scanner une carte</Title>
          <Subtitle style={{ textAlign: 'center', maxWidth: 320 }}>
            Autorisez l’appareil photo pour scanner le QR code d’une carte de membre SAMBO et afficher la fiche du membre.
          </Subtitle>
          {permission.canAskAgain ? (
            <Button title="Autoriser l'appareil photo" icon="camera" onPress={() => void requestPermission()} />
          ) : (
            <Button title="Ouvrir les réglages" icon="settings-outline" onPress={() => void Linking.openSettings()} />
          )}
        </SafeAreaView>
      </Backdrop>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {focused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          enableTorch={torch}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onScanned}
        />
      )}

      {/* Dimmed surroundings with a clear square in the middle. */}
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
        <View style={{ width: FRAME, height: FRAME, borderRadius: 28, borderWidth: 3, borderColor: colors.accent, boxShadow: '0 0 0 2000px rgba(0,0,0,0.55)' }} />
      </View>

      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
          <View>
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>Scanner</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Carte de membre SAMBO</Text>
          </View>
          <IconButton icon={torch ? 'flashlight' : 'flashlight-outline'} label={torch ? 'Éteindre la lampe' : 'Allumer la lampe'} onPress={() => setTorch((t) => !t)} color="#fff" />
        </View>

        <View style={{ padding: 24, alignItems: 'center' }}>
          <View style={{ backgroundColor: notice ? 'rgba(120,20,20,0.85)' : 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ color: '#fff', fontSize: 14, textAlign: 'center' }}>
              {notice || 'Placez le QR code de la carte dans le cadre'}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )
}
