export type MembershipCategory =
  | 'membre_standard'
  | 'membre_bureau'
  | 'sojabe'
  | 'partenaire'
  | 'sponsor'

export type ValidationStatus = 'en_attente' | 'valide' | 'refuse' | 'suspendu'

export type AccessLevel = 'membre' | 'responsable' | 'administrateur'

export type DuesStatus = 'paye' | 'impaye' | 'exempte' | 'en_attente'

/**
 * Mirrors public.profiles (supabase/migrations/0001_phase2_membres.sql).
 * Most identity fields are nullable at the DB level: self-registration
 * fills them all in, but an admin-bootstrapped account (or one created
 * directly by an administrator) may not have them yet.
 */
export interface Profile {
  id: string
  user_id: string
  member_number: string | null
  last_name: string | null
  first_names: string | null
  nickname: string | null
  birth_date: string | null
  phone: string | null
  phone_secondary: string | null
  email: string | null
  residence: string | null
  still_studying: boolean
  faculty: string | null
  program: string | null
  study_level: string | null
  student_id: string | null
  cin_number: string | null
  photo_url: string | null
  category: MembershipCategory
  status: ValidationStatus
  access_level: AccessLevel
  show_phone_in_directory: boolean
  show_email_in_directory: boolean
  consent_accepted_at: string
  created_at: string
  updated_at: string
}
