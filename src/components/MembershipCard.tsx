import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Svg, { Path } from 'react-native-svg'
import { memberQrPayload } from '@/lib/membership'
import type { Profile } from '@/lib/types'

const LOGO = require('../../assets/sambo-logo.png')
const BOX_BORDER = '#B5B7B8'
const RED = '#D02B30'
const GREEN = '#34A750'
const INK = '#0b1a12'

/** Font size (cm) for a name line: 0.34cm, shrunk just enough for long
 *  Malagasy names to fit whole in `widthCm` (same rule as the site). */
function nameFontCm(text: string, widthCm: number) {
  const fit = widthCm / (Math.max(text.length, 1) * 0.58)
  return Math.max(0.22, Math.min(0.34, fit))
}

/**
 * The physical card face (8.5 × 5.5 cm, landscape), laid out exactly like
 * the site's MembershipCardView — every position is in centimetres,
 * scaled to `width`. The QR encodes sambo://membre/<verification id>,
 * which the app's scanner (and the site) read.
 */
export function MembershipCard({
  profile,
  roleLabel,
  verificationId,
  width,
}: {
  profile: Profile
  roleLabel: string
  verificationId: string
  width: number
}) {
  const cm = width / 8.5
  const lastName = profile.last_name ?? ''
  const firstNames = profile.first_names ?? ''

  return (
    <View
      style={{
        width,
        height: 5.5 * cm,
        backgroundColor: '#fff',
        borderRadius: 0.18 * cm,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
    >
      {/* Corner ribbon accents */}
      <Svg viewBox="0 0 8.5 5.5" preserveAspectRatio="none" style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <Path
          d="M 8.5,0 L 8.5,1.65 C 7.9,1.8 7.55,1.38 7.1,1.15 C 6.6,0.95 6.15,1.15 5.85,0.85 C 5.6,0.6 5.75,0.15 6.1,0 Z"
          fill={RED}
        />
        <Path
          d="M 0,5.5 L 0,3.85 C 0.6,3.7 0.95,4.12 1.4,4.32 C 1.9,4.52 2.35,4.32 2.65,4.62 C 2.9,4.87 2.75,5.32 2.4,5.5 Z"
          fill={GREEN}
        />
      </Svg>

      {/* Photo box */}
      <View
        style={{
          position: 'absolute',
          left: 0.7 * cm,
          top: 0.55 * cm,
          width: 2.18 * cm,
          height: 2.15 * cm,
          borderWidth: 0.045 * cm,
          borderColor: BOX_BORDER,
          borderRadius: 0.2 * cm,
          backgroundColor: '#F1F3F4',
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {profile.photo_url ? (
          <Image source={{ uri: profile.photo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Text style={{ fontSize: 0.22 * cm, color: 'rgba(36,80,56,0.5)' }}>photo</Text>
        )}
      </View>

      {/* Logo + member number */}
      <View style={{ position: 'absolute', left: 3.2 * cm, top: 0.25 * cm, width: 2.1 * cm, alignItems: 'center' }}>
        <Image source={LOGO} style={{ width: 1.45 * cm, height: 1.45 * cm }} contentFit="contain" />
        <Text numberOfLines={1} style={{ marginTop: 0.15 * cm, fontSize: 0.2 * cm, fontWeight: '500', color: 'rgba(36,80,56,0.7)' }}>
          {profile.member_number ?? '—'}
        </Text>
      </View>

      {/* QR box */}
      <View
        style={{
          position: 'absolute',
          left: 5.0 * cm,
          top: 0.55 * cm,
          width: 3.08 * cm,
          height: 3.17 * cm,
          borderWidth: 0.045 * cm,
          borderColor: BOX_BORDER,
          borderRadius: 0.2 * cm,
          backgroundColor: '#E5E6E6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <QRCode
          value={memberQrPayload(verificationId)}
          size={2.7 * cm}
          ecl="H"
          color={INK}
          backgroundColor="#ffffff"
          quietZone={0.08 * cm}
          logo={LOGO}
          logoSize={0.42 * cm}
          logoBorderRadius={0.21 * cm}
          logoBackgroundColor="#ffffff"
          logoMargin={1}
        />
      </View>

      {/* Attribution / role */}
      <View
        style={{
          position: 'absolute',
          left: 0.7 * cm,
          top: 2.9 * cm,
          width: 4.2 * cm,
          borderBottomWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: BOX_BORDER,
          paddingBottom: 0.03 * cm,
        }}
      >
        <Text numberOfLines={2} style={{ fontSize: 0.33 * cm, lineHeight: 0.38 * cm, fontWeight: '700', color: '#12291e' }}>
          {roleLabel}
        </Text>
      </View>

      {/* Divider */}
      <View style={{ position: 'absolute', left: 0, right: 0, top: 3.76 * cm, height: Math.max(1, 0.03 * cm), backgroundColor: '#000' }} />

      <NameLine label="Nom:" value={lastName} top={3.86} widthCm={5.9} cm={cm} />
      <NameLine label="Prénom:" value={firstNames} top={4.4} widthCm={5.5} cm={cm} />
      <Text style={{ position: 'absolute', left: 0.7 * cm, top: 4.95 * cm, width: 7.1 * cm, textAlign: 'right', fontSize: 0.18 * cm, color: 'rgba(18,41,30,0.7)' }}>
        signature:
      </Text>
    </View>
  )
}

function NameLine({ label, value, top, widthCm, cm }: { label: string; value: string; top: number; widthCm: number; cm: number }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0.7 * cm,
        top: top * cm,
        width: 7.1 * cm,
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 0.15 * cm,
        borderBottomWidth: 1,
        borderStyle: 'dotted',
        borderColor: 'rgba(18,41,30,0.6)',
        paddingBottom: 0.04 * cm,
      }}
    >
      <Text style={{ fontSize: 0.28 * cm, fontWeight: '700', color: INK }}>{label}</Text>
      <Text numberOfLines={1} style={{ flex: 1, fontSize: nameFontCm(value, widthCm) * cm, fontWeight: '600', color: INK }}>
        {value}
      </Text>
    </View>
  )
}
