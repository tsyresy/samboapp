import { useCallback, useEffect, useState } from 'react'
import { categoryLabel } from '@/lib/membership'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

export interface MyCard {
  verificationId: string
  status: 'active' | 'revoked'
  /** Current bureau position, else the membership category. */
  roleLabel: string
}

/** The signed-in member's card row and the role line printed on it
 *  (same queries as the site's MembershipCard page). */
export async function fetchMyCard(profile: Profile): Promise<MyCard | null> {
  const [cardRes, assignmentRes] = await Promise.all([
    supabase.from('membership_cards').select('verification_id, status').eq('profile_id', profile.id).maybeSingle(),
    supabase
      .from('position_assignments')
      .select('position_id')
      .eq('profile_id', profile.id)
      .is('end_date', null)
      .maybeSingle(),
  ])
  if (!cardRes.data) return null

  let roleLabel = categoryLabel(profile.category)
  if (assignmentRes.data) {
    const { data: position } = await supabase
      .from('office_positions')
      .select('title')
      .eq('id', assignmentRes.data.position_id)
      .maybeSingle()
    if (position?.title) roleLabel = position.title
  }
  return { verificationId: cardRes.data.verification_id, status: cardRes.data.status, roleLabel }
}

export function useMyCard(profile: Profile | null) {
  const [card, setCard] = useState<MyCard | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!profile) return
    setCard(await fetchMyCard(profile))
    setLoading(false)
  }, [profile])

  useEffect(() => {
    // False positive: the loader awaits the server before any setState.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  return { card, loading, reload }
}
