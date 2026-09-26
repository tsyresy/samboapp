import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ReportDialog, type ReportTarget } from '@/components/ReportDialog'
import { Avatar, Backdrop, Button, Card, EmptyState, ErrorText, Field, Loading, Pill, Subtitle, Title } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { fetchMemberMap, type MemberInfo } from '@/lib/authors'
import { fullName, timeAgo } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface PostRow {
  id: string
  author_id: string
  content: string
  status: 'visible' | 'hidden'
  created_at: string
}

export default function Discussions() {
  const { profile } = useAuth()
  const isAdmin = profile?.access_level === 'administrateur'
  const [posts, setPosts] = useState<PostRow[] | null>(null)
  const [authors, setAuthors] = useState<Record<string, MemberInfo>>({})
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [draft, setDraft] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [report, setReport] = useState<ReportTarget | null>(null)

  const load = useCallback(async () => {
    const [postsRes, authorMap, commentsRes] = await Promise.all([
      supabase.from('posts').select('*').order('created_at', { ascending: false }),
      fetchMemberMap(),
      supabase.from('comments').select('post_id').eq('status', 'visible'),
    ])
    if (postsRes.error) setError(postsRes.error.message)
    setPosts(postsRes.data ?? [])
    setAuthors(authorMap)
    const counts: Record<string, number> = {}
    for (const c of commentsRes.data ?? []) counts[c.post_id] = (counts[c.post_id] ?? 0) + 1
    setCommentCounts(counts)
  }, [])

  // Also on coming back from a post, so comment counts stay current.
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function publish() {
    const content = draft.trim()
    if (!profile || !content) return
    setPosting(true)
    const { error: insertError } = await supabase.from('posts').insert({ author_id: profile.id, content })
    setPosting(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    setError('')
    setDraft('')
    await load()
  }

  function openActions(post: PostRow) {
    const mine = post.author_id === profile?.id
    const hidden = post.status === 'hidden'
    Alert.alert('Publication', undefined, [
      ...(!mine ? [{ text: 'Signaler', onPress: () => setReport({ table: 'posts', id: post.id }) }] : []),
      ...(isAdmin
        ? [
            {
              text: hidden ? 'Réafficher' : 'Masquer (admin)',
              onPress: async () => {
                await supabase.from('posts').update({ status: hidden ? 'visible' : 'hidden' }).eq('id', post.id)
                await load()
              },
            },
          ]
        : []),
      ...(mine
        ? [
            {
              text: 'Supprimer',
              style: 'destructive' as const,
              onPress: async () => {
                await supabase.from('posts').delete().eq('id', post.id)
                await load()
              },
            },
          ]
        : []),
      { text: 'Annuler', style: 'cancel' as const },
    ])
  }

  if (!profile) return null

  return (
    <Backdrop>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {posts === null ? (
          <Loading />
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accentStrong]} />}
            ListHeaderComponent={
              <View style={{ gap: 14, marginBottom: 4 }}>
                <View>
                  <Title>Discussions</Title>
                  <Subtitle>Fil réservé aux membres validés de SAMBO.</Subtitle>
                </View>
                <Card style={{ gap: 10 }}>
                  <Field
                    value={draft}
                    onChangeText={setDraft}
                    placeholder="Partagez quelque chose avec les membres…"
                    multiline
                    maxLength={4000}
                    style={{ minHeight: 76, textAlignVertical: 'top' }}
                  />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Button title={posting ? 'Publication…' : 'Publier'} icon="send" small onPress={publish} loading={posting} disabled={!draft.trim()} />
                  </View>
                </Card>
                <ErrorText>{error}</ErrorText>
              </View>
            }
            ListEmptyComponent={<EmptyState icon="newspaper-outline" title="Aucune publication pour le moment." />}
            renderItem={({ item: post }) => {
              const author = authors[post.author_id]
              const hidden = post.status === 'hidden'
              const count = commentCounts[post.id] ?? 0
              return (
                <Pressable
                  onPress={() => router.push({ pathname: '/publication/[id]', params: { id: post.id } })}
                  onLongPress={() => openActions(post)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <Card tone={hidden ? 'danger' : 'default'} style={[{ gap: 10 }, hidden && { opacity: 0.7 }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Avatar name={fullName(author)} photoUrl={author?.photo_url} size={40} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.ink, fontWeight: '600' }}>{fullName(author)}</Text>
                        <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>{timeAgo(post.created_at)}</Text>
                      </View>
                      {hidden && <Pill label="Masqué" tone="danger" />}
                      <Pressable onPress={() => openActions(post)} hitSlop={10} accessibilityLabel="Actions">
                        <Ionicons name="ellipsis-horizontal" size={20} color={colors.inkSubtle} />
                      </Pressable>
                    </View>
                    <Text style={{ color: colors.ink, fontSize: 15, lineHeight: 22 }}>{post.content}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="chatbubble-outline" size={16} color={colors.inkSubtle} />
                      <Text style={{ color: colors.inkSubtle, fontSize: 13 }}>
                        {count ? `${count} commentaire${count > 1 ? 's' : ''}` : 'Commenter'}
                      </Text>
                    </View>
                  </Card>
                </Pressable>
              )
            }}
          />
        )}
        <ReportDialog
          target={report}
          onClose={(sent) => {
            setReport(null)
            if (sent) Alert.alert('Signalement envoyé', 'Merci, le bureau va examiner ce contenu.')
          }}
        />
      </SafeAreaView>
    </Backdrop>
  )
}
