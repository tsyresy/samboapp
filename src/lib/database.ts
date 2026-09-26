/**
 * Hand-written to mirror supabase/migrations/0001_phase2_membres.sql.
 * Regenerate with `supabase gen types typescript` once the CLI on this
 * machine is linked to the account that owns the project — see
 * Historiques.md — and diff against this file rather than blindly
 * overwriting it, since some Update types here are intentionally narrower
 * than the DB allows (e.g. profiles.status/access_level/category are
 * clamped for non-admins by a trigger, not by the type).
 */

export type MembershipCategoryT =
  | 'membre_standard'
  | 'membre_bureau'
  | 'sojabe'
  | 'partenaire'
  | 'sponsor'

export type ValidationStatusT = 'en_attente' | 'valide' | 'refuse' | 'suspendu'

export type AccessLevelT = 'membre' | 'responsable' | 'administrateur'

export type DuesStatusT = 'paye' | 'impaye' | 'exempte' | 'en_attente'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
          category: MembershipCategoryT
          status: ValidationStatusT
          access_level: AccessLevelT
          show_phone_in_directory: boolean
          show_email_in_directory: boolean
          consent_accepted_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          member_number?: string | null
          last_name?: string | null
          first_names?: string | null
          nickname?: string | null
          birth_date?: string | null
          phone?: string | null
          phone_secondary?: string | null
          email?: string | null
          residence?: string | null
          still_studying?: boolean
          faculty?: string | null
          program?: string | null
          study_level?: string | null
          student_id?: string | null
          cin_number?: string | null
          photo_url?: string | null
          category?: MembershipCategoryT
          status?: ValidationStatusT
          access_level?: AccessLevelT
          show_phone_in_directory?: boolean
          show_email_in_directory?: boolean
          consent_accepted_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          id: string
          profile_id: string
          contact_name: string
          contact_phone: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          contact_name: string
          contact_phone: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['emergency_contacts']['Insert']>
        Relationships: []
      }
      office_positions: {
        Row: {
          id: string
          title: string
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          is_default?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['office_positions']['Insert']>
        Relationships: []
      }
      position_assignments: {
        Row: {
          id: string
          profile_id: string
          position_id: string
          start_date: string
          end_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          position_id: string
          start_date?: string
          end_date?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['position_assignments']['Insert']>
        Relationships: []
      }
      membership_cards: {
        Row: {
          id: string
          profile_id: string
          card_number: string
          verification_id: string
          status: 'active' | 'revoked'
          issued_at: string
          revoked_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          card_number: string
          verification_id?: string
          status?: 'active' | 'revoked'
          issued_at?: string
          revoked_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['membership_cards']['Insert']>
        Relationships: []
      }
      contact_requests: {
        Row: {
          id: string
          name: string
          email: string
          subject: string
          request_type: string
          message: string
          status: 'nouveau' | 'traite'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          subject: string
          request_type: string
          message: string
          status?: 'nouveau' | 'traite'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_requests']['Insert']>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_user_id: string | null
          action: string
          target_table: string | null
          target_id: string | null
          metadata: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_user_id?: string | null
          action: string
          target_table?: string | null
          target_id?: string | null
          metadata?: Record<string, unknown> | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>
        Relationships: []
      }
      dues_rules: {
        Row: {
          id: string
          year: number
          month: number
          category: MembershipCategoryT | null
          amount: number
          currency: string
          due_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          year: number
          month: number
          category?: MembershipCategoryT | null
          amount: number
          currency?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['dues_rules']['Insert']>
        Relationships: []
      }
      dues_records: {
        Row: {
          id: string
          profile_id: string
          rule_id: string | null
          year: number
          month: number
          status: DuesStatusT
          amount_paid: number | null
          payment_date: string | null
          payment_method: string | null
          reference: string | null
          note: string | null
          confirmed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          rule_id?: string | null
          year: number
          month: number
          status?: DuesStatusT
          amount_paid?: number | null
          payment_date?: string | null
          payment_method?: string | null
          reference?: string | null
          note?: string | null
          confirmed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['dues_records']['Insert']>
        Relationships: []
      }
      posts: {
        Row: {
          id: string
          author_id: string
          content: string
          status: 'visible' | 'hidden'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          status?: 'visible' | 'hidden'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
        Relationships: []
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          status: 'visible' | 'hidden'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          status?: 'visible' | 'hidden'
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['comments']['Insert']>
        Relationships: []
      }
      content_reports: {
        Row: {
          id: string
          reporter_id: string
          target_table: 'posts' | 'comments'
          target_id: string
          reason: string
          status: 'nouveau' | 'traite'
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          target_table: 'posts' | 'comments'
          target_id: string
          reason: string
          status?: 'nouveau' | 'traite'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['content_reports']['Insert']>
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          author_id: string
          content: string
          status: 'visible' | 'hidden'
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          status?: 'visible' | 'hidden'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
        Relationships: []
      }
      private_messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          sender_id: string
          recipient_id: string
          content: string
          created_at?: string
          read_at?: string | null
        }
        Update: { read_at?: string | null }
        Relationships: []
      }
      private_calls: {
        Row: {
          id: string
          caller_id: string
          callee_id: string
          status: PrivateCallStatus
          created_at: string
          answered_at: string | null
          ended_at: string | null
        }
        Insert: {
          id?: string
          caller_id: string
          callee_id: string
          status?: 'ringing'
        }
        Update: { status?: PrivateCallStatus }
        Relationships: []
      }
    }
    Views: {
      my_conversations: {
        Row: {
          other_id: string
          last_content: string
          last_sender_id: string
          last_at: string
          unread: number
        }
        Relationships: []
      }
      directory_profiles: {
        Row: {
          id: string
          member_number: string | null
          last_name: string | null
          first_names: string | null
          nickname: string | null
          category: MembershipCategoryT
          photo_url: string | null
          phone: string | null
          email: string | null
        }
        Relationships: []
      }
      public_office_team: {
        Row: {
          profile_id: string
          last_name: string | null
          first_names: string | null
          nickname: string | null
          photo_url: string | null
          position_title: string
          start_date: string
        }
        Relationships: []
      }
      card_verification: {
        Row: {
          verification_id: string
          card_status: 'active' | 'revoked'
          issued_at: string
          revoked_at: string | null
          member_number: string | null
          category: MembershipCategoryT
        }
        Relationships: []
      }
      unpaid_members: {
        Row: {
          id: string
          member_number: string | null
          last_name: string | null
          first_names: string | null
          nickname: string | null
          photo_url: string | null
          category: MembershipCategoryT
          unpaid_months: number
        }
        Relationships: []
      }
      payment_frequency: {
        Row: {
          year: number
          month: number
          payment_date: string
          payers: number
        }
        Relationships: []
      }
      my_unpaid_dues: {
        Row: {
          year: number
          month: number
          amount_due: number
        }
        Relationships: []
      }
    }
    Functions: {
      member_card_details: {
        Args: { p_verification_id: string }
        Returns: MemberCardDetails | null
      }
    }
    Enums: {
      membership_category_t: MembershipCategoryT
      validation_status_t: ValidationStatusT
      access_level_t: AccessLevelT
      dues_status_t: DuesStatusT
    }
  }
}

/** Returned by public.member_card_details() (migration 0012): the full
 *  record of a scanned member, for validated members only. */
export interface MemberCardDetails {
  /** Since migration 0014. */
  profile_id?: string
  card_status: 'active' | 'revoked'
  issued_at: string
  revoked_at: string | null
  member_number: string | null
  last_name: string | null
  first_names: string | null
  nickname: string | null
  birth_date: string | null
  cin_number: string | null
  phone: string | null
  phone_secondary: string | null
  email: string | null
  residence: string | null
  still_studying: boolean
  faculty: string | null
  program: string | null
  study_level: string | null
  student_id: string | null
  photo_url: string | null
  category: string
  status: string
  position: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
}

export type PrivateCallStatus = 'ringing' | 'accepted' | 'declined' | 'missed' | 'cancelled' | 'ended'
