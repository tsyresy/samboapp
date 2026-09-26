import { TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ErrorText, IconButton } from '@/components/ui'
import { colors } from '@/lib/theme'

/** Message input pinned under a chat, conversation or comment list. */
export function Composer({
  value,
  onChange,
  onSend,
  sending,
  placeholder,
  maxLength,
  error,
  insetBottom = true,
}: {
  value: string
  onChange: (text: string) => void
  onSend: () => void
  sending?: boolean
  placeholder: string
  maxLength: number
  error?: string
  /** False when a tab bar already sits under the composer. */
  insetBottom?: boolean
}) {
  const insets = useSafeAreaInsets()
  const canSend = !!value.trim() && !sending
  return (
    <View
      style={{
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: insetBottom ? Math.max(insets.bottom, 10) : 10,
        borderTopWidth: 1,
        borderTopColor: colors.line,
        backgroundColor: colors.glassStrong,
        gap: 6,
      }}
    >
      {!!error && <ErrorText>{error}</ErrorText>}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.inkSubtle}
          selectionColor={colors.accent}
          multiline
          maxLength={maxLength}
          style={{
            flex: 1,
            maxHeight: 120,
            minHeight: 44,
            color: colors.ink,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingTop: 11,
            paddingBottom: 11,
            fontSize: 15,
          }}
        />
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: canSend ? colors.accentStrong : 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
          <IconButton icon="send" label="Envoyer" size={19} color={canSend ? colors.onAccent : colors.inkSubtle} onPress={() => canSend && onSend()} />
        </View>
      </View>
    </View>
  )
}
