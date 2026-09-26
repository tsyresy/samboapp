import { router, useLocalSearchParams } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ConversationList } from '@/components/ConversationList'
import { GroupChat } from '@/components/GroupChat'
import { Backdrop, Badge, Title } from '@/components/ui'
import { useMessaging } from '@/context/messaging'
import { colors } from '@/lib/theme'

type View_ = 'groupe' | 'prives'

function Segment({ value, label, badge, current }: { value: View_; label: string; badge?: number; current: View_ }) {
  const active = current === value
  return (
    <Pressable
      onPress={() => router.setParams({ vue: value })}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{
        flex: 1,
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: active ? colors.accentStrong : 'transparent',
      }}
    >
      <Text style={{ color: active ? colors.onAccent : colors.inkMuted, fontWeight: '600', fontSize: 14 }}>{label}</Text>
      {!!badge && <Badge count={badge} inverted={active} />}
    </Pressable>
  )
}

/** Group chat and private messages, one tab, two views. */
export default function Chat() {
  const { vue } = useLocalSearchParams<{ vue?: View_ }>()
  const current: View_ = vue === 'prives' ? 'prives' : 'groupe'
  const { unread } = useMessaging()

  return (
    <Backdrop>
      {/* Wraps the whole screen (which starts at the top of the window) so
          the keyboard offset needs no correction. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 8, gap: 12 }}>
            <Title>Chat</Title>
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 999, padding: 4, borderWidth: 1, borderColor: colors.line }}>
              <Segment value="groupe" label="Groupe SAMBO" current={current} />
              <Segment value="prives" label="Privés" badge={unread} current={current} />
            </View>
          </View>
          <View style={{ flex: 1, marginTop: 8 }}>{current === 'groupe' ? <GroupChat /> : <ConversationList />}</View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Backdrop>
  )
}
