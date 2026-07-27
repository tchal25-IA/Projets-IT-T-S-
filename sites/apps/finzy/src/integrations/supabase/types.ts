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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_articles: {
        Row: {
          category: string
          content_md: string
          created_at: string
          id: string
          level: number
          market: string
          reading_time: number
          slug: string
          sort_order: number
          summary: string
          title: string
          xp_reward: number
        }
        Insert: {
          category?: string
          content_md?: string
          created_at?: string
          id?: string
          level?: number
          market?: string
          reading_time?: number
          slug: string
          sort_order?: number
          summary?: string
          title: string
          xp_reward?: number
        }
        Update: {
          category?: string
          content_md?: string
          created_at?: string
          id?: string
          level?: number
          market?: string
          reading_time?: number
          slug?: string
          sort_order?: number
          summary?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      academy_quizzes: {
        Row: {
          article_id: string
          correct_index: number
          id: string
          options: Json
          question: string
          xp_reward: number
        }
        Insert: {
          article_id: string
          correct_index?: number
          id?: string
          options?: Json
          question: string
          xp_reward?: number
        }
        Update: {
          article_id?: string
          correct_index?: number
          id?: string
          options?: Json
          question?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "academy_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          messages_json: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages_json?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages_json?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          count: number
          date: string
          user_id: string
        }
        Insert: {
          count?: number
          date?: string
          user_id: string
        }
        Update: {
          count?: number
          date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          description: string
          icon: string
          id: string
          key: string
          label: string
          xp_reward: number
        }
        Insert: {
          description: string
          icon: string
          id?: string
          key: string
          label: string
          xp_reward?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          key?: string
          label?: string
          xp_reward?: number
        }
        Relationships: []
      }
      budget_ceilings: {
        Row: {
          category: string
          ceiling_amount: number
          created_at: string
          currency: string
          id: string
          user_id: string
        }
        Insert: {
          category: string
          ceiling_amount?: number
          created_at?: string
          currency?: string
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          ceiling_amount?: number
          created_at?: string
          currency?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_ceilings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_quiz_answers: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          quiz_date: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          correct?: boolean
          created_at?: string
          id?: string
          quiz_date?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          quiz_date?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_quiz_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_events: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_expense: boolean
          label: string
          linked_project_id: string | null
          notes: string | null
          priority: string
          target_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_expense?: boolean
          label: string
          linked_project_id?: string | null
          notes?: string | null
          priority?: string
          target_date: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_expense?: boolean
          label?: string
          linked_project_id?: string | null
          notes?: string | null
          priority?: string
          target_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_events_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          currency: string
          current_value: number
          deadline: string | null
          id: string
          label: string
          target_value: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_value?: number
          deadline?: string | null
          id?: string
          label: string
          target_value: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_value?: number
          deadline?: string | null
          id?: string
          label?: string
          target_value?: number
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimoine_entries: {
        Row: {
          amount: number
          created_at: string
          currency: string
          date: string
          envelope_type: string
          id: string
          label: string
          market: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          envelope_type: string
          id?: string
          label: string
          market?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          date?: string
          envelope_type?: string
          id?: string
          label?: string
          market?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrimoine_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patrimoine_liabilities: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          label: string
          liability_type: string
          market: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          label: string
          liability_type?: string
          market?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          label?: string
          liability_type?: string
          market?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patrimoine_liabilities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_positions: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string | null
          price_per_unit: number
          quantity: number
          symbol: string
          trade_date: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name?: string | null
          price_per_unit?: number
          quantity?: number
          symbol: string
          trade_date?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string | null
          price_per_unit?: number
          quantity?: number
          symbol?: string
          trade_date?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          currency: string
          email: string | null
          id: string
          is_admin: boolean
          level: number
          market: string
          onboarding_completed: boolean
          plan: string
          premium_trial_ends_at: string | null
          premium_type: string | null
          profile_type: string
          referral_code: string | null
          referral_used_by: string | null
          updated_at: string
          username: string
          xp_total: number
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id: string
          is_admin?: boolean
          level?: number
          market?: string
          onboarding_completed?: boolean
          plan?: string
          premium_trial_ends_at?: string | null
          premium_type?: string | null
          profile_type?: string
          referral_code?: string | null
          referral_used_by?: string | null
          updated_at?: string
          username: string
          xp_total?: number
        }
        Update: {
          avatar?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          id?: string
          is_admin?: boolean
          level?: number
          market?: string
          onboarding_completed?: boolean
          plan?: string
          premium_trial_ends_at?: string | null
          premium_type?: string | null
          profile_type?: string
          referral_code?: string | null
          referral_used_by?: string | null
          updated_at?: string
          username?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referral_used_by_fkey"
            columns: ["referral_used_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          project_id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          project_id: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          project_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          currency: string
          current_amount: number
          deadline: string | null
          icon: string
          id: string
          status: string
          target_amount: number
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          icon?: string
          id?: string
          status?: string
          target_amount: number
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          icon?: string
          id?: string
          status?: string
          target_amount?: number
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_transactions: {
        Row: {
          active: boolean
          amount: number
          category: string
          created_at: string
          currency: string
          frequency: string
          id: string
          next_date: string
          note: string | null
          type: string
          user_id: string
        }
        Insert: {
          active?: boolean
          amount: number
          category: string
          created_at?: string
          currency?: string
          frequency?: string
          id?: string
          next_date?: string
          note?: string | null
          type?: string
          user_id: string
        }
        Update: {
          active?: boolean
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          frequency?: string
          id?: string
          next_date?: string
          note?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_simulations: {
        Row: {
          created_at: string
          id: string
          label: string
          params_json: Json
          result_json: Json
          simulator_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          params_json?: Json
          result_json?: Json
          simulator_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          params_json?: Json
          result_json?: Json
          simulator_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_simulations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          date: string
          id: string
          note: string | null
          project_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
          project_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          date?: string
          id?: string
          note?: string | null
          project_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_academy_progress: {
        Row: {
          article_id: string
          id: string
          quiz_passed: boolean
          read_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          id?: string
          quiz_passed?: boolean
          read_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          id?: string
          quiz_passed?: boolean
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_article_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string
          longest_streak: number
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string
          longest_streak?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          name: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      academy_quizzes_public: {
        Row: {
          article_id: string | null
          id: string | null
          options: Json | null
          question: string | null
          xp_reward: number | null
        }
        Insert: {
          article_id?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          xp_reward?: number | null
        }
        Update: {
          article_id?: string | null
          id?: string | null
          options?: Json | null
          question?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "academy_articles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_quiz_answer: {
        Args: { p_answer_index: number; p_quiz_id: string }
        Returns: boolean
      }
      get_leaderboard: {
        Args: { p_limit?: number }
        Returns: {
          level: number
          rank: number
          username_anon: string
          xp_total: number
        }[]
      }
      grant_xp: {
        Args: { p_user_id: string; p_xp: number }
        Returns: undefined
      }
      is_owner: { Args: { record_user_id: string }; Returns: boolean }
      update_streak: { Args: { p_user_id: string }; Returns: number }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
