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
          created_by_user_id: string | null
          id: string
          note: string | null
        }
        Insert: {
          bank_application_id: string
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          note?: string | null
        }
        Update: {
          bank_application_id?: string
          created_at?: string | null
          created_by_user_id?: string | null
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
            foreignKeyName: "app_notes_bank_application_id_fkey"
            columns: ["bank_application_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notes_bank_application_id_fkey"
            columns: ["bank_application_id"]
            isOneToOne: false
            referencedRelation: "v_disbursed_applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "app_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "app_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
      application_error_logs: {
        Row: {
          details: Json | null
          error_code: string | null
          error_message: string
          error_source: string
          id: string
          resolved_status: boolean
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          error_code?: string | null
          error_message: string
          error_source: string
          id?: string
          resolved_status?: boolean
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          error_code?: string | null
          error_message?: string
          error_source?: string
          id?: string
          resolved_status?: boolean
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "application_error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "application_error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "application_error_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
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
          cashback: number | null
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
          cashback?: number | null
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
          cashback?: number | null
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
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "bank_application_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_application_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      bulk_send_details: {
        Row: {
          bulk_send_id: string
          failure_reason: string | null
          id: string
          mobile_number_e164: string
          status: Database["public"]["Enums"]["bulk_send_detail_status_enum"]
          whatsapp_message_id: string | null
        }
        Insert: {
          bulk_send_id: string
          failure_reason?: string | null
          id?: string
          mobile_number_e164: string
          status?: Database["public"]["Enums"]["bulk_send_detail_status_enum"]
          whatsapp_message_id?: string | null
        }
        Update: {
          bulk_send_id?: string
          failure_reason?: string | null
          id?: string
          mobile_number_e164?: string
          status?: Database["public"]["Enums"]["bulk_send_detail_status_enum"]
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_send_details_bulk_send_id_fkey"
            columns: ["bulk_send_id"]
            isOneToOne: false
            referencedRelation: "bulk_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_sends: {
        Row: {
          admin_user_id: string
          business_whatsapp_number_id: string | null
          campaign_name: string | null
          completed_at: string | null
          created_at: string | null
          csv_file_name: string | null
          id: string
          status: Database["public"]["Enums"]["bulk_send_status_enum"]
          template_id: string
          total_recipients: number
          updated_at: string | null
        }
        Insert: {
          admin_user_id: string
          business_whatsapp_number_id?: string | null
          campaign_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          csv_file_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["bulk_send_status_enum"]
          template_id: string
          total_recipients: number
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string
          business_whatsapp_number_id?: string | null
          campaign_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          csv_file_name?: string | null
          id?: string
          status?: Database["public"]["Enums"]["bulk_send_status_enum"]
          template_id?: string
          total_recipients?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_sends_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "bulk_sends_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_sends_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "bulk_sends_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates_cache"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_bulk_sends_business_whatsapp_number"
            columns: ["business_whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "business_whatsapp_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_whatsapp_numbers: {
        Row: {
          access_token: string | null
          chatbot_endpoint_url: string | null
          chatbot_identifier: string
          created_at: string | null
          current_mps_target: number | null
          display_number: string
          friendly_name: string | null
          id: string
          is_active: boolean
          is_rate_capped_today: boolean
          mps_target_updated_at: string | null
          segment: Database["public"]["Enums"]["segment_type"]
          updated_at: string | null
          waba_id: string | null
          waba_phone_number_id: string
        }
        Insert: {
          access_token?: string | null
          chatbot_endpoint_url?: string | null
          chatbot_identifier: string
          created_at?: string | null
          current_mps_target?: number | null
          display_number: string
          friendly_name?: string | null
          id?: string
          is_active?: boolean
          is_rate_capped_today?: boolean
          mps_target_updated_at?: string | null
          segment: Database["public"]["Enums"]["segment_type"]
          updated_at?: string | null
          waba_id?: string | null
          waba_phone_number_id: string
        }
        Update: {
          access_token?: string | null
          chatbot_endpoint_url?: string | null
          chatbot_identifier?: string
          created_at?: string | null
          current_mps_target?: number | null
          display_number?: string
          friendly_name?: string | null
          id?: string
          is_active?: boolean
          is_rate_capped_today?: boolean
          mps_target_updated_at?: string | null
          segment?: Database["public"]["Enums"]["segment_type"]
          updated_at?: string | null
          waba_id?: string | null
          waba_phone_number_id?: string
        }
        Relationships: []
      }
      conversation_assignment_audit: {
        Row: {
          actor_id: string
          changed_at: string
          conversation_id: string
          id: number
          new_agent_id: string | null
          old_agent_id: string | null
          reason: string | null
        }
        Insert: {
          actor_id: string
          changed_at?: string
          conversation_id: string
          id?: number
          new_agent_id?: string | null
          old_agent_id?: string | null
          reason?: string | null
        }
        Update: {
          actor_id?: string
          changed_at?: string
          conversation_id?: string
          id?: number
          new_agent_id?: string | null
          old_agent_id?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_assignment_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_new_agent_id_fkey"
            columns: ["new_agent_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_new_agent_id_fkey"
            columns: ["new_agent_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_new_agent_id_fkey"
            columns: ["new_agent_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_old_agent_id_fkey"
            columns: ["old_agent_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_old_agent_id_fkey"
            columns: ["old_agent_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_assignment_audit_old_agent_id_fkey"
            columns: ["old_agent_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
      conversation_status_audit: {
        Row: {
          changed_at: string
          changed_by: string
          conversation_id: string
          id: number
          new_status: Database["public"]["Enums"]["conversation_status_enum"]
          old_status: Database["public"]["Enums"]["conversation_status_enum"]
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          conversation_id: string
          id?: number
          new_status: Database["public"]["Enums"]["conversation_status_enum"]
          old_status: Database["public"]["Enums"]["conversation_status_enum"]
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          conversation_id?: string
          id?: number
          new_status?: Database["public"]["Enums"]["conversation_status_enum"]
          old_status?: Database["public"]["Enums"]["conversation_status_enum"]
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_status_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_status_audit_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assigned_agent_id: string | null
          business_whatsapp_number_id: string
          contact_e164_phone: string
          created_at: string | null
          id: string
          is_chatbot_active: boolean
          last_customer_message_at: string | null
          last_message_at: string | null
          lead_id: string | null
          segment: Database["public"]["Enums"]["segment_type"]
          status: Database["public"]["Enums"]["conversation_status_enum"]
          tags: string[] | null
          updated_at: string | null
          version: number
        }
        Insert: {
          assigned_agent_id?: string | null
          business_whatsapp_number_id: string
          contact_e164_phone: string
          created_at?: string | null
          id?: string
          is_chatbot_active?: boolean
          last_customer_message_at?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          segment: Database["public"]["Enums"]["segment_type"]
          status?: Database["public"]["Enums"]["conversation_status_enum"]
          tags?: string[] | null
          updated_at?: string | null
          version?: number
        }
        Update: {
          assigned_agent_id?: string | null
          business_whatsapp_number_id?: string
          contact_e164_phone?: string
          created_at?: string | null
          id?: string
          is_chatbot_active?: boolean
          last_customer_message_at?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          segment?: Database["public"]["Enums"]["segment_type"]
          status?: Database["public"]["Enums"]["conversation_status_enum"]
          tags?: string[] | null
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversations_business_whatsapp_number_id_fkey"
            columns: ["business_whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "business_whatsapp_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      internal_notes: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          note_content: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          note_content: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          note_content?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "internal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
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
          uploaded_by_user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name?: string | null
          id?: string
          lead_id: string
          storage_object_path: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          id?: string
          lead_id?: string
          storage_object_path?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "lead_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
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
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_missed_reasons_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_missed_reasons_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
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
          created_by_user_id: string | null
          id: string
          lead_id: string
          note: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          lead_id: string
          note?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          lead_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "lead_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
          },
        ]
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string | null
          current_pin_code: string | null
          current_resi_address: string | null
          date_of_joining: string | null
          designation: string | null
          dob: string | null
          father_name: string | null
          first_name: string
          id: string
          last_name: string | null
          lead_owner: string | null
          mobile_number: string
          mother_name: string | null
          nature_of_business: string | null
          net_salary: number | null
          office_address: string | null
          official_mail_id: string | null
          pan: string | null
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
          turnover: number | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          current_pin_code?: string | null
          current_resi_address?: string | null
          date_of_joining?: string | null
          designation?: string | null
          dob?: string | null
          father_name?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          lead_owner?: string | null
          mobile_number: string
          mother_name?: string | null
          nature_of_business?: string | null
          net_salary?: number | null
          office_address?: string | null
          official_mail_id?: string | null
          pan?: string | null
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
          turnover?: number | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          current_pin_code?: string | null
          current_resi_address?: string | null
          date_of_joining?: string | null
          designation?: string | null
          dob?: string | null
          father_name?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          lead_owner?: string | null
          mobile_number?: string
          mother_name?: string | null
          nature_of_business?: string | null
          net_salary?: number | null
          office_address?: string | null
          official_mail_id?: string | null
          pan?: string | null
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
          turnover?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
      message_notifications: {
        Row: {
          conversation_id: string
          created_at: string
          event_type: string
          id: string
          message_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          event_type?: string
          id?: string
          message_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string
        }
        Relationships: []
      }
      message_queue: {
        Row: {
          attempt_count: number
          bulk_send_id: string
          created_at: string | null
          id: string
          image_url: string | null
          last_attempt_at: string | null
          next_attempt_at: string
          recipient_e164_phone: string
          status: Database["public"]["Enums"]["message_queue_status_enum"]
          template_variables_used: Json | null
        }
        Insert: {
          attempt_count?: number
          bulk_send_id: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_attempt_at?: string | null
          next_attempt_at?: string
          recipient_e164_phone: string
          status?: Database["public"]["Enums"]["message_queue_status_enum"]
          template_variables_used?: Json | null
        }
        Update: {
          attempt_count?: number
          bulk_send_id?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          last_attempt_at?: string | null
          next_attempt_at?: string
          recipient_e164_phone?: string
          status?: Database["public"]["Enums"]["message_queue_status_enum"]
          template_variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "message_queue_bulk_send_id_fkey"
            columns: ["bulk_send_id"]
            isOneToOne: false
            referencedRelation: "bulk_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates_cache: {
        Row: {
          category: string
          components_json: Json
          id: string
          is_deleted: boolean | null
          language: string
          last_synced_at: string | null
          name: string
          status_from_whatsapp: string
          waba_id: string | null
        }
        Insert: {
          category: string
          components_json: Json
          id?: string
          is_deleted?: boolean | null
          language: string
          last_synced_at?: string | null
          name: string
          status_from_whatsapp: string
          waba_id?: string | null
        }
        Update: {
          category?: string
          components_json?: Json
          id?: string
          is_deleted?: boolean | null
          language?: string
          last_synced_at?: string | null
          name?: string
          status_from_whatsapp?: string
          waba_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename: string | null
          customer_media_mime_type: string | null
          customer_media_whatsapp_id: string | null
          error_message: string | null
          id: string
          media_url: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used: string | null
          template_variables_used: Json | null
          text_content: string | null
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id?: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages_y2025m05: {
        Row: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename: string | null
          customer_media_mime_type: string | null
          customer_media_whatsapp_id: string | null
          error_message: string | null
          id: string
          media_url: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used: string | null
          template_variables_used: Json | null
          text_content: string | null
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id?: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: []
      }
      messages_y2025m06: {
        Row: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename: string | null
          customer_media_mime_type: string | null
          customer_media_whatsapp_id: string | null
          error_message: string | null
          id: string
          media_url: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used: string | null
          template_variables_used: Json | null
          text_content: string | null
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id?: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: []
      }
      messages_y2025m07: {
        Row: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename: string | null
          customer_media_mime_type: string | null
          customer_media_whatsapp_id: string | null
          error_message: string | null
          id: string
          media_url: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used: string | null
          template_variables_used: Json | null
          text_content: string | null
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id?: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: []
      }
      messages_y2025m08: {
        Row: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename: string | null
          customer_media_mime_type: string | null
          customer_media_whatsapp_id: string | null
          error_message: string | null
          id: string
          media_url: string | null
          sender_id: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used: string | null
          template_variables_used: Json | null
          text_content: string | null
          timestamp: string
          whatsapp_message_id: string | null
        }
        Insert: {
          content_type: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          status: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp: string
          whatsapp_message_id?: string | null
        }
        Update: {
          content_type?: Database["public"]["Enums"]["message_content_type_enum"]
          conversation_id?: string
          customer_media_filename?: string | null
          customer_media_mime_type?: string | null
          customer_media_whatsapp_id?: string | null
          error_message?: string | null
          id?: string
          media_url?: string | null
          sender_id?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type_enum"]
          status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          template_name_used?: string | null
          template_variables_used?: Json | null
          text_content?: string | null
          timestamp?: string
          whatsapp_message_id?: string | null
        }
        Relationships: []
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
      daily_tasks: {
        Row: {
          assigned_to: string
          close_reason: Database["public"]["Enums"]["close_reason_enum"] | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          lead_id: string
          notes: string | null
          original_date: string
          scheduled_date: string
          status: Database["public"]["Enums"]["task_status_enum"]
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          close_reason?: Database["public"]["Enums"]["close_reason_enum"] | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id: string
          notes?: string | null
          original_date?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["task_status_enum"]
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          close_reason?: Database["public"]["Enums"]["close_reason_enum"] | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          lead_id?: string
          notes?: string | null
          original_date?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["task_status_enum"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          }
        ]
      }
      profile: {
        Row: {
          android_login: boolean
          bank_account_no: string | null
          bank_ifsc: string | null
          bank_name: string | null
          created_at: string | null
          device_id: string | null
          email: string | null
          emp_code: string
          extra_updated_at: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_chat_assigned_at: string | null
          last_name: string | null
          present_today: boolean
          role: Database["public"]["Enums"]["user_role"] | null
          salary_current: number | null
          segment: Database["public"]["Enums"]["segment_type"] | null
          updated_at: string | null
        }
        Insert: {
          android_login?: boolean
          bank_account_no?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          emp_code: string
          extra_updated_at?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean
          last_chat_assigned_at?: string | null
          last_name?: string | null
          present_today?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          salary_current?: number | null
          segment?: Database["public"]["Enums"]["segment_type"] | null
          updated_at?: string | null
        }
        Update: {
          android_login?: boolean
          bank_account_no?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          created_at?: string | null
          device_id?: string | null
          email?: string | null
          emp_code?: string
          extra_updated_at?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_chat_assigned_at?: string | null
          last_name?: string | null
          present_today?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          salary_current?: number | null
          segment?: Database["public"]["Enums"]["segment_type"] | null
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
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
    }
    Views: {
      conversation_with_lead_owner: {
        Row: {
          assigned_agent_id: string | null
          business_whatsapp_number_id: string | null
          contact_e164_phone: string | null
          created_at: string | null
          id: string | null
          last_customer_message_at: string | null
          last_message_at: string | null
          lead_first_name: string | null
          lead_id: string | null
          lead_last_name: string | null
          lead_owner: string | null
          lead_owner_email: string | null
          lead_owner_first_name: string | null
          lead_owner_id: string | null
          lead_owner_last_name: string | null
          lead_owner_role: Database["public"]["Enums"]["user_role"] | null
          segment: Database["public"]["Enums"]["segment_type"] | null
          status: Database["public"]["Enums"]["conversation_status_enum"] | null
          updated_at: string | null
          version: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "conversations_business_whatsapp_number_id_fkey"
            columns: ["business_whatsapp_number_id"]
            isOneToOne: false
            referencedRelation: "business_whatsapp_numbers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
      v_all_applications: {
        Row: {
          approved_amount: number | null
          bank_name: string | null
          id: string | null
          lead_first_name: string | null
          lead_id: string | null
          lead_last_name: string | null
          lead_owner_id: string | null
          lead_owner_name: string | null
          lead_segment: Database["public"]["Enums"]["segment_type"] | null
          lead_stage: Database["public"]["Enums"]["lead_stage"] | null
          login_date: string | null
          owner_is_active: boolean | null
          team_id: string | null
          team_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_application_bank_name_fkey"
            columns: ["bank_name"]
            isOneToOne: false
            referencedRelation: "bank"
            referencedColumns: ["name"]
          },
        ]
      }
      v_disbursed_applications: {
        Row: {
          application_created_at: string | null
          application_id: string | null
          application_updated_at: string | null
          applied_amount: number | null
          approved_amount: number | null
          bank_name: string | null
          disburse_date: string | null
          first_name: string | null
          last_name: string | null
          lead_id: string | null
          lead_owner: string | null
          lead_stage: Database["public"]["Enums"]["lead_stage"] | null
          loan_app_number: string | null
          login_date: string | null
          mobile_number: string | null
          owner_email: string | null
          owner_first_name: string | null
          owner_last_name: string | null
          segment: Database["public"]["Enums"]["segment_type"] | null
          team_id: string | null
          team_name: string | null
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
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "bank_application_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_application_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "conversation_with_lead_owner"
            referencedColumns: ["lead_owner_id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_owner_fkey"
            columns: ["lead_owner"]
            isOneToOne: false
            referencedRelation: "v_all_applications"
            referencedColumns: ["lead_owner_id"]
          },
        ]
      }
    }
    Functions: {
      acquire_rr_lock: {
        Args: { p_key: number }
        Returns: boolean
      }
      assign_conversation_and_update_related: {
        Args: {
          p_actor_id: string
          p_conversation_id: string
          p_new_assignee_id?: string
          p_reason?: string
          p_version?: number
        }
        Returns: Json
      }
      auth_test: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_agent_insert_into_conversation: {
        Args: { agent_id: string; target_conversation_id: string }
        Returns: boolean
      }
      can_agent_update_conversation_status: {
        Args:
          | { agent_id: string; target_conversation_id: string }
          | {
              p_agent_id: string
              p_convo_id: string
              p_new_status: Database["public"]["Enums"]["conversation_status_enum"]
            }
        Returns: boolean
      }
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
      close_idle_conversations: {
        Args: { p_hours?: number }
        Returns: number
      }
      converttoe164: {
        Args: { local_number: string; default_country_code?: string }
        Returns: string
      }
      converttolocalformat: {
        Args: { phone_param: string }
        Returns: string
      }
      get_all_filtered_applications: {
        Args: {
          p_segments?: string[]
          p_stages?: string[]
          p_owner_ids?: string[]
          p_team_ids?: string[]
          p_login_start?: string
          p_login_end?: string
          p_sort_column?: string
          p_sort_direction?: string
          p_page?: number
          p_rows_per_page?: number
          p_exclude_null_owners?: boolean
        }
        Returns: Json
      }
      get_custom_performance_report: {
        Args: {
          p_segments?: string[]
          p_owner_ids?: string[]
          p_team_ids?: string[]
          p_date_start?: string
          p_date_end?: string
        }
        Returns: {
          segment: Database["public"]["Enums"]["segment_type"]
          lead_owner_id: string
          lead_owner_name: string
          team_id: string
          team_name: string
          app_login_count: number
          total_disbursed_amount: number
          under_process_count: number
        }[]
      }
      get_filtered_disbursed_applications: {
        Args: {
          p_segments?: string[]
          p_owner_ids?: string[]
          p_team_ids?: string[]
          p_disburse_date_start?: string
          p_disburse_date_end?: string
          p_sort_by?: string
          p_sort_order?: string
          p_page?: number
          p_page_size?: number
        }
        Returns: Json
      }
      get_or_create_conversation_for_contact: {
        Args: {
          p_recipient_phone_e164: string
          p_business_number_id: string
          p_business_segment: Database["public"]["Enums"]["segment_type"]
          p_customer_name?: string
        }
        Returns: string
      }
      get_recent_bulk_campaigns_with_stats: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          campaign_name: string
          status: Database["public"]["Enums"]["bulk_send_status_enum"]
          total_recipients: number
          created_at: string
          updated_at: string
          sent_count: number
          failed_count: number
        }[]
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
      handle_whatsapp_message: {
        Args: {
          p_waba_phone_number_id: string
          p_customer_e164_phone: string
          p_customer_name: string
          p_whatsapp_message_id: string
          p_message_type: string
          p_message_timestamp_epoch: number
          p_text_content?: string
          p_media_id?: string
          p_media_mime_type?: string
          p_media_filename?: string
        }
        Returns: Json
      }
      initiate_bulk_send_campaign: {
        Args: {
          p_admin_user_id: string
          p_campaign_name: string
          p_template_id: string
          p_business_whatsapp_number_id: string
          p_recipients_data: Json
        }
        Returns: Json
      }
      insert_agent_message: {
        Args: {
          p_conversation_id: string
          p_agent_id: string
          p_whatsapp_id: string
          p_content_type: string
          p_text_content?: string
          p_template_name?: string
          p_template_vars?: Json
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
      insert_message: {
        Args: {
          p_conversation_id: string
          p_content_type: Database["public"]["Enums"]["message_content_type_enum"]
          p_sender_type: Database["public"]["Enums"]["message_sender_type_enum"]
          p_text_content?: string
          p_template_name?: string
          p_template_variables?: Json
          p_media_url?: string
          p_whatsapp_message_id?: string
          p_sender_id_override?: string
          p_initial_status?: Database["public"]["Enums"]["message_delivery_status_enum"]
          p_customer_media_whatsapp_id?: string
          p_customer_media_filename?: string
          p_customer_media_mime_type?: string
        }
        Returns: string
      }
      internal_find_or_create_lead_for_whatsapp: {
        Args: {
          p_customer_phone_e164: string
          p_segment: Database["public"]["Enums"]["segment_type"]
          p_customer_name: string
        }
        Returns: string
      }
      is_owner_in_requesting_user_team: {
        Args: { requesting_user_id: string; target_lead_owner_id: string }
        Returns: boolean
      }
      manage_message_partitions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      select_now_utc: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      set_conversation_status: {
        Args:
          | {
              p_agent_id: string
              p_convo_id: string
              p_target_status: Database["public"]["Enums"]["conversation_status_enum"]
              p_close_reason?: string
            }
          | {
              p_agent_id: string
              p_convo_id: string
              p_target_status: Database["public"]["Enums"]["conversation_status_enum"]
              p_reason?: string
              p_version?: number
            }
        Returns: Json
      }
      test_process_single_message: {
        Args: { message_id: string }
        Returns: Json
      }
      trigger_bulk_processor_http: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_bank_application: {
        Args: {
          p_id: string
          p_bank_name: string
          p_loan_app_number: string
          p_applied_amount: number
          p_approved_amount: number
          p_cashback: number
          p_lead_stage: string
          p_login_date: string
          p_disburse_date: string
        }
        Returns: Json
      }
    }
    Enums: {
      bulk_send_detail_status_enum: "sent" | "failed" | "skipped" | "pending"
      bulk_send_status_enum: "queued" | "processing" | "completed" | "failed"
      close_reason_enum: "customer_ni" | "low_sal" | "more_than_3_days_follow" | "docs_received" | "cibil_related"
      conversation_status_enum: "open" | "closed"
      lead_stage:
        | "New"
        | "Under Review"
        | "Reject Review"
        | "Reject"
        | "Approved"
        | "Disbursed"
        | "documents_incomplete"
        | "Sent to Bank"
      message_content_type_enum:
        | "text"
        | "image"
        | "document"
        | "template"
        | "system_notification"
      message_delivery_status_enum:
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "received"
      message_queue_status_enum: "pending" | "processing" | "retry_queued"
      message_sender_type_enum: "customer" | "agent" | "chatbot" | "system"
      rental_status: "Rented" | "Owned"
      segment_type: "PL" | "BL" | "PL_DIGITAL" | "BL_DIGITAL"
      task_status_enum: "open" | "closed"
      user_role:
        | "admin"
        | "backend"
        | "team_leader"
        | "agent"
        | "system"
        | "chatbot"
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
      bulk_send_detail_status_enum: ["sent", "failed", "skipped", "pending"],
      bulk_send_status_enum: ["queued", "processing", "completed", "failed"],
      conversation_status_enum: ["open", "closed"],
      lead_stage: [
        "New",
        "Under Review",
        "Reject Review",
        "Reject",
        "Approved",
        "Disbursed",
        "documents_incomplete",
        "Sent to Bank",
      ],
      message_content_type_enum: [
        "text",
        "image",
        "document",
        "template",
        "system_notification",
      ],
      message_delivery_status_enum: [
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "received",
      ],
      message_queue_status_enum: ["pending", "processing", "retry_queued"],
      message_sender_type_enum: ["customer", "agent", "chatbot", "system"],
      rental_status: ["Rented", "Owned"],
      segment_type: ["PL", "BL", "PL_DIGITAL", "BL_DIGITAL"],
      user_role: [
        "admin",
        "backend",
        "team_leader",
        "agent",
        "system",
        "chatbot",
      ],
    },
  },
} as const

// Agent Analysis Types
export interface AgentAnalysisData {
  snapshot_month: string;
  agent_id: string;
  agent_name: string;
  segment: Database["public"]["Enums"]["segment_type"];
  team_id: string;
  team_name: string;
  salary_current: number;
  total_disbursed_amount: number;
  total_cashback: number;
  total_revenue: number;
  total_cost: number;
  profit_loss: number;
  profit_margin: number;
  case_count: number;
}

export interface AgentAnalysisFilters {
  startMonth?: string;
  endMonth?: string;
  segment?: Database["public"]["Enums"]["segment_type"];
  agentId?: string;
}

export interface AgentAnalysisSummary {
  totalRevenue: number;
  totalCost: number;
  totalProfitLoss: number;
  totalAgents: number;
  profitableAgents: number;
  lossAgents: number;
  avgProfitMargin: number;
}