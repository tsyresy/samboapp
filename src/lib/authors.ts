import { supabase } from '@/lib/supabase'

export interface MemberInfo {
  id: string
  last_name: string | null
  first_names: string | null
  nickname: string | null
  photo_url: string | null
}

/** Every validated member's name and photo, by profile id (directory view). */
export async function fetchMemberMap(): Promise<Record<string, MemberInfo>> {
  const { data } = await supabase.from('directory_profiles').select('id, last_name, first_names, nickname, photo_url')
  const map: Record<string, MemberInfo> = {}
  for (const m of data ?? []) map[m.id] = m
  return map
}
