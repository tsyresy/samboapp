import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native'
import { Button, ErrorText, Field } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

export interface ReportTarget {
  table: 'posts' | 'comments'
  id: string
}

/** Asks why, then files a content_reports row for the bureau. */
export function ReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: (sent: boolean) => void }) {
  const { profile } = useAuth()
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!target || !profile || !reason.trim()) return
    setSending(true)
    const { error: insertError } = await supabase.from('content_reports').insert({
      reporter_id: profile.id,
      target_table: target.table,
      target_id: target.id,
      reason: reason.trim(),
    })
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setReason('')
    setError('')
    onClose(true)
  }

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={() => onClose(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 }} onPress={() => onClose(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: '#0f2a1d', borderRadius: 22, padding: 20, gap: 14, borderWidth: 1, borderColor: colors.line }}>
            <Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>Signaler ce contenu</Text>
            <Field value={reason} onChangeText={setReason} placeholder="Pourquoi signalez-vous ce contenu ?" multiline maxLength={500} style={{ minHeight: 90, textAlignVertical: 'top' }} autoFocus />
            <ErrorText>{error}</ErrorText>
            <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
              <Button title="Annuler" variant="glass" small onPress={() => onClose(false)} />
              <Button title="Envoyer" small onPress={send} loading={sending} disabled={!reason.trim()} />
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}
