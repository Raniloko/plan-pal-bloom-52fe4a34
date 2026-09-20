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
      activity_log: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          email_type: string
          id: string
          recipient_email: string
          recipient_name: string | null
          reservation_id: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          email_type: string
          id?: string
          recipient_email: string
          recipient_name?: string | null
          reservation_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          email_type?: string
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          reservation_id?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      login_attempts: {
        Row: {
          attempted_at: string
          email: string
          id: string
          ip: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          email: string
          id?: string
          ip?: string
          success?: boolean
        }
        Update: {
          attempted_at?: string
          email?: string
          id?: string
          ip?: string
          success?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          reservation_id: string | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          reservation_id?: string | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          reservation_id?: string | null
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cancellation_reason: string | null
          cancellation_token: string | null
          checked_in_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          guest_count: number
          honeypot: string | null
          id: string
          message: string | null
          occasion: string
          recurring_group_id: string | null
          reservation_date: string
          reservation_time: string
          status: string
          unit_id: string | null
          updated_at: string
          zone: string
        }
        Insert: {
          cancellation_reason?: string | null
          cancellation_token?: string | null
          checked_in_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          guest_count?: number
          honeypot?: string | null
          id?: string
          message?: string | null
          occasion: string
          recurring_group_id?: string | null
          reservation_date: string
          reservation_time: string
          status?: string
          unit_id?: string | null
          updated_at?: string
          zone: string
        }
        Update: {
          cancellation_reason?: string | null
          cancellation_token?: string | null
          checked_in_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          guest_count?: number
          honeypot?: string | null
          id?: string
          message?: string | null
          occasion?: string
          recurring_group_id?: string | null
          reservation_date?: string
          reservation_time?: string
          status?: string
          unit_id?: string | null
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      unit_blocks: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          unit_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_blocks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          area: string
          capacity: number | null
          created_at: string | null
          id: string
          name: string
          notes: string | null
          occupied_until: string | null
          position_index: number | null
          status: string | null
        }
        Insert: {
          area: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          name: string
          notes?: string | null
          occupied_until?: string | null
          position_index?: number | null
          status?: string | null
        }
        Update: {
          area?: string
          capacity?: number | null
          created_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          occupied_until?: string | null
          position_index?: number | null
          status?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username: string | null
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
          username?: string | null
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          area: string
          created_at: string | null
          desired_date: string
          desired_time: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id: string
          notified_at: string | null
          status: string | null
        }
        Insert: {
          area: string
          created_at?: string | null
          desired_date: string
          desired_time: string
          guest_email: string
          guest_name: string
          guest_phone: string
          id?: string
          notified_at?: string | null
          status?: string | null
        }
        Update: {
          area?: string
          created_at?: string | null
          desired_date?: string
          desired_time?: string
          guest_email?: string
          guest_name?: string
          guest_phone?: string
          id?: string
          notified_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reserve_atomic: {
        Args: {
          p_date: string
          p_duration_min: number
          p_payload: Json
          p_time: string
          p_unit_id: string
        }
        Returns: string
      }
      reserve_billard_auto: {
        Args: {
          p_date: string
          p_duration_min: number
          p_payload: Json
          p_time: string
        }
        Returns: {
          reservation_id: string
          unit_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
