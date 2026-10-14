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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          created_at: string
          details: Json
          entity: string
          entity_id: string | null
          id: string
        }
        Insert: {
          action: string
          actor?: string | null
          created_at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor?: string | null
          created_at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: string
        }
        Relationships: []
      }
      exercise_weight_history: {
        Row: {
          bodyweight_kg: number | null
          corrects_id: string | null
          created_at: string
          entry_date: string
          exercise_id: string
          id: string
          member: string
          notes: string | null
          reps: number | null
          rpe: number | null
          sets: number | null
          superseded_by: string | null
          weight_kg: number
          workout_log_id: string | null
        }
        Insert: {
          bodyweight_kg?: number | null
          corrects_id?: string | null
          created_at?: string
          entry_date: string
          exercise_id: string
          id?: string
          member: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          superseded_by?: string | null
          weight_kg: number
          workout_log_id?: string | null
        }
        Update: {
          bodyweight_kg?: number | null
          corrects_id?: string | null
          created_at?: string
          entry_date?: string
          exercise_id?: string
          id?: string
          member?: string
          notes?: string | null
          reps?: number | null
          rpe?: number | null
          sets?: number | null
          superseded_by?: string | null
          weight_kg?: number
          workout_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercise_weight_history_corrects_id_fkey"
            columns: ["corrects_id"]
            isOneToOne: false
            referencedRelation: "exercise_weight_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_weight_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_weight_history_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "exercise_weight_history"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_weight_history_workout_log_id_fkey"
            columns: ["workout_log_id"]
            isOneToOne: false
            referencedRelation: "workout_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          anatomy_image_url: string | null
          breathing: string
          category: string
          created_at: string
          difficulty: string
          equipment: string
          id: string
          image_url: string | null
          mistakes: string[]
          name_en: string
          name_vi: string
          primary_muscles: string[]
          progression: string
          safety: string[]
          secondary_muscles: string[]
          sets_reps: string
          slug: string
          sort_order: number
          starting_position: string
          steps: string[]
          updated_at: string
          video_url: string
          weight_type: string
        }
        Insert: {
          anatomy_image_url?: string | null
          breathing: string
          category: string
          created_at?: string
          difficulty: string
          equipment: string
          id?: string
          image_url?: string | null
          mistakes?: string[]
          name_en: string
          name_vi: string
          primary_muscles?: string[]
          progression: string
          safety?: string[]
          secondary_muscles?: string[]
          sets_reps: string
          slug: string
          sort_order: number
          starting_position: string
          steps?: string[]
          updated_at?: string
          video_url: string
          weight_type: string
        }
        Update: {
          anatomy_image_url?: string | null
          breathing?: string
          category?: string
          created_at?: string
          difficulty?: string
          equipment?: string
          id?: string
          image_url?: string | null
          mistakes?: string[]
          name_en?: string
          name_vi?: string
          primary_muscles?: string[]
          progression?: string
          safety?: string[]
          secondary_muscles?: string[]
          sets_reps?: string
          slug?: string
          sort_order?: number
          starting_position?: string
          steps?: string[]
          updated_at?: string
          video_url?: string
          weight_type?: string
        }
        Relationships: []
      }
      gym_sessions: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          location: string
          notes: string | null
          session_date: string
          start_time: string
          status: string
          thong_status: string
          thuan_status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          location?: string
          notes?: string | null
          session_date: string
          start_time: string
          status?: string
          thong_status?: string
          thuan_status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          location?: string
          notes?: string | null
          session_date?: string
          start_time?: string
          status?: string
          thong_status?: string
          thuan_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read_at: string | null
          session_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          session_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          session_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gym_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_error: string | null
          last_success_at: string | null
          p256dh: string
          status: string
          updated_at: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          p256dh: string
          status?: string
          updated_at?: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_error?: string | null
          last_success_at?: string | null
          p256dh?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          member: string
          notes: string | null
          reps: number | null
          session_id: string
          sets: number | null
          weight_kg: number | null
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          member: string
          notes?: string | null
          reps?: number | null
          session_id: string
          sets?: number | null
          weight_kg?: number | null
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          member?: string
          notes?: string | null
          reps?: number | null
          session_id?: string
          sets?: number | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "gym_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
