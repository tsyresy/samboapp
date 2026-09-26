import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MembershipCard } from '@/components/MembershipCard'
import { UnpaidStrip } from '@/components/UnpaidStrip'
import { Avatar, Backdrop, Badge, Card, PressableCard, SectionTitle, Subtitle, type IconName } from '@/components/ui'
import { useAuth } from '@/context/auth'
import { useMessaging } from '@/context/messaging'
import { useMyCard } from '@/lib/card'
import { fetchMyDuesTotal, formatAr, type DuesTotal } from '@/lib/dues'
import { fullName, timeAgo } from '@/lib/format'
import { supabase } from '@/lib/supabase'
import { colors } from '@/lib/theme'

interface RecentPost {
  id: string
  content: string
  created_at: string
  author: { name: string; photo_url: string | null } | null
}

const RECENT_POSTS = 3

async function fetchRecentPosts(): Promise<RecentPost[]> {
  const { data: posts } = await supabase
    .from('posts')
    .select('id, author_id, content, created_at')
    .eq('status', 'visible')
    .order('created_at', { ascending: false })
    .limit(RECENT_POSTS)
  if (!posts?.length) return []

  const { data: authors } = await supabase
    .from('directory_profiles')
    .select('id, last_name, first_names, photo_url')
    .in('id', [...new Set(posts.map((p) => p.author_id))])
  const byId = new Map((authors ?? []).map((a) => [a.id, a]))

  return posts.map((p) => {
    const a = byId.get(p.author_id)
    return {
      id: p.id,
      content: p.content,
      created_at: p.created_at,
      author: a ? { name: fullName(a), photo_url: a.photo_url } : null,
    }
  })
}

function QuickAction({ icon, label, onPress, badge }: { icon: IconName; label: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({ flex: 1, alignItems: 'center', gap: 8, opacity: pressed ? 0.7 : 1 })}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: 'rgba(116,224,161,0.12)',
          borderWidth: 1,
          borderColor: 'rgba(116,224,161,0.25)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={24} color={colors.accent} />
        {!!badge && (
          <View style={{ position: 'absolute', top: -6, right: -6 }}>
            <Badge count={badge} />
          </View>
        )}
      </View>
      <Text style={{ color: colors.inkMuted, fontSize: 12, fontWeight: '500', textAlign: 'center' }}>{label}</Text>
    </Pressable>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { unread } = useMessaging()
  const { width } = useWindowDimensions()
  const { card, reload: reloadCard } = useMyCard(profile)
  const [dues, setDues] = useState<DuesTotal | null>(null)
  const [posts, setPosts] = useState<RecentPost[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const load = useCallback(async () => {
    const [d, p] = await Promise.all([fetchMyDuesTotal(), fetchRecentPosts()])
    setDues(d)
    setPosts(p)
  }, [])

  useEffect(() => {
    // False positive: the loader awaits the server before any setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function refresh() {
    setRefreshing(true)
    setRefreshKey((k) => k + 1)
    await Promise.all([load(), reloadCard()])
    setRefreshing(false)
  }

  if (!profile) return null
  const owes = !!dues && dues.amount > 0
  const cardWidth = Math.min(width - 40, 420)

  return (
    <Backdrop>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 22 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.accent} colors={[colors.accentStrong]} />}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image source={require('../../../assets/sambo-logo.png')} style={{ width: 40, height: 40 }} contentFit="contain" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.ink, fontSize: 22, fontWeight: '700' }} numberOfLines={1}>
                Bonjour{profile.first_names ? `, ${profile.first_names.split(' ')[0]}` : ''} 👋
              </Text>
              <Subtitle>Bienvenue dans votre espace SAMBO.</Subtitle>
            </View>
            <Pressable onPress={() => router.push('/profil')} accessibilityLabel="Mon profil" hitSlop={8}>
              <Avatar name={fullName(profile)} photoUrl={profile.photo_url} size={42} />
            </Pressable>
          </View>

          {/* Membership card */}
          {card ? (
            <Pressable onPress={() => router.push('/carte')} accessibilityLabel="Ouvrir ma carte de membre" style={{ alignItems: 'center', gap: 8 }}>
              <MembershipCard profile={profile} roleLabel={card.roleLabel} verificationId={card.verificationId} width={cardWidth} />
              {card.status === 'revoked' && <Text style={{ color: colors.danger, fontSize: 13 }}>Cette carte est révoquée.</Text>}
            </Pressable>
          ) : (
            <Card>
              <Text style={{ color: colors.accent, fontWeight: '600' }}>Ma carte de membre</Text>
              <Subtitle>Votre carte n’est pas encore générée.</Subtitle>
            </Card>
          )}

          {/* Adidy */}
          <PressableCard tone={owes ? 'danger' : 'default'} onPress={() => router.push('/adidy')} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.inkMuted, fontSize: 13, fontWeight: '500' }}>Mes adidy — total dû</Text>
              {dues === null ? (
                <Subtitle>Chargement…</Subtitle>
              ) : (
                <>
                  <Text style={{ color: owes ? colors.danger : colors.accent, fontSize: 28, fontWeight: '800', marginTop: 2 }}>{formatAr(dues.amount)}</Text>
                  <Text style={{ color: colors.inkSubtle, fontSize: 12 }}>
                    {owes ? `${dues.months} mois impayé${dues.months > 1 ? 's' : ''} · Voir le détail` : 'Vous êtes à jour. Misaotra !'}
                  </Text>
                </>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.inkSubtle} />
          </PressableCard>

          {/* Shortcuts */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <QuickAction icon="card-outline" label="Ma carte" onPress={() => router.push('/carte')} />
            <QuickAction icon="wallet-outline" label="Mes adidy" onPress={() => router.push('/adidy')} />
            <QuickAction icon="mail-outline" label="Messages" badge={unread} onPress={() => router.push({ pathname: '/chat', params: { vue: 'prives' } })} />
            <QuickAction icon="person-outline" label="Profil" onPress={() => router.push('/profil')} />
          </View>

          <UnpaidStrip refreshKey={refreshKey} />

          {/* Recent posts */}
          <View style={{ gap: 12 }}>
            <SectionTitle
              action={
                <Pressable onPress={() => router.push('/discussions')} hitSlop={8}>
                  <Text style={{ color: colors.accent, fontWeight: '600' }}>Tout voir</Text>
                </Pressable>
              }
            >
              Dernières publications
            </SectionTitle>
            {posts === null ? (
              <Subtitle>Chargement…</Subtitle>
            ) : posts.length === 0 ? (
              <PressableCard onPress={() => router.push('/discussions')}>
                <Text style={{ color: colors.accent }}>Aucune publication pour l’instant. Soyez le premier à partager quelque chose.</Text>
              </PressableCard>
            ) : (
              posts.map((post) => (
                <PressableCard
                  key={post.id}
                  onPress={() => router.push({ pathname: '/publication/[id]', params: { id: post.id } })}
                  style={{ flexDirection: 'row', gap: 12 }}
                >
                  <Avatar name={post.author?.name ?? 'Membre'} photoUrl={post.author?.photo_url} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.ink, fontWeight: '600', fontSize: 14 }}>
                      {post.author?.name ?? 'Membre'} <Text style={{ color: colors.inkSubtle, fontWeight: '400', fontSize: 12 }}> {timeAgo(post.created_at)}</Text>
                    </Text>
                    <Text numberOfLines={3} style={{ color: colors.inkMuted, fontSize: 14, marginTop: 4, lineHeight: 20 }}>
                      {post.content}
                    </Text>
                  </View>
                </PressableCard>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Backdrop>
  )
}
