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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      api_integrations: {
        Row: {
          config: Json | null
          is_active: boolean | null
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          is_active?: boolean | null
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          is_active?: boolean | null
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          end_time: string
          id: string
          invoice_id: string | null
          location_id: string | null
          notes: string | null
          patient_id: string | null
          payment_method_id: string | null
          price: number | null
          professional_id: string | null
          service_id: string | null
          start_time: string
          status: string | null
          title: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          invoice_id?: string | null
          location_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_method_id?: string | null
          price?: number | null
          professional_id?: string | null
          service_id?: string | null
          start_time: string
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          invoice_id?: string | null
          location_id?: string | null
          notes?: string | null
          patient_id?: string | null
          payment_method_id?: string | null
          price?: number | null
          professional_id?: string | null
          service_id?: string | null
          start_time?: string
          status?: string | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string | null
          delivery_date: string
          id: string
          message_template_id: string | null
          patient_id: string
          response_data: Json | null
          scheduled_date: string
          sent_at: string | null
          status: string
          template_id: string | null
          token: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          delivery_date: string
          id?: string
          message_template_id?: string | null
          patient_id: string
          response_data?: Json | null
          scheduled_date: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          token?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          delivery_date?: string
          id?: string
          message_template_id?: string | null
          patient_id?: string
          response_data?: Json | null
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          template_id?: string | null
          token?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessment_follow_ups_message_template_id_fkey"
            columns: ["message_template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_follow_ups_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_messages: {
        Row: {
          campaign_id: string
          content: string | null
          created_at: string | null
          error_message: string | null
          id: string
          message_id: string | null
          name: string | null
          phone: string
          sent_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          name?: string | null
          phone: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          content?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          name?: string | null
          phone?: string
          sent_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "marketing_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_settings: {
        Row: {
          address: Json | null
          cnpj: string | null
          created_at: string
          document_logo_url: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          pix_key: string | null
          primary_color: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string
          document_logo_url?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          primary_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: Json | null
          cnpj?: string | null
          created_at?: string
          document_logo_url?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          pix_key?: string | null
          primary_color?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      clinical_protocols: {
        Row: {
          created_at: string | null
          description: string | null
          evidence_sources: Json | null
          id: string
          interventions: Json
          is_active: boolean | null
          is_custom: boolean | null
          region: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          evidence_sources?: Json | null
          id?: string
          interventions?: Json
          is_active?: boolean | null
          is_custom?: boolean | null
          region: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          evidence_sources?: Json | null
          id?: string
          interventions?: Json
          is_active?: boolean | null
          is_custom?: boolean | null
          region?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clinical_records: {
        Row: {
          attachments: Json[] | null
          content: string | null
          created_at: string
          id: string
          patient_id: string
          professional_id: string | null
          title: string
        }
        Insert: {
          attachments?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          patient_id: string
          professional_id?: string | null
          title: string
        }
        Update: {
          attachments?: Json[] | null
          content?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_tokens: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          ip_address: string | null
          organization_id: string | null
          patient_id: string
          token: string
          used_at: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          patient_id: string
          token: string
          used_at?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          patient_id?: string
          token?: string
          used_at?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_tokens_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          id: string
          name: string
          type: string | null
        }
        Insert: {
          id?: string
          name: string
          type?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string | null
        }
        Relationships: []
      }
      financial_commissions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          professional_id: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          professional_id?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          professional_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_commissions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_commissions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_payables: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string
          id: string
          linked_professional_id: string | null
          paid_at: string | null
          status: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          linked_professional_id?: string | null
          paid_at?: string | null
          status?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          linked_professional_id?: string | null
          paid_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_payables_linked_professional_id_fkey"
            columns: ["linked_professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          ai_generation_script: string | null
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_generation_script?: string | null
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_generation_script?: string | null
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          appointment_id: string | null
          created_at: string
          id: string
          patient_id: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          total: number
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          total?: number
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          capacity: number
          color: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          capacity?: number
          color?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          capacity?: number
          color?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          created_at: string | null
          failed_count: number | null
          id: string
          scheduled_for: string | null
          sent_count: number | null
          status: string
          template_content: string | null
          title: string
          total_messages: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string
          template_content?: string | null
          title: string
          total_messages?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failed_count?: number | null
          id?: string
          scheduled_for?: string | null
          sent_count?: number | null
          status?: string
          template_content?: string | null
          title?: string
          total_messages?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      message_logs: {
        Row: {
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          phone: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          phone?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          phone?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          channel: string | null
          content: string
          created_at: string
          delay_days: number | null
          id: string
          is_active: boolean | null
          title: string | null
          trigger_type: string
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string
          delay_days?: number | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          trigger_type: string
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string
          delay_days?: number | null
          id?: string
          is_active?: boolean | null
          title?: string | null
          trigger_type?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          primary_color: string | null
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          primary_color?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          primary_color?: string | null
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patient_assessments: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          patient_id: string
          professional_id: string | null
          scores: Json | null
          template_id: string | null
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json
          id?: string
          patient_id: string
          professional_id?: string | null
          scores?: Json | null
          template_id?: string | null
          title?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          patient_id?: string
          professional_id?: string | null
          scores?: Json | null
          template_id?: string | null
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_assessments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_assessments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_records: {
        Row: {
          ai_summary: string | null
          appointment_id: string | null
          content: Json
          created_at: string | null
          id: string
          patient_id: string
          professional_id: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          appointment_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          patient_id: string
          professional_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          appointment_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          patient_id?: string
          professional_id?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          address: Json | null
          address_street: string | null
          address_zip: string | null
          birthdate: string | null
          cpf: string | null
          created_at: string
          email: string | null
          gender: string | null
          health_data_consent: boolean | null
          id: string
          invoice_address: string | null
          invoice_address_zip: string | null
          invoice_city: string | null
          invoice_cpf: string | null
          invoice_name: string | null
          invoice_neighborhood: string | null
          invoice_number: string | null
          invoice_state: string | null
          marketing_source: string | null
          name: string
          notes: string | null
          occupation: string | null
          organization_id: string | null
          phone: string | null
          price_table_id: string | null
          related_patient_id: string | null
          relationship_degree: string | null
          status: string
        }
        Insert: {
          address?: Json | null
          address_street?: string | null
          address_zip?: string | null
          birthdate?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          health_data_consent?: boolean | null
          id?: string
          invoice_address?: string | null
          invoice_address_zip?: string | null
          invoice_city?: string | null
          invoice_cpf?: string | null
          invoice_name?: string | null
          invoice_neighborhood?: string | null
          invoice_number?: string | null
          invoice_state?: string | null
          marketing_source?: string | null
          name: string
          notes?: string | null
          occupation?: string | null
          organization_id?: string | null
          phone?: string | null
          price_table_id?: string | null
          related_patient_id?: string | null
          relationship_degree?: string | null
          status?: string
        }
        Update: {
          address?: Json | null
          address_street?: string | null
          address_zip?: string | null
          birthdate?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          gender?: string | null
          health_data_consent?: boolean | null
          id?: string
          invoice_address?: string | null
          invoice_address_zip?: string | null
          invoice_city?: string | null
          invoice_cpf?: string | null
          invoice_name?: string | null
          invoice_neighborhood?: string | null
          invoice_number?: string | null
          invoice_state?: string | null
          marketing_source?: string | null
          name?: string
          notes?: string | null
          occupation?: string | null
          organization_id?: string | null
          phone?: string | null
          price_table_id?: string | null
          related_patient_id?: string | null
          relationship_degree?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_related_patient_id_fkey"
            columns: ["related_patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_fees: {
        Row: {
          fee_percent: number | null
          id: string
          installments: number | null
          method: string
          updated_at: string
        }
        Insert: {
          fee_percent?: number | null
          id?: string
          installments?: number | null
          method: string
          updated_at?: string
        }
        Update: {
          fee_percent?: number | null
          id?: string
          installments?: number | null
          method?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      price_table_items: {
        Row: {
          created_at: string
          id: string
          price: number
          price_table_id: string | null
          service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          price?: number
          price_table_id?: string | null
          service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          price?: number
          price_table_id?: string | null
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_table_items_price_table_id_fkey"
            columns: ["price_table_id"]
            isOneToOne: false
            referencedRelation: "price_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_table_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      price_tables: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          id: string
          is_unlimited: boolean | null
          name: string
          price: number
          stock_quantity: number | null
        }
        Insert: {
          active?: boolean | null
          id?: string
          is_unlimited?: boolean | null
          name: string
          price?: number
          stock_quantity?: number | null
        }
        Update: {
          active?: boolean | null
          id?: string
          is_unlimited?: boolean | null
          name?: string
          price?: number
          stock_quantity?: number | null
        }
        Relationships: []
      }
      professional_availability: {
        Row: {
          day_of_week: number
          end_time: string
          id: string
          is_break: boolean | null
          location_id: string | null
          profile_id: string | null
          start_time: string
        }
        Insert: {
          day_of_week: number
          end_time: string
          id?: string
          is_break?: boolean | null
          location_id?: string | null
          profile_id?: string | null
          start_time: string
        }
        Update: {
          day_of_week?: number
          end_time?: string
          id?: string
          is_break?: boolean | null
          location_id?: string | null
          profile_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_availability_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_commission_rules: {
        Row: {
          id: string
          professional_id: string | null
          service_id: string | null
          type: string | null
          value: number
        }
        Insert: {
          id?: string
          professional_id?: string | null
          service_id?: string | null
          type?: string | null
          value?: number
        }
        Update: {
          id?: string
          professional_id?: string | null
          service_id?: string | null
          type?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_commission_rules_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professional_commission_rules_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          allow_overbooking: boolean | null
          bio: string | null
          birthdate: string | null
          color: string | null
          council_number: string | null
          council_type: string | null
          cpf: string | null
          created_at: string
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          notify_email: boolean | null
          notify_sms: boolean | null
          notify_whatsapp: boolean | null
          organization_id: string | null
          phone: string | null
          photo_url: string | null
          privacy_policy_version: string | null
          role: string | null
          role_id: string | null
          slot_interval: number | null
          specialty: string | null
          terms_accepted_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allow_overbooking?: boolean | null
          bio?: string | null
          birthdate?: string | null
          color?: string | null
          council_number?: string | null
          council_type?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          privacy_policy_version?: string | null
          role?: string | null
          role_id?: string | null
          slot_interval?: number | null
          specialty?: string | null
          terms_accepted_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          allow_overbooking?: boolean | null
          bio?: string | null
          birthdate?: string | null
          color?: string | null
          council_number?: string | null
          council_type?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notify_email?: boolean | null
          notify_sms?: boolean | null
          notify_whatsapp?: boolean | null
          organization_id?: string | null
          phone?: string | null
          photo_url?: string | null
          privacy_policy_version?: string | null
          role?: string | null
          role_id?: string | null
          slot_interval?: number | null
          specialty?: string | null
          terms_accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      reminders: {
        Row: {
          content: string
          created_at: string
          creator_id: string | null
          due_date: string | null
          id: string
          is_read: boolean
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          creator_id?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          creator_id?: string | null
          due_date?: string | null
          id?: string
          is_read?: boolean
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      report_templates: {
        Row: {
          category: string | null
          config: Json | null
          content: string
          created_at: string
          id: string
          profile_id: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          config?: Json | null
          content: string
          created_at?: string
          id?: string
          profile_id?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          config?: Json | null
          content?: string
          created_at?: string
          id?: string
          profile_id?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_templates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_professionals: {
        Row: {
          profile_id: string
          service_id: string
        }
        Insert: {
          profile_id: string
          service_id: string
        }
        Update: {
          profile_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_professionals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_professionals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean | null
          created_at: string
          description: string | null
          duration: number
          id: string
          name: string
          price: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name: string
          price?: number
        }
        Update: {
          active?: boolean | null
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          name?: string
          price?: number
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string | null
          description: string | null
          due_date: string | null
          id: string
          is_recurring: boolean | null
          paid_at: string | null
          patient_id: string | null
          product_id: string | null
          production_cost: number | null
          professional_id: string | null
          quantity: number | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_at?: string | null
          patient_id?: string | null
          product_id?: string | null
          production_cost?: number | null
          professional_id?: string | null
          quantity?: number | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_recurring?: boolean | null
          paid_at?: string | null
          patient_id?: string | null
          product_id?: string | null
          production_cost?: number | null
          professional_id?: string | null
          quantity?: number | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_template_preferences: {
        Row: {
          created_at: string | null
          id: string
          is_allowed: boolean | null
          is_favorite: boolean | null
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          is_favorite?: boolean | null
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_allowed?: boolean | null
          is_favorite?: boolean | null
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_template_preferences_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      waiting_list: {
        Row: {
          created_at: string | null
          date: string
          id: string
          patient_name: string
          patient_phone: string
          preference: string | null
          professional_id: string | null
          service_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          patient_name: string
          patient_phone: string
          preference?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          patient_name?: string
          patient_phone?: string
          preference?: string | null
          professional_id?: string | null
          service_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waiting_list_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          details: string | null
          event_type: string
          id: string
          payload: Json | null
          provider: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          provider: string
          status: string
        }
        Update: {
          created_at?: string
          details?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          provider?: string
          status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_consent_token_rpc: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_consent_details: { Args: { token_input: string }; Returns: Json }
      get_my_org_id: { Args: never; Returns: string }
      get_patient_active_appointment: {
        Args: { target_patient_id: string }
        Returns: Json
      }
      increment_campaign_failed: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      increment_campaign_sent: {
        Args: { campaign_uuid: string }
        Returns: undefined
      }
      is_allowed_clinical: { Args: never; Returns: boolean }
      sign_consent: {
        Args: { ip_input: string; token_input: string; ua_input: string }
        Returns: Json
      }
      toggle_patient_status_rpc: {
        Args: { p_patient_id: string; p_status: string }
        Returns: Json
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
