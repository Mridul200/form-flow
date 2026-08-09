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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      connect_requests: {
        Row: {
          amount: number
          condition: string
          created_at: string
          doctor_id: string
          id: string
          notes: string
          paid_at: string | null
          patient_id: string
          payment_method: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          revoked: boolean
          status: Database["public"]["Enums"]["request_status"]
          transaction_id: string | null
        }
        Insert: {
          amount?: number
          condition?: string
          created_at?: string
          doctor_id: string
          id?: string
          notes?: string
          paid_at?: string | null
          patient_id: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          revoked?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          condition?: string
          created_at?: string
          doctor_id?: string
          id?: string
          notes?: string
          paid_at?: string | null
          patient_id?: string
          payment_method?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          revoked?: boolean
          status?: Database["public"]["Enums"]["request_status"]
          transaction_id?: string | null
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          bio: string
          created_at: string
          fee_amount: number
          id: string
          specialty: string
          status: Database["public"]["Enums"]["request_status"]
          years_experience: number
        }
        Insert: {
          bio?: string
          created_at?: string
          fee_amount?: number
          id: string
          specialty?: string
          status?: Database["public"]["Enums"]["request_status"]
          years_experience?: number
        }
        Update: {
          bio?: string
          created_at?: string
          fee_amount?: number
          id?: string
          specialty?: string
          status?: Database["public"]["Enums"]["request_status"]
          years_experience?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          flagged: boolean
          id: string
          removed: boolean
          request_id: string
          sender_id: string
          text: string
        }
        Insert: {
          created_at?: string
          flagged?: boolean
          id?: string
          removed?: boolean
          request_id: string
          sender_id: string
          text: string
        }
        Update: {
          created_at?: string
          flagged?: boolean
          id?: string
          removed?: boolean
          request_id?: string
          sender_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "connect_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          is_active?: boolean
          name?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          accuracy: number
          corrections: string[]
          created_at: string
          duration_seconds: number
          exercise: string
          id: string
          invalid_reps: number
          summary: string
          user_id: string
          valid_reps: number
        }
        Insert: {
          accuracy?: number
          corrections?: string[]
          created_at?: string
          duration_seconds?: number
          exercise?: string
          id?: string
          invalid_reps?: number
          summary?: string
          user_id: string
          valid_reps?: number
        }
        Update: {
          accuracy?: number
          corrections?: string[]
          created_at?: string
          duration_seconds?: number
          exercise?: string
          id?: string
          invalid_reps?: number
          summary?: string
          user_id?: string
          valid_reps?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_link: {
        Args: { _doctor: string; _patient: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_request_participant: {
        Args: { _request: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "admin"
      payment_status: "pending" | "paid" | "failed"
      request_status: "pending" | "approved" | "rejected"
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
      app_role: ["patient", "doctor", "admin"],
      payment_status: ["pending", "paid", "failed"],
      request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
