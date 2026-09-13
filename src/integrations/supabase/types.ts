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
      cron_config: {
        Row: {
          cron_secret: string
          id: boolean
        }
        Insert: {
          cron_secret: string
          id?: boolean
        }
        Update: {
          cron_secret?: string
          id?: boolean
        }
        Relationships: []
      }
      fda_recalls: {
        Row: {
          city: string
          classification: string
          distribution_pattern: string
          drug_name: string
          first_seen_at: string
          last_synced_at: string
          lot_numbers: string
          ndc_codes: string[]
          product_description: string
          reason_for_recall: string
          recall_initiation_date: string
          recall_number: string
          recalling_firm: string
          report_date: string
          state: string
          status: string
        }
        Insert: {
          city?: string
          classification?: string
          distribution_pattern?: string
          drug_name?: string
          first_seen_at?: string
          last_synced_at?: string
          lot_numbers?: string
          ndc_codes?: string[]
          product_description?: string
          reason_for_recall?: string
          recall_initiation_date?: string
          recall_number: string
          recalling_firm?: string
          report_date?: string
          state?: string
          status?: string
        }
        Update: {
          city?: string
          classification?: string
          distribution_pattern?: string
          drug_name?: string
          first_seen_at?: string
          last_synced_at?: string
          lot_numbers?: string
          ndc_codes?: string[]
          product_description?: string
          reason_for_recall?: string
          recall_initiation_date?: string
          recall_number?: string
          recalling_firm?: string
          report_date?: string
          state?: string
          status?: string
        }
        Relationships: []
      }
      patient_interaction_checks: {
        Row: {
          fingerprint: string
          patient_id: string
          result: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          fingerprint: string
          patient_id: string
          result: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          fingerprint?: string
          patient_id?: string
          result?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          approval_status: string
          city: string | null
          created_at: string
          dea_number: string | null
          email: string | null
          full_name: string | null
          hours: string | null
          id: string
          license_number: string | null
          notes: string | null
          npi_number: string | null
          pharmacy_location: string | null
          pharmacy_name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          street_address: string | null
          updated_at: string
        }
        Insert: {
          approval_status?: string
          city?: string | null
          created_at?: string
          dea_number?: string | null
          email?: string | null
          full_name?: string | null
          hours?: string | null
          id: string
          license_number?: string | null
          notes?: string | null
          npi_number?: string | null
          pharmacy_location?: string | null
          pharmacy_name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Update: {
          approval_status?: string
          city?: string | null
          created_at?: string
          dea_number?: string | null
          email?: string | null
          full_name?: string | null
          hours?: string | null
          id?: string
          license_number?: string | null
          notes?: string | null
          npi_number?: string | null
          pharmacy_location?: string | null
          pharmacy_name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_analyses: {
        Row: {
          case_key: string
          id: string
          snapshot: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          case_key: string
          id?: string
          snapshot: Json
          updated_at?: string
          user_id?: string
        }
        Update: {
          case_key?: string
          id?: string
          snapshot?: Json
          updated_at?: string
          user_id?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
      app_role: ["admin", "staff"],
    },
  },
} as const
