export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_notes: {
        Row: {
          bank_application_id: string
          created_at: string | null
          created_by_user_id: string
          id: string
          note: string | null
        }
        Insert: {
          bank_application_id: string
          created_at?: string | null
          created_by_user_id: string
          id?: string
          note?: string | null
        }
        Update: {
          bank_application_id?: string
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_notes_bank_application_id_fkey"
            columns: ["bank_application_id"]
            isOneToOne: false
            referencedRelation: "bank_application"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      bank: {
        Row: {
          created_at: string | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bank_application: {
        Row: {
          applied_amount: number | null
          approved_amount: number | null
          bank_name: string
          created_at: string | null
          disburse_date: string | null
          id: string
          lead_id: string
          lead_stage: Database["public"]["Enums"]["lead_stage"] | null
          loan_app_number: string | null
          login_date: string | null
          updated_at: string | null
        }
        Insert: {
          applied_amount?: number | null
          approved_amount?: number | null
          bank_name: string
          created_at?: string | null
          disburse_date?: string | null
          id?: string
          lead_id: string
          lead_stage?: Database["public"]["Enums"]["lead_stage"] | null
          loan_app_number?: string | null
          login_date?: string | null
          updated_at?: string | null
        }
        Update: {
          applied_amount?: number | null
          approved_amount?: number | null
          bank_name?: string
          created_at?: string | null
          disburse_date?: string | null
          id?: string
          lead_id?: string
          lead_stage?: Database["public"]["Enums"]["lead_stage"] | null
          loan_app_number?: string | null
          login_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_application_bank_name_fkey"
            columns: ["bank_name"]
            isOneToOne: false
            referencedRelation: "bank"
            referencedColumns: ["name"]
          },
          {
            foreignKeyName: "bank_application_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string | null
          id: string
          lead_id: string
          storage_object_path: string
          uploaded_by_user_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name?: string | null
          id?: string
          lead_id: string
          storage_object_path: string
          uploaded_by_user_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          id?: string
          lead_id?: string
          storage_object_path?: string
          uploaded_by_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_missed_reasons: {
        Row: {
          created_at: string | null
          id: string
          lead_id: string
          reason_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lead_id: string
          reason_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lead_id?: string
          reason_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_missed_reasons_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_missed_reasons_reason_id_fkey"
            columns: ["reason_id"]
            isOneToOne: false
            referencedRelation: "missed_opportunity"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          created_at: string | null
          created_by_user_id: string
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id: string
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string | null
          current_pin_code: string | null
          current_resi_address: string | null
          dob: string | null
          first_name: string
          id: string
          last_name: string | null
          lead_owner: string | null
          mobile_number: string
          mother_name: string | null
          net_salary: number | null
          office_address: string | null
          official_mail_id: string | null
          permanent_address: string | null
          personal_mail_id: string | null
          reference_1_address: string | null
          reference_1_name: string | null
          reference_1_phone: string | null
          reference_2_address: string | null
          reference_2_name: string | null
          reference_2_phone: string | null
          rented_owned: Database["public"]["Enums"]["rental_status"] | null
          segment: Database["public"]["Enums"]["segment_type"] | null
          spouse_name: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          current_pin_code?: string | null
          current_resi_address?: string | null
          dob?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          lead_owner?: string | null
          mobile_number: string
          mother_name?: string | null
          net_salary?: number | null
          office_address?: string | null
          official_mail_id?: string | null
          permanent_address?: string | null
          personal_mail_id?: string | null
          reference_1_address?: string | null
          reference_1_name?: string | null
          reference_1_phone?: string | null
          reference_2_address?: string | null
          reference_2_name?: string | null
          reference_2_phone?: string | null
          rented_owned?: Database["public"]["Enums"]["rental_status"] | null
          spouse_name?: string | null
          segment?: Database["public"]["Enums"]["segment_type"] | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          current_pin_code?: string | null
          current_resi_address?: string | null
          dob?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          lead_owner?: string | null
          mobile_number?: string
          mother_name?: string | null
          net_salary?: number | null
          office_address?: string | null
          official_mail_id?: string | null
          permanent_address?: string | null
          personal_mail_id?: string | null
          reference_1_address?: string | null
          reference_1_name?: string | null
          reference_1_phone?: string | null
          reference_2_address?: string | null
          reference_2_name?: string | null
          reference_2_phone?: string | null
          rented_owned?: Database["public"]["Enums"]["rental_status"] | null
          segment?: Database["public"]["Enums"]["segment_type"] | null
          spouse_name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
      missed_opportunity: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string | null
          id: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_access_bank_application: {
        Args: { requesting_user_id: string; target_bank_app_id: string }
        Returns: boolean
      }
      can_user_access_lead: {
        Args: { requesting_user_id: string; target_lead_id: string }
        Returns: boolean
      }
      check_lead_status_by_mobile: {
        Args: { search_mobile: string }
        Returns: Json
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      handle_document_upload: {
        Args: {
          p_lead_id: string
          p_document_type: string
          p_file_name: string
          p_storage_path: string
        }
        Returns: Json
      }
      insert_bank_application: {
        Args: {
          p_lead_id: string
          p_bank_name: string
          p_loan_app_number: string
          p_applied_amount: number
          p_login_date: string
          p_lead_stage?: string
        }
        Returns: Json
      }
      is_owner_in_requesting_user_team: {
        Args: { requesting_user_id: string; target_lead_owner_id: string }
        Returns: boolean
      }
      update_bank_application: {
        Args: {
          p_id: string
          p_bank_name: string
          p_loan_app_number: string
          p_applied_amount: number
          p_approved_amount: number
          p_lead_stage: string
          p_login_date: string
          p_disburse_date: string
        }
        Returns: Json
      }
    }
    Enums: {
      lead_stage:
        | "New"
        | "Under Review"
        | "Reject Review"
        | "Reject"
        | "Approved"
        | "Disbursed"
        | "documents_incomplete"
      rental_status: "Rented" | "Owned"
      segment_type: "PL" | "BL"
      user_role: "admin" | "backend" | "team_leader" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      lead_stage: [
        "New",
        "Under Review",
        "Reject Review",
        "Reject",
        "Approved",
        "Disbursed",
        "documents_incomplete",
      ],
      rental_status: ["Rented", "Owned"],
      segment_type: ["PL", "BL"],
      user_role: ["admin", "backend", "team_leader", "agent"],
    },
  },
} as const
