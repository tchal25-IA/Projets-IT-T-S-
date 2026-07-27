export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      check_ins: {
        Row: {
          blocs_completes: number[]
          coach_comment: string | null
          created_at: string
          date: string
          energie: number
          humeur: number
          id: string
          nb_blocs: number
          note: string | null
          ressenti_note: string | null
          ressenti_score: number | null
          serenite: number
          session_duration_sec: number | null
          session_ended: boolean
          session_ended_at: string | null
          session_source: string
          session_started_at: string | null
          temps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          blocs_completes?: number[]
          coach_comment?: string | null
          created_at?: string
          date?: string
          energie: number
          humeur: number
          id?: string
          nb_blocs?: number
          note?: string | null
          ressenti_note?: string | null
          ressenti_score?: number | null
          serenite?: number
          session_duration_sec?: number | null
          session_ended?: boolean
          session_ended_at?: string | null
          session_source?: string
          session_started_at?: string | null
          temps: number
          updated_at?: string
          user_id: string
        }
        Update: {
          blocs_completes?: number[]
          coach_comment?: string | null
          created_at?: string
          date?: string
          energie?: number
          humeur?: number
          id?: string
          nb_blocs?: number
          note?: string | null
          ressenti_note?: string | null
          ressenti_score?: number | null
          serenite?: number
          session_duration_sec?: number | null
          session_ended?: boolean
          session_ended_at?: string | null
          session_source?: string
          session_started_at?: string | null
          temps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_assignments: {
        Row: {
          abonne_id: string
          coach_id: string
          created_at: string
          id: string
        }
        Insert: {
          abonne_id: string
          coach_id: string
          created_at?: string
          id?: string
        }
        Update: {
          abonne_id?: string
          coach_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      coach_reviews: {
        Row: {
          abonne_id: string
          coach_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
        }
        Insert: {
          abonne_id: string
          coach_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
        }
        Update: {
          abonne_id?: string
          coach_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      coach_sessions: {
        Row: {
          abonne_id: string
          actif: boolean
          blocs: Json
          coach_id: string
          created_at: string
          date_seance: string | null
          frequence_jours: number
          id: string
          objectif: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          abonne_id: string
          actif?: boolean
          blocs?: Json
          coach_id: string
          created_at?: string
          date_seance?: string | null
          frequence_jours?: number
          id?: string
          objectif?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          abonne_id?: string
          actif?: boolean
          blocs?: Json
          coach_id?: string
          created_at?: string
          date_seance?: string | null
          frequence_jours?: number
          id?: string
          objectif?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          abonne_id: string
          abonne_last_read_at: string
          coach_id: string
          coach_last_read_at: string
          created_at: string
          id: string
          last_message_at: string
        }
        Insert: {
          abonne_id: string
          abonne_last_read_at?: string
          coach_id: string
          coach_last_read_at?: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Update: {
          abonne_id?: string
          abonne_last_read_at?: string
          coach_id?: string
          coach_last_read_at?: string
          created_at?: string
          id?: string
          last_message_at?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          coach_id: string
          created_at: string
          email: string | null
          expires_at: string
          id: string
          token: string | null
          used_at: string | null
        }
        Insert: {
          coach_id: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          token?: string | null
          used_at?: string | null
        }
        Update: {
          coach_id?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          token?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string | null
          created_at: string
          from_user_id: string
          id: string
          texte: string
          to_user_id: string | null
          type: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          texte: string
          to_user_id?: string | null
          type?: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          texte?: string
          to_user_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abonnement_depuis: string | null
          nom: string | null
          sexe: string | null
          age: number | null
          taille_cm: number | null
          historique_sportif: string | null
          antecedents_blessures: string | null
          objectif_moyen_terme: string | null
          objectif_long_terme: string | null
          onboarding_done: boolean
          abonnement_plan: string
          abonnement_statut: string
          avatar_url: string | null
          bio: string | null
          chrono_marathon: string | null
          created_at: string
          discipline: string | null
          email: string | null
          evenements: Json
          id: string
          niveau_agent: number
          objectif_course: string | null
          objectif_principal: string | null
          points_forts: Json
          prenom: string
          profil_psycho: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abonnement_depuis?: string | null
          nom?: string | null
          sexe?: string | null
          age?: number | null
          taille_cm?: number | null
          historique_sportif?: string | null
          antecedents_blessures?: string | null
          objectif_moyen_terme?: string | null
          objectif_long_terme?: string | null
          onboarding_done?: boolean
          abonnement_plan?: string
          abonnement_statut?: string
          avatar_url?: string | null
          bio?: string | null
          chrono_marathon?: string | null
          created_at?: string
          discipline?: string | null
          email?: string | null
          evenements?: Json
          id?: string
          niveau_agent?: number
          objectif_course?: string | null
          objectif_principal?: string | null
          points_forts?: Json
          prenom?: string
          profil_psycho?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abonnement_depuis?: string | null
          nom?: string | null
          sexe?: string | null
          age?: number | null
          taille_cm?: number | null
          historique_sportif?: string | null
          antecedents_blessures?: string | null
          objectif_moyen_terme?: string | null
          objectif_long_terme?: string | null
          onboarding_done?: boolean
          abonnement_plan?: string
          abonnement_statut?: string
          avatar_url?: string | null
          bio?: string | null
          chrono_marathon?: string | null
          created_at?: string
          discipline?: string | null
          email?: string | null
          evenements?: Json
          id?: string
          niveau_agent?: number
          objectif_course?: string | null
          objectif_principal?: string | null
          points_forts?: Json
          prenom?: string
          profil_psycho?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_completions: {
        Row: {
          abonne_id: string
          coach_id: string
          created_at: string
          date: string
          id: string
          jour: string
          program_id: string
          ressenti_note: string | null
          ressenti_score: number | null
          session_duration_sec: number | null
          session_ended_at: string | null
          session_started_at: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          abonne_id: string
          coach_id: string
          created_at?: string
          date?: string
          id?: string
          jour: string
          program_id: string
          ressenti_note?: string | null
          ressenti_score?: number | null
          session_duration_sec?: number | null
          session_ended_at?: string | null
          session_started_at?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          abonne_id?: string
          coach_id?: string
          created_at?: string
          date?: string
          id?: string
          jour?: string
          program_id?: string
          ressenti_note?: string | null
          ressenti_score?: number | null
          session_duration_sec?: number | null
          session_ended_at?: string | null
          session_started_at?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_completions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_templates: {
        Row: {
          blocs: Json
          coach_id: string
          created_at: string
          id: string
          objectif: string | null
          titre: string
          updated_at: string
        }
        Insert: {
          blocs?: Json
          coach_id: string
          created_at?: string
          id?: string
          objectif?: string | null
          titre: string
          updated_at?: string
        }
        Update: {
          blocs?: Json
          coach_id?: string
          created_at?: string
          id?: string
          objectif?: string | null
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      programs: {
        Row: {
          abonne_id: string
          blocs: Json
          coach_id: string
          created_at: string
          id: string
          objectif: string | null
          semaine_debut: string
          titre: string
          updated_at: string
        }
        Insert: {
          abonne_id: string
          blocs?: Json
          coach_id: string
          created_at?: string
          id?: string
          objectif?: string | null
          semaine_debut?: string
          titre?: string
          updated_at?: string
        }
        Update: {
          abonne_id?: string
          blocs?: Json
          coach_id?: string
          created_at?: string
          id?: string
          objectif?: string | null
          semaine_debut?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      squad_members: {
        Row: {
          abonne_id: string
          id: string
          joined_at: string
          squad_id: string
        }
        Insert: {
          abonne_id: string
          id?: string
          joined_at?: string
          squad_id: string
        }
        Update: {
          abonne_id?: string
          id?: string
          joined_at?: string
          squad_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          coach_id: string
          couleur: string | null
          created_at: string
          id: string
          nom: string
          objectif: string | null
          updated_at: string
        }
        Insert: {
          coach_id: string
          couleur?: string | null
          created_at?: string
          id?: string
          nom: string
          objectif?: string | null
          updated_at?: string
        }
        Update: {
          coach_id?: string
          couleur?: string | null
          created_at?: string
          id?: string
          nom?: string
          objectif?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      training_slots: {
        Row: {
          abonne_id: string
          coach_id: string
          created_at: string
          date_slot: string
          duree_min: number
          id: string
          lieu: string | null
          note: string | null
          proposed_by: string
          status: string
          updated_at: string
        }
        Insert: {
          abonne_id: string
          coach_id: string
          created_at?: string
          date_slot: string
          duree_min?: number
          id?: string
          lieu?: string | null
          note?: string | null
          proposed_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          abonne_id?: string
          coach_id?: string
          created_at?: string
          date_slot?: string
          duree_min?: number
          id?: string
          lieu?: string | null
          note?: string | null
          proposed_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weight_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          note: string | null
          updated_at: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
    }
    Views: {
      athlete_stats: {
        Row: {
          avg_energie: number | null
          avg_humeur: number | null
          avg_serenite: number | null
          email: string | null
          last_checkin: string | null
          niveau_agent: number | null
          objectif_principal: string | null
          prenom: string | null
          total_checkins: number | null
          user_id: string | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          blocs_completes: number[] | null
          coach_comment: string | null
          created_at: string | null
          date: string | null
          energie: number | null
          humeur: number | null
          id: string | null
          nb_blocs: number | null
          ressenti_note: string | null
          ressenti_score: number | null
          serenite: number | null
          session_duration_sec: number | null
          session_ended: boolean | null
          session_ended_at: string | null
          session_source: string | null
          session_started_at: string | null
          temps: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          blocs_completes?: number[] | null
          coach_comment?: string | null
          created_at?: string | null
          date?: string | null
          energie?: number | null
          humeur?: number | null
          id?: string | null
          nb_blocs?: number | null
          ressenti_note?: string | null
          ressenti_score?: number | null
          serenite?: number | null
          session_duration_sec?: number | null
          session_ended?: boolean | null
          session_ended_at?: string | null
          session_source?: string | null
          session_started_at?: string | null
          temps?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          blocs_completes?: number[] | null
          coach_comment?: string | null
          created_at?: string | null
          date?: string | null
          energie?: number | null
          humeur?: number | null
          id?: string | null
          nb_blocs?: number | null
          ressenti_note?: string | null
          ressenti_score?: number | null
          serenite?: number | null
          session_duration_sec?: number | null
          session_ended?: boolean | null
          session_ended_at?: string | null
          session_source?: string | null
          session_started_at?: string | null
          temps?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_notification: {
        Args: {
          p_body?: string
          p_link?: string
          p_title: string
          p_type: string
          p_user_id: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_squad_coach: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      is_squad_member: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      set_session_comment: {
        Args: { p_checkin_id: string; p_comment: string }
        Returns: undefined
      }
      validate_invitation: {
        Args: { p_token: string }
        Returns: {
          coach_id: string
          email: string
        }[]
      }
    }
    Enums: {
      app_role: "coach" | "abonne"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["coach", "abonne"],
    },
  },
} as const
