import { useLocalSearchParams } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import { useCallback, useEffect, useState } from 'react'
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native'
import { Composer } from '@/components/Composer'
import { ReportDialog, type ReportTarget } from '@/components/ReportDialog'
import { Avatar, Backdrop, Card, EmptyState, IconButton, Loading, Pill } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { fetchMemberMap, type MemberInfo } from '@/lib/authors'
import { fullName, timeAgo } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface Row {
  id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

/** One post and its comments. */
export default function PostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { profile } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const headerHeight = useHeaderHeight()
  const [post, setPost] = useState<Row | null | undefined>(undefined)
  const [comments, setComments] = useState<Row[]>([])
  const [authors, setAuthors] = useState<Record<string, MemberInfo>>({})
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<ReportTarget | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    const [postRes, commentsRes, authorMap] = await Promise.all([
      supabase.from('posts').select('*').eq('id', id).maybeSingle(),
      supabase.from('comments').select('*').eq('post_id', id).order('created_at', { ascending: true }),
      fetchMemberMap(),
    ])
    setPost(postRes.data)
    setComments(commentsRes.data ?? [])
    setAuthors(authorMap)
  }, [id])

  useEffect(() => {
    // False positive: the loader awaits the server before any setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function send() {
    const content = draft.trim()
    if (!profile || !content || !id) return
    setSending(true)
    const { error: insertError } = await supabase.from('comments').insert({ post_id: id, author_id: profile.id, content })
    setSending(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setError('')
    setDraft('')
    await load()
  }

  function openActions(table: 'posts' | 'comments', row: Row) {
    const mine = row.author_id === profile?.id
    const hidden = row.status === 'hidden'
    Alert.alert(table === 'posts' ? 'Publication' : 'Commentaire', undefined, [
      ...(!mine ? [{ text: 'Signaler', onPress: () => setReport({ table, id: row.id }) }] : []),
      ...(isAdmin
        ? [
            {
              text: hidden ? 'Réafficher' : 'Masquer (admin)',
              onPress: async () => {
                await supabase.from(table).update({ status: hidden ? 'visible' : 'hidden' }).eq('id', row.id)
                await load()
              },
            },
          ]
        : []),
      ...(mine && table === 'comments'
        ? [
            {
              text: 'Supprimer',
              style: 'destructive' as const,
              onPress: async () => {
                await supabase.from('comments').delete().eq('id', row.id)
                await load()
              },
            },
          ]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ])
  }

  if (post === undefined) {
    return (
      <Backdrop>
        <Loading />
      </Backdrop>
    )
  }
  if (post === null) {
    return (
      <Backdrop>
        <EmptyState icon="alert-circle-outline" title="Publication introuvable" text="Elle a peut-être été supprimée." />
      </Backdrop>
    )
  }

  const author = authors[post.author_id]

  return (
    <Backdrop>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={headerHeight}>
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 20, gap: 12 }}
          ListHeaderComponent={
            <Pressable onLongPress={() => openActions('posts', post)}>
              <Card style={[{ gap: 10, marginBottom: 8 }, post.status === 'hidden' && { opacity: 0.7 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Avatar name={fullName(author)} photoUrl={author?.photo_url} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.ink, fontWeight: '600' }}>{fullName(author)}</Text>
                    <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>{timeAgo(post.created_at)}</Text>
                  </View>
                  {post.status === 'hidden' && <Pill label="Masqué" tone="danger" />}
                  <IconButton icon="ellipsis-horizontal" label="Actions" size={20} color={colors.inkSubtle} onPress={() => openActions('posts', post)} />
                </View>
                <Text selectable style={{ color: colors.ink, fontSize: 16, lineHeight: 24 }}>
                  {post.content}
                </Text>
              </Card>
              <Text style={{ color: colors.inkMuted, fontWeight: '600', marginBottom: 4 }}>
                {comments.length ? `${comments.length} commentaire${comments.length > 1 ? 's' : ''}` : 'Aucun commentaire pour le moment.'}
              </Text>
            </Pressable>
          }
          renderItem={({ item: c }) => {
            const cAuthor = authors[c.author_id]
            return (
              <Pressable onLongPress={() => openActions('comments', c)} style={{ flexDirection: 'row', gap: 10, opacity: c.status === 'hidden' ? 0.55 : 1 }}>
                <Avatar name={fullName(cAuthor)} photoUrl={cAuthor?.photo_url} size={32} />
                <View style={{ flex: 1, backgroundColor: colors.bubble, borderRadius: 16, borderTopLeftRadius: 6, padding: 10 }}>
                  <Text style={{ color: colors.ink, fontSize: 13, fontWeight: '600' }}>
                    {fullName(cAuthor)} <Text style={{ color: colors.inkSubtle, fontWeight: '400', fontSize: 12 }}> {timeAgo(c.created_at)}</Text>
                    {c.status === 'hidden' ? <Text style={{ color: colors.danger }}> (masqué)</Text> : null}
                  </Text>
                  <Text style={{ color: colors.inkMuted, fontSize: 14, marginTop: 2, lineHeight: 20 }}>{c.content}</Text>
                </View>
              </Pressable>
            )
          }}
        />
        <Composer value={draft} onChange={setDraft} onSend={() => void send()} sending={sending} placeholder="Répondre…" maxLength={2000} error={error} />
      </KeyboardAvoidingView>
      <ReportDialog
        target={report}
        onClose={(sent) => {
          setReport(null)
          if (sent) Alert.alert('Signalement envoyé', 'Merci, le bureau va examiner ce contenu.')
        }}
      />
    </Backdrop>
  )
}
