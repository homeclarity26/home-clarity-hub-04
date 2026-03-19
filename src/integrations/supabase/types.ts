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
      activity_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          property_id: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          property_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          property_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_logs: {
        Row: {
          actions_taken: number | null
          agent_reply: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          id: string
          page_context: Json | null
          role: string
          session_id: string | null
          tokens_used: number | null
          tools_called: Json | null
          user_id: string | null
          user_message: string
        }
        Insert: {
          actions_taken?: number | null
          agent_reply?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          page_context?: Json | null
          role?: string
          session_id?: string | null
          tokens_used?: number | null
          tools_called?: Json | null
          user_id?: string | null
          user_message: string
        }
        Update: {
          actions_taken?: number | null
          agent_reply?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          id?: string
          page_context?: Json | null
          role?: string
          session_id?: string | null
          tokens_used?: number | null
          tools_called?: Json | null
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      ai_client_insights: {
        Row: {
          client_id: string
          generated_at: string
          id: string
          insights_json: Json
        }
        Insert: {
          client_id: string
          generated_at?: string
          id?: string
          insights_json?: Json
        }
        Update: {
          client_id?: string
          generated_at?: string
          id?: string
          insights_json?: Json
        }
        Relationships: []
      }
      ai_cost_estimates: {
        Row: {
          client_id: string
          created_at: string
          estimates_json: Json
          id: string
          inputs_json: Json
          project_type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          estimates_json?: Json
          id?: string
          inputs_json?: Json
          project_type: string
        }
        Update: {
          client_id?: string
          created_at?: string
          estimates_json?: Json
          id?: string
          inputs_json?: Json
          project_type?: string
        }
        Relationships: []
      }
      ai_draft_history: {
        Row: {
          admin_id: string
          client_id: string
          created_at: string
          generated_text: string
          id: string
          input_notes: string
          section_type: string
        }
        Insert: {
          admin_id: string
          client_id: string
          created_at?: string
          generated_text: string
          id?: string
          input_notes: string
          section_type: string
        }
        Update: {
          admin_id?: string
          client_id?: string
          created_at?: string
          generated_text?: string
          id?: string
          input_notes?: string
          section_type?: string
        }
        Relationships: []
      }
      ai_maintenance_schedules: {
        Row: {
          applied_at: string | null
          client_id: string
          generated_at: string
          id: string
          schedule_json: Json
        }
        Insert: {
          applied_at?: string | null
          client_id: string
          generated_at?: string
          id?: string
          schedule_json?: Json
        }
        Update: {
          applied_at?: string | null
          client_id?: string
          generated_at?: string
          id?: string
          schedule_json?: Json
        }
        Relationships: []
      }
      ai_message_suggestions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          suggestions_json: Json
          thread_context_hash: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          suggestions_json?: Json
          thread_context_hash?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          suggestions_json?: Json
          thread_context_hash?: string | null
        }
        Relationships: []
      }
      ai_priority_cards: {
        Row: {
          client_id: string
          generated_at: string
          id: string
          priorities_json: Json
          property_id: string | null
        }
        Insert: {
          client_id: string
          generated_at?: string
          id?: string
          priorities_json?: Json
          property_id?: string | null
        }
        Update: {
          client_id?: string
          generated_at?: string
          id?: string
          priorities_json?: Json
          property_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_priority_cards_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_score_explanations: {
        Row: {
          client_id: string
          created_at: string
          explanation_text: string
          id: string
          score_value: number | null
          section: string
        }
        Insert: {
          client_id: string
          created_at?: string
          explanation_text: string
          id?: string
          score_value?: number | null
          section: string
        }
        Update: {
          client_id?: string
          created_at?: string
          explanation_text?: string
          id?: string
          score_value?: number | null
          section?: string
        }
        Relationships: []
      }
      ai_transcript_summaries: {
        Row: {
          audio_file_url: string | null
          client_id: string
          created_at: string
          id: string
          summary_json: Json
          transcript_text: string | null
        }
        Insert: {
          audio_file_url?: string | null
          client_id: string
          created_at?: string
          id?: string
          summary_json?: Json
          transcript_text?: string | null
        }
        Update: {
          audio_file_url?: string | null
          client_id?: string
          created_at?: string
          id?: string
          summary_json?: Json
          transcript_text?: string | null
        }
        Relationships: []
      }
      ai_vendor_matches: {
        Row: {
          client_id: string
          created_at: string
          id: string
          project_id: string
          vendor_recommendations_json: Json
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          project_id: string
          vendor_recommendations_json?: Json
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          project_id?: string
          vendor_recommendations_json?: Json
        }
        Relationships: []
      }
      announcement_dismissals: {
        Row: {
          announcement_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_dismissals_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_views: {
        Row: {
          announcement_id: string
          client_id: string
          id: string
          viewed_at: string
        }
        Insert: {
          announcement_id: string
          client_id: string
          id?: string
          viewed_at?: string
        }
        Update: {
          announcement_id?: string
          client_id?: string
          id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_views_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string
          display_type: string
          end_date: string | null
          id: string
          start_date: string
          target_audience: string
          target_client_ids: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by: string
          display_type?: string
          end_date?: string | null
          id?: string
          start_date?: string
          target_audience?: string
          target_client_ids?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string
          display_type?: string
          end_date?: string | null
          id?: string
          start_date?: string
          target_audience?: string
          target_client_ids?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      annual_report_cards: {
        Row: {
          advisor_message: string | null
          completed_projects_count: number | null
          condition_changes: Json | null
          created_at: string
          generated_at: string
          health_score_end: number | null
          health_score_start: number | null
          id: string
          property_id: string
          report_year: number
          total_invested: number | null
          total_payments: number | null
          value_end: number | null
          value_start: number | null
        }
        Insert: {
          advisor_message?: string | null
          completed_projects_count?: number | null
          condition_changes?: Json | null
          created_at?: string
          generated_at?: string
          health_score_end?: number | null
          health_score_start?: number | null
          id?: string
          property_id: string
          report_year: number
          total_invested?: number | null
          total_payments?: number | null
          value_end?: number | null
          value_start?: number | null
        }
        Update: {
          advisor_message?: string | null
          completed_projects_count?: number | null
          condition_changes?: Json | null
          created_at?: string
          generated_at?: string
          health_score_end?: number | null
          health_score_start?: number | null
          id?: string
          property_id?: string
          report_year?: number
          total_invested?: number | null
          total_payments?: number | null
          value_end?: number | null
          value_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "annual_report_cards_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_reviews: {
        Row: {
          admin_notes: Json | null
          briefing_json: Json
          client_id: string
          completed_at: string | null
          created_at: string
          generated_at: string | null
          id: string
          outcome_notes: string | null
          property_id: string | null
          review_call_date: string | null
          review_year: number
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: Json | null
          briefing_json?: Json
          client_id: string
          completed_at?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          outcome_notes?: string | null
          property_id?: string | null
          review_call_date?: string | null
          review_year: number
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: Json | null
          briefing_json?: Json
          client_id?: string
          completed_at?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          outcome_notes?: string | null
          property_id?: string | null
          review_call_date?: string | null
          review_year?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "annual_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_active: boolean
          key_hash: string
          label: string
          last_used_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash: string
          label?: string
          last_used_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key_hash?: string
          label?: string
          last_used_at?: string | null
        }
        Relationships: []
      }
      appointment_requests: {
        Row: {
          client_id: string
          confirmed_slot: string | null
          created_at: string
          id: string
          notes: string | null
          preferred_slots_json: Json
          property_id: string | null
          status: string
          topic: string
        }
        Insert: {
          client_id: string
          confirmed_slot?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_slots_json?: Json
          property_id?: string | null
          status?: string
          topic: string
        }
        Update: {
          client_id?: string
          confirmed_slot?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          preferred_slots_json?: Json
          property_id?: string | null
          status?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action_type: string
          actor_id: string | null
          actor_name: string | null
          actor_type: string
          created_at: string
          entity_id: string | null
          entity_label: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value_json: Json | null
          old_value_json: Json | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_type?: string
          created_at?: string
          entity_id?: string | null
          entity_label?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value_json?: Json | null
          old_value_json?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          action_taken_description: string
          client_id: string | null
          id: string
          rule_id: string
          triggered_at: string
        }
        Insert: {
          action_taken_description: string
          client_id?: string | null
          id?: string
          rule_id: string
          triggered_at?: string
        }
        Update: {
          action_taken_description?: string
          client_id?: string | null
          id?: string
          rule_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          admin_id: string
          config_json: Json
          created_at: string
          id: string
          is_enabled: boolean
          last_triggered_at: string | null
          rule_description: string | null
          rule_name: string
          rule_type: string
          trigger_count: number
        }
        Insert: {
          admin_id: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          rule_description?: string | null
          rule_name: string
          rule_type: string
          trigger_count?: number
        }
        Update: {
          admin_id?: string
          config_json?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_triggered_at?: string | null
          rule_description?: string | null
          rule_name?: string
          rule_type?: string
          trigger_count?: number
        }
        Relationships: []
      }
      central_vendors: {
        Row: {
          admin_id: string
          company_name: string
          contact_name: string | null
          cost_tier: string | null
          created_at: string
          email: string | null
          id: string
          insurance_expiry: string | null
          lead_time: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          rating: number | null
          service_area: string | null
          specialties: string[] | null
          status: string
          tier: string | null
          user_id: string | null
          vetting_checklist: Json | null
          website: string | null
        }
        Insert: {
          admin_id: string
          company_name: string
          contact_name?: string | null
          cost_tier?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          lead_time?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          service_area?: string | null
          specialties?: string[] | null
          status?: string
          tier?: string | null
          user_id?: string | null
          vetting_checklist?: Json | null
          website?: string | null
        }
        Update: {
          admin_id?: string
          company_name?: string
          contact_name?: string | null
          cost_tier?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurance_expiry?: string | null
          lead_time?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          service_area?: string | null
          specialties?: string[] | null
          status?: string
          tier?: string | null
          user_id?: string | null
          vetting_checklist?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      change_orders: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          status: string
          title: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          status?: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "change_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      client_files: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_size: string | null
          file_type: string | null
          id: string
          property_id: string
          storage_path: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          property_id: string
          storage_path: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          id?: string
          property_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_files_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      client_memberships: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          client_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_subscription_id: string | null
          tier_id: string
          trial_ends_at: string | null
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          client_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id: string
          trial_ends_at?: string | null
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          client_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          tier_id?: string
          trial_ends_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_memberships_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notification_preferences: {
        Row: {
          announcements: boolean
          client_id: string
          created_at: string
          frequency: string
          id: string
          invoice_sent: boolean
          maintenance_reminders: boolean
          new_message: boolean
          payment_received: boolean
          project_status: boolean
          report_updated: boolean
          updated_at: string
        }
        Insert: {
          announcements?: boolean
          client_id: string
          created_at?: string
          frequency?: string
          id?: string
          invoice_sent?: boolean
          maintenance_reminders?: boolean
          new_message?: boolean
          payment_received?: boolean
          project_status?: boolean
          report_updated?: boolean
          updated_at?: string
        }
        Update: {
          announcements?: boolean
          client_id?: string
          created_at?: string
          frequency?: string
          id?: string
          invoice_sent?: boolean
          maintenance_reminders?: boolean
          new_message?: boolean
          payment_received?: boolean
          project_status?: boolean
          report_updated?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      client_satisfaction_scores: {
        Row: {
          client_id: string
          comment: string | null
          id: string
          report_id: string | null
          score: number
          submitted_at: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          id?: string
          report_id?: string | null
          score: number
          submitted_at?: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          id?: string
          report_id?: string | null
          score?: number
          submitted_at?: string
        }
        Relationships: []
      }
      client_sessions: {
        Row: {
          client_id: string
          id: string
          last_active_at: string
          login_at: string
          pages_visited: Json | null
          session_duration_minutes: number | null
        }
        Insert: {
          client_id: string
          id?: string
          last_active_at?: string
          login_at?: string
          pages_visited?: Json | null
          session_duration_minutes?: number | null
        }
        Update: {
          client_id?: string
          id?: string
          last_active_at?: string
          login_at?: string
          pages_visited?: Json | null
          session_duration_minutes?: number | null
        }
        Relationships: []
      }
      client_timeline_events: {
        Row: {
          actor: string
          client_id: string
          created_at: string
          event_description: string
          event_type: string
          id: string
          is_admin_note: boolean
          metadata_json: Json | null
          note_text: string | null
        }
        Insert: {
          actor?: string
          client_id: string
          created_at?: string
          event_description: string
          event_type: string
          id?: string
          is_admin_note?: boolean
          metadata_json?: Json | null
          note_text?: string | null
        }
        Update: {
          actor?: string
          client_id?: string
          created_at?: string
          event_description?: string
          event_type?: string
          id?: string
          is_admin_note?: boolean
          metadata_json?: Json | null
          note_text?: string | null
        }
        Relationships: []
      }
      contractor_bids: {
        Row: {
          bid_amount: number
          bid_date: string | null
          contact_name: string | null
          contractor_name: string
          created_at: string
          email: string | null
          estimated_timeline: string | null
          id: string
          notes: string | null
          phone: string | null
          project_id: string
          scope_of_work: string | null
          status: string
          warranty_offered: string | null
        }
        Insert: {
          bid_amount?: number
          bid_date?: string | null
          contact_name?: string | null
          contractor_name: string
          created_at?: string
          email?: string | null
          estimated_timeline?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          project_id: string
          scope_of_work?: string | null
          status?: string
          warranty_offered?: string | null
        }
        Update: {
          bid_amount?: number
          bid_date?: string | null
          contact_name?: string | null
          contractor_name?: string
          created_at?: string
          email?: string | null
          estimated_timeline?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          project_id?: string
          scope_of_work?: string | null
          status?: string
          warranty_offered?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_bids_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activity_log: {
        Row: {
          activity_type: string
          channel: string | null
          contact_id: string
          content_preview: string | null
          id: string
          logged_at: string
          logged_by: string | null
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          channel?: string | null
          contact_id: string
          content_preview?: string | null
          id?: string
          logged_at?: string
          logged_by?: string | null
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          channel?: string | null
          contact_id?: string
          content_preview?: string | null
          id?: string
          logged_at?: string
          logged_by?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          client_stage: Database["public"]["Enums"]["crm_client_stage"] | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"]
          created_at: string
          created_by: string | null
          id: string
          last_contact_date: string | null
          lifetime_value: number | null
          notes: string | null
          partner_stage: Database["public"]["Enums"]["crm_partner_stage"] | null
          property_id: string | null
          referral_source: string | null
          since_date: string | null
          tags: string[] | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          client_stage?: Database["public"]["Enums"]["crm_client_stage"] | null
          contact_type: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          last_contact_date?: string | null
          lifetime_value?: number | null
          notes?: string | null
          partner_stage?:
            | Database["public"]["Enums"]["crm_partner_stage"]
            | null
          property_id?: string | null
          referral_source?: string | null
          since_date?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          client_stage?: Database["public"]["Enums"]["crm_client_stage"] | null
          contact_type?: Database["public"]["Enums"]["crm_contact_type"]
          created_at?: string
          created_by?: string | null
          id?: string
          last_contact_date?: string | null
          lifetime_value?: number | null
          notes?: string | null
          partner_stage?:
            | Database["public"]["Enums"]["crm_partner_stage"]
            | null
          property_id?: string | null
          referral_source?: string | null
          since_date?: string | null
          tags?: string[] | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "central_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts_people: {
        Row: {
          birthday: string | null
          contact_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          preferred_method: string | null
          relationship: string | null
        }
        Insert: {
          birthday?: string | null
          contact_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          preferred_method?: string | null
          relationship?: string | null
        }
        Update: {
          birthday?: string | null
          contact_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          preferred_method?: string | null
          relationship?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_people_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_pipeline_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          contact_id: string
          from_stage: string | null
          id: string
          notes: string | null
          to_stage: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          contact_id: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          contact_id?: string
          from_stage?: string | null
          id?: string
          notes?: string | null
          to_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_pipeline_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_saved_filters: {
        Row: {
          contact_type: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at: string
          created_by: string | null
          filter_json: Json
          id: string
          name: string
        }
        Insert: {
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by?: string | null
          filter_json?: Json
          id?: string
          name: string
        }
        Update: {
          contact_type?: Database["public"]["Enums"]["crm_contact_type"] | null
          created_at?: string
          created_by?: string | null
          filter_json?: Json
          id?: string
          name?: string
        }
        Relationships: []
      }
      dashboard_widget_configs: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_visible: boolean
          size: string
          sort_order: number
          widget_key: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_visible?: boolean
          size?: string
          sort_order?: number
          widget_key: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          size?: string
          sort_order?: number
          widget_key?: string
        }
        Relationships: []
      }
      document_extractions: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          document_id: string | null
          document_type: string | null
          equipment_ids_created: Json | null
          extraction_status: string
          findings_created: Json | null
          id: string
          processed_at: string | null
          raw_extracted_text: string | null
          structured_data: Json | null
        }
        Insert: {
          client_id: string
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          equipment_ids_created?: Json | null
          extraction_status?: string
          findings_created?: Json | null
          id?: string
          processed_at?: string | null
          raw_extracted_text?: string | null
          structured_data?: Json | null
        }
        Update: {
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          document_id?: string | null
          document_type?: string | null
          equipment_ids_created?: Json | null
          extraction_status?: string
          findings_created?: Json | null
          id?: string
          processed_at?: string | null
          raw_extracted_text?: string | null
          structured_data?: Json | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          brand: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          estimated_replacement_cost: number | null
          id: string
          install_date: string | null
          last_service_date: string | null
          model: string | null
          name: string
          next_service_date: string | null
          notes: string | null
          property_id: string
          report_page_id: string | null
          serial_number: string | null
          sort_order: number | null
          updated_at: string | null
          warranty_expiry: string | null
        }
        Insert: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          estimated_replacement_cost?: number | null
          id?: string
          install_date?: string | null
          last_service_date?: string | null
          model?: string | null
          name: string
          next_service_date?: string | null
          notes?: string | null
          property_id: string
          report_page_id?: string | null
          serial_number?: string | null
          sort_order?: number | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          estimated_replacement_cost?: number | null
          id?: string
          install_date?: string | null
          last_service_date?: string | null
          model?: string | null
          name?: string
          next_service_date?: string | null
          notes?: string | null
          property_id?: string
          report_page_id?: string | null
          serial_number?: string | null
          sort_order?: number | null
          updated_at?: string | null
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_line_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          quantity: number
          service_id: string | null
          sort_order: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string
          estimate_id: string
          id?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_line_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimate_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          admin_id: string
          converted_invoice_id: string | null
          created_at: string
          discount_amount: number
          discount_type: string
          id: string
          notes: string | null
          property_id: string | null
          proposal_accent_color: string | null
          proposal_client_selections: Json | null
          proposal_color_theme: string | null
          proposal_cover_image_url: string | null
          proposal_cover_video_url: string | null
          proposal_cta_headline: string | null
          proposal_cta_subtext: string | null
          proposal_first_viewed_at: string | null
          proposal_intro_text: string | null
          proposal_last_viewed_at: string | null
          proposal_optional_line_items: Json | null
          proposal_prepared_for: string | null
          proposal_scope_description: string | null
          proposal_sections_viewed: Json | null
          proposal_show_pricing_toggle: boolean | null
          proposal_stat_callouts: Json | null
          proposal_status: string | null
          proposal_tagline: string | null
          proposal_testimonial_author: string | null
          proposal_testimonial_quote: string | null
          proposal_testimonial_role: string | null
          proposal_time_spent_seconds: number | null
          proposal_timeline_phases: Json | null
          proposal_timeline_text: string | null
          proposal_token: string | null
          proposal_view_count: number | null
          proposal_viewed_by_name: string | null
          proposal_why_us_text: string | null
          responded_at: string | null
          sent_at: string | null
          status: string
          subtotal: number
          tax: number
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          admin_id: string
          converted_invoice_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          proposal_accent_color?: string | null
          proposal_client_selections?: Json | null
          proposal_color_theme?: string | null
          proposal_cover_image_url?: string | null
          proposal_cover_video_url?: string | null
          proposal_cta_headline?: string | null
          proposal_cta_subtext?: string | null
          proposal_first_viewed_at?: string | null
          proposal_intro_text?: string | null
          proposal_last_viewed_at?: string | null
          proposal_optional_line_items?: Json | null
          proposal_prepared_for?: string | null
          proposal_scope_description?: string | null
          proposal_sections_viewed?: Json | null
          proposal_show_pricing_toggle?: boolean | null
          proposal_stat_callouts?: Json | null
          proposal_status?: string | null
          proposal_tagline?: string | null
          proposal_testimonial_author?: string | null
          proposal_testimonial_quote?: string | null
          proposal_testimonial_role?: string | null
          proposal_time_spent_seconds?: number | null
          proposal_timeline_phases?: Json | null
          proposal_timeline_text?: string | null
          proposal_token?: string | null
          proposal_view_count?: number | null
          proposal_viewed_by_name?: string | null
          proposal_why_us_text?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          admin_id?: string
          converted_invoice_id?: string | null
          created_at?: string
          discount_amount?: number
          discount_type?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          proposal_accent_color?: string | null
          proposal_client_selections?: Json | null
          proposal_color_theme?: string | null
          proposal_cover_image_url?: string | null
          proposal_cover_video_url?: string | null
          proposal_cta_headline?: string | null
          proposal_cta_subtext?: string | null
          proposal_first_viewed_at?: string | null
          proposal_intro_text?: string | null
          proposal_last_viewed_at?: string | null
          proposal_optional_line_items?: Json | null
          proposal_prepared_for?: string | null
          proposal_scope_description?: string | null
          proposal_sections_viewed?: Json | null
          proposal_show_pricing_toggle?: boolean | null
          proposal_stat_callouts?: Json | null
          proposal_status?: string | null
          proposal_tagline?: string | null
          proposal_testimonial_author?: string | null
          proposal_testimonial_quote?: string | null
          proposal_testimonial_role?: string | null
          proposal_time_spent_seconds?: number | null
          proposal_timeline_phases?: Json | null
          proposal_timeline_text?: string | null
          proposal_token?: string | null
          proposal_view_count?: number | null
          proposal_viewed_by_name?: string | null
          proposal_why_us_text?: string | null
          responded_at?: string | null
          sent_at?: string | null
          status?: string
          subtotal?: number
          tax?: number
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          property_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          property_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          property_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      field_inspections: {
        Row: {
          admin_id: string
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          distance_meters: number | null
          gps_lat: number | null
          gps_lng: number | null
          gps_verified: boolean | null
          id: string
          notes: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          distance_meters?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_verified?: boolean | null
          id?: string
          notes?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          distance_meters?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_verified?: boolean | null
          id?: string
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_inspections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          category: string
          created_at: string
          definition: string
          id: string
          related_terms: string[] | null
          term: string
        }
        Insert: {
          category?: string
          created_at?: string
          definition: string
          id?: string
          related_terms?: string[] | null
          term: string
        }
        Update: {
          category?: string
          created_at?: string
          definition?: string
          id?: string
          related_terms?: string[] | null
          term?: string
        }
        Relationships: []
      }
      health_score_history: {
        Row: {
          client_id: string
          exterior_score: number | null
          id: string
          interior_score: number | null
          overall_score: number | null
          recorded_at: string
          report_id: string | null
          systems_score: number | null
        }
        Insert: {
          client_id: string
          exterior_score?: number | null
          id?: string
          interior_score?: number | null
          overall_score?: number | null
          recorded_at?: string
          report_id?: string | null
          systems_score?: number | null
        }
        Update: {
          client_id?: string
          exterior_score?: number | null
          id?: string
          interior_score?: number | null
          overall_score?: number | null
          recorded_at?: string
          report_id?: string | null
          systems_score?: number | null
        }
        Relationships: []
      }
      home_goals: {
        Row: {
          client_id: string
          created_at: string
          description: string | null
          estimated_budget: number | null
          id: string
          status: string
          target_year: number | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          description?: string | null
          estimated_budget?: number | null
          id?: string
          status?: string
          target_year?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          description?: string | null
          estimated_budget?: number | null
          id?: string
          status?: string
          target_year?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_knowledge_base: {
        Row: {
          client_id: string
          confidence: string
          content: string
          created_at: string
          date_of_fact: string | null
          date_recorded: string
          id: string
          is_current: boolean
          knowledge_type: string
          source_document_id: string | null
          source_type: string
          subject: string
          superseded_by_id: string | null
          tags: Json | null
        }
        Insert: {
          client_id: string
          confidence?: string
          content: string
          created_at?: string
          date_of_fact?: string | null
          date_recorded?: string
          id?: string
          is_current?: boolean
          knowledge_type?: string
          source_document_id?: string | null
          source_type?: string
          subject: string
          superseded_by_id?: string | null
          tags?: Json | null
        }
        Update: {
          client_id?: string
          confidence?: string
          content?: string
          created_at?: string
          date_of_fact?: string | null
          date_recorded?: string
          id?: string
          is_current?: boolean
          knowledge_type?: string
          source_document_id?: string | null
          source_type?: string
          subject?: string
          superseded_by_id?: string | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "home_knowledge_base_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "home_knowledge_base"
            referencedColumns: ["id"]
          },
        ]
      }
      home_value_history: {
        Row: {
          created_at: string
          estimated_value: number
          id: string
          notes: string | null
          property_id: string
          recorded_at: string
        }
        Insert: {
          created_at?: string
          estimated_value: number
          id?: string
          notes?: string | null
          property_id: string
          recorded_at?: string
        }
        Update: {
          created_at?: string
          estimated_value?: number
          id?: string
          notes?: string | null
          property_id?: string
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_value_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_checklists: {
        Row: {
          completed_count: number
          created_at: string
          id: string
          items: Json
          report_page_id: string
          total_count: number
          updated_at: string
        }
        Insert: {
          completed_count?: number
          created_at?: string
          id?: string
          items?: Json
          report_page_id: string
          total_count?: number
          updated_at?: string
        }
        Update: {
          completed_count?: number
          created_at?: string
          id?: string
          items?: Json
          report_page_id?: string
          total_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_checklists_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          caption: string | null
          category: string | null
          created_at: string
          gps_lat: number | null
          gps_lng: number | null
          id: string
          inspection_id: string
          photo_url: string
          report_page_id: string | null
        }
        Insert: {
          caption?: string | null
          category?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          inspection_id: string
          photo_url: string
          report_page_id?: string | null
        }
        Update: {
          caption?: string | null
          category?: string | null
          created_at?: string
          gps_lat?: number | null
          gps_lng?: number | null
          id?: string
          inspection_id?: string
          photo_url?: string
          report_page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "field_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_photos_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_voice_notes: {
        Row: {
          ai_narrative: string | null
          audio_url: string | null
          condition_suggestion: string | null
          created_at: string
          id: string
          inspection_id: string
          key_observations: Json | null
          report_page_id: string | null
          transcription: string | null
        }
        Insert: {
          ai_narrative?: string | null
          audio_url?: string | null
          condition_suggestion?: string | null
          created_at?: string
          id?: string
          inspection_id: string
          key_observations?: Json | null
          report_page_id?: string | null
          transcription?: string | null
        }
        Update: {
          ai_narrative?: string | null
          audio_url?: string | null
          condition_suggestion?: string | null
          created_at?: string
          id?: string
          inspection_id?: string
          key_observations?: Json | null
          report_page_id?: string | null
          transcription?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_voice_notes_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "field_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_voice_notes_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_report_comments: {
        Row: {
          author_id: string
          comment_text: string
          created_at: string
          id: string
          is_resolved: boolean
          report_page_id: string
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_text: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          report_page_id: string
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_text?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          report_page_id?: string
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_report_comments_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_type: string
          quantity: number
          service_id: string | null
          sort_order: number
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          invoice_id: string
          item_type?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          item_type?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          ai_summary: string | null
          amount: number
          balance_due: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          invoice_cover_image_url: string | null
          invoice_footer_text: string | null
          invoice_memo: string | null
          invoice_number: string | null
          invoice_theme: string | null
          invoice_token: string | null
          invoice_view_count: number | null
          issue_date: string | null
          notes: string | null
          paid_date: string | null
          property_id: string
          proposal_id: string | null
          status: string
          stripe_payment_link_url: string | null
          subtotal: number
          tax: number
          title: string | null
          total: number
          type: string
          updated_at: string | null
        }
        Insert: {
          ai_summary?: string | null
          amount: number
          balance_due?: number
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          invoice_cover_image_url?: string | null
          invoice_footer_text?: string | null
          invoice_memo?: string | null
          invoice_number?: string | null
          invoice_theme?: string | null
          invoice_token?: string | null
          invoice_view_count?: number | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          property_id: string
          proposal_id?: string | null
          status?: string
          stripe_payment_link_url?: string | null
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          type?: string
          updated_at?: string | null
        }
        Update: {
          ai_summary?: string | null
          amount?: number
          balance_due?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          invoice_cover_image_url?: string | null
          invoice_footer_text?: string | null
          invoice_memo?: string | null
          invoice_number?: string | null
          invoice_theme?: string | null
          invoice_token?: string | null
          invoice_view_count?: number | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          property_id?: string
          proposal_id?: string | null
          status?: string
          stripe_payment_link_url?: string | null
          subtotal?: number
          tax?: number
          title?: string | null
          total?: number
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_templates: {
        Row: {
          category: string
          content: Json
          created_at: string
          id: string
          region: string | null
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          content?: Json
          created_at?: string
          id?: string
          region?: string | null
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          id?: string
          region?: string | null
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      maintenance_outcomes: {
        Row: {
          actual_cost: number | null
          actual_service_date: string
          client_id: string
          created_at: string
          equipment_id: string | null
          id: string
          outcome_notes: string | null
          prediction_id: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_service_date: string
          client_id: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          outcome_notes?: string | null
          prediction_id?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_service_date?: string
          client_id?: string
          created_at?: string
          equipment_id?: string | null
          id?: string
          outcome_notes?: string | null
          prediction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_outcomes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_outcomes_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "maintenance_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_predictions: {
        Row: {
          client_id: string
          confidence_level: string
          equipment_id: string | null
          estimated_cost_high: number | null
          estimated_cost_low: number | null
          generated_at: string
          id: string
          last_updated_at: string
          predicted_timeframe: string
          prediction_type: string
          probability_score: number
          reasoning: Json | null
          status: string
          system_type: string
        }
        Insert: {
          client_id: string
          confidence_level?: string
          equipment_id?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          generated_at?: string
          id?: string
          last_updated_at?: string
          predicted_timeframe?: string
          prediction_type?: string
          probability_score?: number
          reasoning?: Json | null
          status?: string
          system_type: string
        }
        Update: {
          client_id?: string
          confidence_level?: string
          equipment_id?: string | null
          estimated_cost_high?: number | null
          estimated_cost_low?: number | null
          generated_at?: string
          id?: string
          last_updated_at?: string
          predicted_timeframe?: string
          prediction_type?: string
          probability_score?: number
          reasoning?: Json | null
          status?: string
          system_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_predictions_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_reminders: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          equipment_id: string | null
          id: string
          is_dismissed: boolean
          last_sent_at: string | null
          property_id: string
          recommended_month: number
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_dismissed?: boolean
          last_sent_at?: string | null
          property_id: string
          recommended_month: number
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          equipment_id?: string | null
          id?: string
          is_dismissed?: boolean
          last_sent_at?: string | null
          property_id?: string
          recommended_month?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reminders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tier_services: {
        Row: {
          created_at: string
          id: string
          service_id: string
          tier_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_id: string
          tier_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_id?: string
          tier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_tier_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_tier_services_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "membership_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_tiers: {
        Row: {
          color_hex: string
          created_at: string
          description: string | null
          features_json: Json
          id: string
          is_active: boolean
          is_featured: boolean
          max_properties: number
          name: string
          price_annually: number
          price_monthly: number
          price_type: string
          report_frequency: string
          response_time_sla_hours: number
          sort_order: number
          stripe_price_annual: string | null
          stripe_price_id_annually: string | null
          stripe_price_id_monthly: string | null
          stripe_price_monthly: string | null
        }
        Insert: {
          color_hex?: string
          created_at?: string
          description?: string | null
          features_json?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_properties?: number
          name: string
          price_annually?: number
          price_monthly?: number
          price_type?: string
          report_frequency?: string
          response_time_sla_hours?: number
          sort_order?: number
          stripe_price_annual?: string | null
          stripe_price_id_annually?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_monthly?: string | null
        }
        Update: {
          color_hex?: string
          created_at?: string
          description?: string | null
          features_json?: Json
          id?: string
          is_active?: boolean
          is_featured?: boolean
          max_properties?: number
          name?: string
          price_annually?: number
          price_monthly?: number
          price_type?: string
          report_frequency?: string
          response_time_sla_hours?: number
          sort_order?: number
          stripe_price_annual?: string | null
          stripe_price_id_annually?: string | null
          stripe_price_id_monthly?: string | null
          stripe_price_monthly?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          admin_id: string
          body_text: string
          category: string
          created_at: string
          id: string
          merge_tags_used_json: Json
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          admin_id: string
          body_text: string
          category?: string
          created_at?: string
          id?: string
          merge_tags_used_json?: Json
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          admin_id?: string
          body_text?: string
          category?: string
          created_at?: string
          id?: string
          merge_tags_used_json?: Json
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      milestones: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          project_id: string
          sort_order: number
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_snippets: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
      onboarding_enrollments: {
        Row: {
          client_id: string
          completed_at: string | null
          current_step: number
          enrolled_at: string
          id: string
          is_paused: boolean
          workflow_id: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          is_paused?: boolean
          workflow_id: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          current_step?: number
          enrolled_at?: string
          id?: string
          is_paused?: boolean
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_enrollments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_steps: {
        Row: {
          action_config_json: Json
          action_type: string
          created_at: string
          delay_days: number
          delay_hours: number
          id: string
          step_order: number
          workflow_id: string
        }
        Insert: {
          action_config_json?: Json
          action_type?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          step_order?: number
          workflow_id: string
        }
        Update: {
          action_config_json?: Json
          action_type?: string
          created_at?: string
          delay_days?: number
          delay_hours?: number
          id?: string
          step_order?: number
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "onboarding_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_workflows: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
        }
        Relationships: []
      }
      page_assignments: {
        Row: {
          assigned_to: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          report_page_id: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          report_page_id: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          report_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_assignments_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          block_config: Json
          created_at: string
          default_content: Json
          default_order: number
          group_name: string
          icon: string | null
          id: string
          is_custom: boolean
          name: string
          slug: string
          sub_group: string | null
          updated_at: string
          version: number
        }
        Insert: {
          block_config?: Json
          created_at?: string
          default_content?: Json
          default_order?: number
          group_name: string
          icon?: string | null
          id?: string
          is_custom?: boolean
          name: string
          slug: string
          sub_group?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          block_config?: Json
          created_at?: string
          default_content?: Json
          default_order?: number
          group_name?: string
          icon?: string | null
          id?: string
          is_custom?: boolean
          name?: string
          slug?: string
          sub_group?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      page_views: {
        Row: {
          client_id: string
          id: string
          page_name: string
          viewed_at: string
        }
        Insert: {
          client_id: string
          id?: string
          page_name: string
          viewed_at?: string
        }
        Update: {
          client_id?: string
          id?: string
          page_name?: string
          viewed_at?: string
        }
        Relationships: []
      }
      payments_posted: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          method: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          method?: string
          notes?: string | null
          payment_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          method?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_posted_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_registry: {
        Row: {
          client_id: string
          contractor_name: string | null
          created_at: string
          description: string | null
          document_id: string | null
          estimated_cost: number | null
          expiration_date: string | null
          final_cost: number | null
          id: string
          inspection_dates: Json | null
          issue_date: string | null
          issued_by: string | null
          notes: string | null
          permit_number: string | null
          permit_type: string | null
          status: string
        }
        Insert: {
          client_id: string
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          estimated_cost?: number | null
          expiration_date?: string | null
          final_cost?: number | null
          id?: string
          inspection_dates?: Json | null
          issue_date?: string | null
          issued_by?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          estimated_cost?: number | null
          expiration_date?: string | null
          final_cost?: number | null
          id?: string
          inspection_dates?: Json | null
          issue_date?: string | null
          issued_by?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type?: string | null
          status?: string
        }
        Relationships: []
      }
      photo_analyses: {
        Row: {
          analyzed_at: string | null
          condition_rating: string | null
          confidence_score: number | null
          created_at: string | null
          estimated_age_years: number | null
          id: string
          identified_defects: Json | null
          narrative_paragraph: string | null
          photo_url: string
          property_id: string | null
          raw_observations: Json | null
          recommended_actions: Json | null
          report_id: string | null
          report_page_id: string | null
          section_type: string | null
        }
        Insert: {
          analyzed_at?: string | null
          condition_rating?: string | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_age_years?: number | null
          id?: string
          identified_defects?: Json | null
          narrative_paragraph?: string | null
          photo_url: string
          property_id?: string | null
          raw_observations?: Json | null
          recommended_actions?: Json | null
          report_id?: string | null
          report_page_id?: string | null
          section_type?: string | null
        }
        Update: {
          analyzed_at?: string | null
          condition_rating?: string | null
          confidence_score?: number | null
          created_at?: string | null
          estimated_age_years?: number | null
          id?: string
          identified_defects?: Json | null
          narrative_paragraph?: string | null
          photo_url?: string
          property_id?: string | null
          raw_observations?: Json | null
          recommended_actions?: Json | null
          report_id?: string | null
          report_page_id?: string | null
          section_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_analyses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analyses_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_analyses_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_submissions: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_concern: boolean
          notes: string | null
          property_id: string
          review_status: string
          reviewed_at: string | null
          storage_path: string
          tag: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_concern?: boolean
          notes?: string | null
          property_id: string
          review_status?: string
          reviewed_at?: string | null
          storage_path: string
          tag?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_concern?: boolean
          notes?: string | null
          property_id?: string
          review_status?: string
          reviewed_at?: string | null
          storage_path?: string
          tag?: string
        }
        Relationships: []
      }
      portal_customizations: {
        Row: {
          advisor_signature: string | null
          created_at: string
          hero_photo_url: string | null
          id: string
          property_id: string
          tagline: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          advisor_signature?: string | null
          created_at?: string
          hero_photo_url?: string | null
          id?: string
          property_id: string
          tagline?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          advisor_signature?: string | null
          created_at?: string
          hero_photo_url?: string | null
          id?: string
          property_id?: string
          tagline?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_customizations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: true
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      prediction_factors: {
        Row: {
          description: string | null
          factor_name: string
          factor_value: string
          id: string
          prediction_id: string
          weight: number
        }
        Insert: {
          description?: string | null
          factor_name: string
          factor_value: string
          id?: string
          prediction_id: string
          weight?: number
        }
        Update: {
          description?: string | null
          factor_name?: string
          factor_value?: string
          id?: string
          prediction_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "prediction_factors_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "maintenance_predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_initials: string | null
          created_at: string
          email: string | null
          full_name: string | null
          has_completed_onboarding: boolean | null
          id: string
          membership_end_date: string | null
          membership_start_date: string | null
          notification_preferences: Json | null
          phone: string | null
          service_region: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          membership_end_date?: string | null
          membership_start_date?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          service_region?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          has_completed_onboarding?: boolean | null
          id?: string
          membership_end_date?: string | null
          membership_start_date?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          service_region?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_activity_log: {
        Row: {
          action_type: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          project_id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          project_id: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          project_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_log_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_change_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          cost_impact: number
          created_at: string
          description: string | null
          id: string
          invoice_id: string | null
          project_id: string
          reason: string | null
          status: string
          supporting_docs: string[] | null
          supporting_photos: string[] | null
          timeline_impact_days: number | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          cost_impact?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          project_id: string
          reason?: string | null
          status?: string
          supporting_docs?: string[] | null
          supporting_photos?: string[] | null
          timeline_impact_days?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          cost_impact?: number
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          project_id?: string
          reason?: string | null
          status?: string
          supporting_docs?: string[] | null
          supporting_photos?: string[] | null
          timeline_impact_days?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_change_orders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_change_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_daily_logs: {
        Row: {
          created_at: string
          id: string
          issues_encountered: string | null
          log_date: string
          materials_delivered: string | null
          next_day_plan: string | null
          photos: string[] | null
          project_id: string
          share_with_client: boolean | null
          submitted_by: string | null
          weather_conditions: string | null
          work_completed: string | null
          workers_on_site: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          issues_encountered?: string | null
          log_date?: string
          materials_delivered?: string | null
          next_day_plan?: string | null
          photos?: string[] | null
          project_id: string
          share_with_client?: boolean | null
          submitted_by?: string | null
          weather_conditions?: string | null
          work_completed?: string | null
          workers_on_site?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          issues_encountered?: string | null
          log_date?: string
          materials_delivered?: string | null
          next_day_plan?: string | null
          photos?: string[] | null
          project_id?: string
          share_with_client?: boolean | null
          submitted_by?: string | null
          weather_conditions?: string | null
          work_completed?: string | null
          workers_on_site?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "project_daily_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_decisions: {
        Row: {
          attachments: string[] | null
          created_at: string
          decided_at: string
          decided_by: string | null
          decision: string
          id: string
          is_client_approved: boolean | null
          locked_at: string | null
          project_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision: string
          id?: string
          is_client_approved?: boolean | null
          locked_at?: string | null
          project_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          decided_at?: string
          decided_by?: string | null
          decision?: string
          id?: string
          is_client_approved?: boolean | null
          locked_at?: string | null
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_size: string | null
          file_type: string | null
          file_url: string
          id: string
          phase_id: string | null
          photo_tag: string | null
          project_id: string
          share_with_client: boolean | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_size?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          phase_id?: string | null
          photo_tag?: string | null
          project_id: string
          share_with_client?: boolean | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_size?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          phase_id?: string | null
          photo_tag?: string | null
          project_id?: string
          share_with_client?: boolean | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_inspections: {
        Row: {
          created_at: string
          id: string
          inspection_type: string
          inspector_name: string | null
          next_steps: string | null
          notes: string | null
          permit_id: string | null
          project_id: string
          result: string | null
          scheduled_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_type: string
          inspector_name?: string | null
          next_steps?: string | null
          notes?: string | null
          permit_id?: string | null
          project_id: string
          result?: string | null
          scheduled_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_type?: string
          inspector_name?: string | null
          next_steps?: string | null
          notes?: string | null
          permit_id?: string | null
          project_id?: string
          result?: string | null
          scheduled_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_inspections_permit_id_fkey"
            columns: ["permit_id"]
            isOneToOne: false
            referencedRelation: "project_permits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_inspections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_messages: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_read: boolean | null
          is_urgent: boolean | null
          message: string
          participant_type: string
          project_id: string
          sender_id: string
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message: string
          participant_type?: string
          project_id: string
          sender_id: string
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          is_urgent?: boolean | null
          message?: string
          participant_type?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_permits: {
        Row: {
          approved_date: string | null
          created_at: string
          document_url: string | null
          expiration_date: string | null
          id: string
          permit_number: string | null
          permit_type: string
          project_id: string
          status: string
          submitted_date: string | null
        }
        Insert: {
          approved_date?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          permit_number?: string | null
          permit_type: string
          project_id: string
          status?: string
          submitted_date?: string | null
        }
        Update: {
          approved_date?: string | null
          created_at?: string
          document_url?: string | null
          expiration_date?: string | null
          id?: string
          permit_number?: string | null
          permit_type?: string
          project_id?: string
          status?: string
          submitted_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_permits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_phases: {
        Row: {
          actual_cost: number | null
          actual_end_date: string | null
          actual_start_date: string | null
          assigned_vendor_id: string | null
          created_at: string
          estimated_cost: number | null
          estimated_end_date: string | null
          estimated_start_date: string | null
          id: string
          name: string
          project_id: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          name: string
          project_id: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          actual_end_date?: string | null
          actual_start_date?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          estimated_cost?: number | null
          estimated_end_date?: string | null
          estimated_start_date?: string | null
          id?: string
          name?: string
          project_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_phases_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "central_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_phases_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_stage: string | null
          photo_url: string
          project_id: string
          taken_date: string
          uploaded_by: string
          uploader_type: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_stage?: string | null
          photo_url: string
          project_id: string
          taken_date?: string
          uploaded_by: string
          uploader_type?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_stage?: string | null
          photo_url?: string
          project_id?: string
          taken_date?: string
          uploaded_by?: string
          uploader_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_purchase_orders: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          ordered_date: string | null
          paid_date: string | null
          phase_id: string | null
          po_number: string | null
          project_id: string
          received_date: string | null
          status: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          description: string
          id?: string
          ordered_date?: string | null
          paid_date?: string | null
          phase_id?: string | null
          po_number?: string | null
          project_id: string
          received_date?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          ordered_date?: string | null
          paid_date?: string | null
          phase_id?: string | null
          po_number?: string | null
          project_id?: string
          received_date?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_purchase_orders_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "central_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      project_scopes: {
        Row: {
          created_at: string
          created_by: string | null
          detail_level: string
          formatted_markdown: string
          id: string
          is_current: boolean
          project_id: string
          scope_content: Json
          storage_pdf_path: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detail_level?: string
          formatted_markdown?: string
          id?: string
          is_current?: boolean
          project_id: string
          scope_content?: Json
          storage_pdf_path?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detail_level?: string
          formatted_markdown?: string
          id?: string
          is_current?: boolean
          project_id?: string
          scope_content?: Json
          storage_pdf_path?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_scopes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assigned_to: string | null
          assigned_vendor_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          phase_id: string
          priority: string | null
          project_id: string
          sort_order: number
          status: string
          time_logged_hours: number | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id: string
          priority?: string | null
          project_id: string
          sort_order?: number
          status?: string
          time_logged_hours?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          phase_id?: string
          priority?: string | null
          project_id?: string
          sort_order?: number
          status?: string
          time_logged_hours?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "central_vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "project_phases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_templates: {
        Row: {
          admin_id: string
          budget_categories_json: Json | null
          created_at: string
          document_checklist: Json | null
          id: string
          name: string
          phases_json: Json
          project_type: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          budget_categories_json?: Json | null
          created_at?: string
          document_checklist?: Json | null
          id?: string
          name: string
          phases_json?: Json
          project_type?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          budget_categories_json?: Json | null
          created_at?: string
          document_checklist?: Json | null
          id?: string
          name?: string
          phases_json?: Json
          project_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          actual_spent: number | null
          address: string | null
          allow_client_messages: boolean | null
          approved_tier: string | null
          budget: number | null
          contingency_pct: number | null
          contractor_contact: string | null
          contractor_name: string | null
          created_at: string
          description: string | null
          end_date: string | null
          estimate_id: string | null
          estimated_cost: number | null
          estimated_start_date: string | null
          id: string
          notes: string | null
          percent_complete: number | null
          priority: string | null
          project_manager_id: string | null
          project_type: string | null
          property_id: string
          report_page_id: string | null
          send_milestone_updates: boolean | null
          show_budget_to_client: boolean | null
          show_in_portal: boolean | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          value_contribution_estimate: number | null
        }
        Insert: {
          actual_spent?: number | null
          address?: string | null
          allow_client_messages?: boolean | null
          approved_tier?: string | null
          budget?: number | null
          contingency_pct?: number | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimate_id?: string | null
          estimated_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          percent_complete?: number | null
          priority?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          property_id: string
          report_page_id?: string | null
          send_milestone_updates?: boolean | null
          show_budget_to_client?: boolean | null
          show_in_portal?: boolean | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          value_contribution_estimate?: number | null
        }
        Update: {
          actual_spent?: number | null
          address?: string | null
          allow_client_messages?: boolean | null
          approved_tier?: string | null
          budget?: number | null
          contingency_pct?: number | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          estimate_id?: string | null
          estimated_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          percent_complete?: number | null
          priority?: string | null
          project_manager_id?: string | null
          project_type?: string | null
          property_id?: string
          report_page_id?: string | null
          send_milestone_updates?: boolean | null
          show_budget_to_client?: boolean | null
          show_in_portal?: boolean | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          value_contribution_estimate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          city: string | null
          client_intelligence_summary: string | null
          client_user_id: string
          county: string | null
          created_at: string
          digital_assets_status: string | null
          discovery_notes: string | null
          estimated_value: number | null
          hover_pdf_url: string | null
          hover_url: string | null
          id: string
          iguide_pdf_url: string | null
          iguide_url: string | null
          intake_status: string | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          neighborhood_median_value: number | null
          property_name: string | null
          property_type: string | null
          relationship_type: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address: string
          city?: string | null
          client_intelligence_summary?: string | null
          client_user_id: string
          county?: string | null
          created_at?: string
          digital_assets_status?: string | null
          discovery_notes?: string | null
          estimated_value?: number | null
          hover_pdf_url?: string | null
          hover_url?: string | null
          id?: string
          iguide_pdf_url?: string | null
          iguide_url?: string | null
          intake_status?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          neighborhood_median_value?: number | null
          property_name?: string | null
          property_type?: string | null
          relationship_type?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          client_intelligence_summary?: string | null
          client_user_id?: string
          county?: string | null
          created_at?: string
          digital_assets_status?: string | null
          discovery_notes?: string | null
          estimated_value?: number | null
          hover_pdf_url?: string | null
          hover_url?: string | null
          id?: string
          iguide_pdf_url?: string | null
          iguide_url?: string | null
          intake_status?: string | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          neighborhood_median_value?: number | null
          property_name?: string | null
          property_type?: string | null
          relationship_type?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      property_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          message_type: string
          metadata: Json | null
          property_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          message_type?: string
          metadata?: Json | null
          property_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          message_type?: string
          metadata?: Json | null
          property_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_messages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_photos: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_url: string
          gps_lat: number | null
          gps_lng: number | null
          height: number | null
          id: string
          inspection_id: string | null
          is_client_visible: boolean | null
          project_id: string | null
          property_id: string
          report_page_id: string | null
          room_or_area: string | null
          tags: string[] | null
          taken_at: string | null
          taken_by: string | null
          thumbnail_url: string | null
          title: string
          width: number | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_url: string
          gps_lat?: number | null
          gps_lng?: number | null
          height?: number | null
          id?: string
          inspection_id?: string | null
          is_client_visible?: boolean | null
          project_id?: string | null
          property_id: string
          report_page_id?: string | null
          room_or_area?: string | null
          tags?: string[] | null
          taken_at?: string | null
          taken_by?: string | null
          thumbnail_url?: string | null
          title?: string
          width?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_url?: string
          gps_lat?: number | null
          gps_lng?: number | null
          height?: number | null
          id?: string
          inspection_id?: string | null
          is_client_visible?: boolean | null
          project_id?: string | null
          property_id?: string
          report_page_id?: string | null
          room_or_area?: string | null
          tags?: string[] | null
          taken_at?: string | null
          taken_by?: string | null
          thumbnail_url?: string | null
          title?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_photos_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_photos_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      property_timeline: {
        Row: {
          client_id: string
          contractor_name: string | null
          cost: number | null
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          permit_number: string | null
          source_document_id: string | null
          title: string
          verified: boolean
        }
        Insert: {
          client_id: string
          contractor_name?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          permit_number?: string | null
          source_document_id?: string | null
          title: string
          verified?: boolean
        }
        Update: {
          client_id?: string
          contractor_name?: string | null
          cost?: number | null
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          permit_number?: string | null
          source_document_id?: string | null
          title?: string
          verified?: boolean
        }
        Relationships: []
      }
      property_valuations: {
        Row: {
          address: string
          comparables: Json | null
          created_at: string
          fetched_at: string
          id: string
          price: number | null
          price_range_high: number | null
          price_range_low: number | null
          property_id: string
          subject_property: Json | null
        }
        Insert: {
          address: string
          comparables?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          price?: number | null
          price_range_high?: number | null
          price_range_low?: number | null
          property_id: string
          subject_property?: Json | null
        }
        Update: {
          address?: string
          comparables?: Json | null
          created_at?: string
          fetched_at?: string
          id?: string
          price?: number | null
          price_range_high?: number | null
          price_range_low?: number | null
          property_id?: string
          subject_property?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "property_valuations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          admin_id: string | null
          auth_key: string
          client_id: string | null
          created_at: string
          device_label: string | null
          endpoint: string
          id: string
          p256dh_key: string
        }
        Insert: {
          admin_id?: string | null
          auth_key: string
          client_id?: string | null
          created_at?: string
          device_label?: string | null
          endpoint: string
          id?: string
          p256dh_key: string
        }
        Update: {
          admin_id?: string | null
          auth_key?: string
          client_id?: string | null
          created_at?: string
          device_label?: string | null
          endpoint?: string
          id?: string
          p256dh_key?: string
        }
        Relationships: []
      }
      recurring_invoice_schedules: {
        Row: {
          admin_id: string
          amount: number
          created_at: string
          description: string | null
          frequency: string
          id: string
          is_active: boolean
          last_run_date: string | null
          line_items_json: Json
          next_run_date: string
          property_id: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          amount?: number
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          line_items_json?: Json
          next_run_date: string
          property_id: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_date?: string | null
          line_items_json?: Json
          next_run_date?: string
          property_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_invoice_schedules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          admin_id: string
          converted_client_id: string | null
          created_at: string
          id: string
          notes: string | null
          referral_date: string
          referred_email: string | null
          referred_name: string
          referred_phone: string | null
          referring_client_id: string
          reward_amount: number | null
          reward_status: string
          status: string
        }
        Insert: {
          admin_id: string
          converted_client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          referral_date?: string
          referred_email?: string | null
          referred_name: string
          referred_phone?: string | null
          referring_client_id: string
          reward_amount?: number | null
          reward_status?: string
          status?: string
        }
        Update: {
          admin_id?: string
          converted_client_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          referral_date?: string
          referred_email?: string | null
          referred_name?: string
          referred_phone?: string | null
          referring_client_id?: string
          reward_amount?: number | null
          reward_status?: string
          status?: string
        }
        Relationships: []
      }
      report_comments: {
        Row: {
          comment_text: string
          comment_type: string
          created_at: string
          id: string
          report_page_id: string
          resolved: boolean
          responded_by: string | null
          response_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment_text: string
          comment_type?: string
          created_at?: string
          id?: string
          report_page_id: string
          resolved?: boolean
          responded_by?: string | null
          response_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment_text?: string
          comment_type?: string
          created_at?: string
          id?: string
          report_page_id?: string
          resolved?: boolean
          responded_by?: string | null
          response_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_comments_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      report_edit_history: {
        Row: {
          created_at: string
          edited_by: string
          field_name: string
          id: string
          new_value: Json | null
          old_value: Json | null
          report_page_id: string
        }
        Insert: {
          created_at?: string
          edited_by: string
          field_name: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          report_page_id: string
        }
        Update: {
          created_at?: string
          edited_by?: string
          field_name?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          report_page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_edit_history_report_page_id_fkey"
            columns: ["report_page_id"]
            isOneToOne: false
            referencedRelation: "report_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      report_pages: {
        Row: {
          block_config: Json | null
          condition_rating: string | null
          created_at: string
          creator_notes: string | null
          current_age_years: number | null
          dependencies: Json | null
          expected_lifespan_years: number | null
          findings: Json | null
          group_name: string
          health_bar: Json | null
          id: string
          images: Json | null
          is_complete: boolean | null
          key_observations: Json | null
          last_inspected_date: string | null
          maintenance: Json | null
          narrative: Json
          next_review_date: string | null
          page_key: string
          recommendations: Json | null
          replacement_cost_today: number | null
          report_id: string
          risks: Json | null
          sort_order: number
          specs: Json | null
          status: string
          template_id: string | null
          tiers: Json | null
          timing: string | null
          title: string
          updated_at: string
        }
        Insert: {
          block_config?: Json | null
          condition_rating?: string | null
          created_at?: string
          creator_notes?: string | null
          current_age_years?: number | null
          dependencies?: Json | null
          expected_lifespan_years?: number | null
          findings?: Json | null
          group_name: string
          health_bar?: Json | null
          id?: string
          images?: Json | null
          is_complete?: boolean | null
          key_observations?: Json | null
          last_inspected_date?: string | null
          maintenance?: Json | null
          narrative?: Json
          next_review_date?: string | null
          page_key: string
          recommendations?: Json | null
          replacement_cost_today?: number | null
          report_id: string
          risks?: Json | null
          sort_order?: number
          specs?: Json | null
          status?: string
          template_id?: string | null
          tiers?: Json | null
          timing?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          block_config?: Json | null
          condition_rating?: string | null
          created_at?: string
          creator_notes?: string | null
          current_age_years?: number | null
          dependencies?: Json | null
          expected_lifespan_years?: number | null
          findings?: Json | null
          group_name?: string
          health_bar?: Json | null
          id?: string
          images?: Json | null
          is_complete?: boolean | null
          key_observations?: Json | null
          last_inspected_date?: string | null
          maintenance?: Json | null
          narrative?: Json
          next_review_date?: string | null
          page_key?: string
          recommendations?: Json | null
          replacement_cost_today?: number | null
          report_id?: string
          risks?: Json | null
          sort_order?: number
          specs?: Json | null
          status?: string
          template_id?: string | null
          tiers?: Json | null
          timing?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_pages_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_pages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "page_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          admin_id: string
          color_scheme_json: Json
          cover_style: string
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          scoring_weights_json: Json
          sections_config_json: Json
          tier_label: string
        }
        Insert: {
          admin_id: string
          color_scheme_json?: Json
          cover_style?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          scoring_weights_json?: Json
          sections_config_json?: Json
          tier_label?: string
        }
        Update: {
          admin_id?: string
          color_scheme_json?: Json
          cover_style?: string
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          scoring_weights_json?: Json
          sections_config_json?: Json
          tier_label?: string
        }
        Relationships: []
      }
      report_versions: {
        Row: {
          change_notes: string | null
          client_id: string
          id: string
          is_published: boolean
          report_snapshot_json: Json
          saved_at: string
          saved_by_admin_id: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          client_id: string
          id?: string
          is_published?: boolean
          report_snapshot_json?: Json
          saved_at?: string
          saved_by_admin_id: string
          version_number?: number
        }
        Update: {
          change_notes?: string | null
          client_id?: string
          id?: string
          is_published?: boolean
          report_snapshot_json?: Json
          saved_at?: string
          saved_by_admin_id?: string
          version_number?: number
        }
        Relationships: []
      }
      reports: {
        Row: {
          based_on_report_id: string | null
          blocks_json: Json | null
          created_at: string
          created_by: string
          id: string
          property_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          based_on_report_id?: string | null
          blocks_json?: Json | null
          created_at?: string
          created_by: string
          id?: string
          property_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          based_on_report_id?: string | null
          blocks_json?: Json | null
          created_at?: string
          created_by?: string
          id?: string
          property_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      satisfaction_surveys: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          property_id: string
          score: number
          snoozed_until: string | null
          trigger_event: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          score: number
          snoozed_until?: string | null
          trigger_event?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          score?: number
          snoozed_until?: string | null
          trigger_event?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_surveys_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          id: string
          property_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type?: string
          id?: string
          property_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          property_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_history: {
        Row: {
          client_id: string
          contractor_name: string | null
          contractor_phone: string | null
          cost: number | null
          created_at: string
          description: string | null
          document_id: string | null
          equipment_id: string | null
          id: string
          invoice_number: string | null
          next_service_recommended_date: string | null
          notes: string | null
          service_date: string
          service_type: string
          warranty_on_work_months: number | null
        }
        Insert: {
          client_id: string
          contractor_name?: string | null
          contractor_phone?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          equipment_id?: string | null
          id?: string
          invoice_number?: string | null
          next_service_recommended_date?: string | null
          notes?: string | null
          service_date: string
          service_type: string
          warranty_on_work_months?: number | null
        }
        Update: {
          client_id?: string
          contractor_name?: string | null
          contractor_phone?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          document_id?: string | null
          equipment_id?: string | null
          id?: string
          invoice_number?: string | null
          next_service_recommended_date?: string | null
          notes?: string | null
          service_date?: string
          service_type?: string
          warranty_on_work_months?: number | null
        }
        Relationships: []
      }
      service_request_items: {
        Row: {
          created_at: string
          id: string
          request_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_items_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          client_id: string
          created_at: string
          estimate_id: string | null
          id: string
          notes: string | null
          property_id: string | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          estimate_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          estimate_id?: string | null
          id?: string
          notes?: string | null
          property_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          admin_id: string
          category: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_active: boolean
          name: string
          price: number
          price_type: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name: string
          price?: number
          price_type?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          price_type?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      signature_fields: {
        Row: {
          field_type: string
          id: string
          is_required: boolean
          page_number: number
          request_id: string
          signed_at: string | null
          value: string | null
          x_position: number
          y_position: number
        }
        Insert: {
          field_type?: string
          id?: string
          is_required?: boolean
          page_number?: number
          request_id: string
          signed_at?: string | null
          value?: string | null
          x_position?: number
          y_position?: number
        }
        Update: {
          field_type?: string
          id?: string
          is_required?: boolean
          page_number?: number
          request_id?: string
          signed_at?: string | null
          value?: string | null
          x_position?: number
          y_position?: number
        }
        Relationships: [
          {
            foreignKeyName: "signature_fields_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "signature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_requests: {
        Row: {
          admin_id: string
          client_id: string
          created_at: string
          declined_at: string | null
          document_content_html: string
          document_title: string
          document_type: string
          expires_at: string | null
          id: string
          sent_at: string | null
          signed_at: string | null
          signed_document_url: string | null
          status: string
        }
        Insert: {
          admin_id: string
          client_id: string
          created_at?: string
          declined_at?: string | null
          document_content_html?: string
          document_title: string
          document_type?: string
          expires_at?: string | null
          id?: string
          sent_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
        }
        Update: {
          admin_id?: string
          client_id?: string
          created_at?: string
          declined_at?: string | null
          document_content_html?: string
          document_title?: string
          document_type?: string
          expires_at?: string | null
          id?: string
          sent_at?: string | null
          signed_at?: string | null
          signed_document_url?: string | null
          status?: string
        }
        Relationships: []
      }
      sla_configs: {
        Row: {
          admin_id: string
          created_at: string
          first_contact_hours: number
          id: string
          message_response_hours: number
          report_delivery_days: number
          tier_label: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          first_contact_hours?: number
          id?: string
          message_response_hours?: number
          report_delivery_days?: number
          tier_label?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          first_contact_hours?: number
          id?: string
          message_response_hours?: number
          report_delivery_days?: number
          tier_label?: string
        }
        Relationships: []
      }
      sla_tracking: {
        Row: {
          client_id: string
          completed_at: string | null
          created_at: string
          id: string
          related_entity_id: string | null
          sla_type: string
          target_deadline: string
          triggered_at: string
          variance_minutes: number | null
          was_met: boolean | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          related_entity_id?: string | null
          sla_type: string
          target_deadline: string
          triggered_at?: string
          variance_minutes?: number | null
          was_met?: boolean | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          related_entity_id?: string | null
          sla_type?: string
          target_deadline?: string
          triggered_at?: string
          variance_minutes?: number | null
          was_met?: boolean | null
        }
        Relationships: []
      }
      sms_subscriptions: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          opted_in_events_json: Json
          phone_number: string
          user_id: string
          user_type: string
          verification_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          opted_in_events_json?: Json
          phone_number: string
          user_id: string
          user_type?: string
          verification_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          opted_in_events_json?: Json
          phone_number?: string
          user_id?: string
          user_type?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      structural_specifications: {
        Row: {
          client_id: string
          id: string
          notes: string | null
          recorded_at: string
          source_document_id: string | null
          spec_category: string
          specification_name: string
          specification_value: string
          unit: string | null
        }
        Insert: {
          client_id: string
          id?: string
          notes?: string | null
          recorded_at?: string
          source_document_id?: string | null
          spec_category: string
          specification_name: string
          specification_value: string
          unit?: string | null
        }
        Update: {
          client_id?: string
          id?: string
          notes?: string | null
          recorded_at?: string
          source_document_id?: string | null
          spec_category?: string
          specification_name?: string
          specification_value?: string
          unit?: string | null
        }
        Relationships: []
      }
      subscription_events: {
        Row: {
          amount_cents: number | null
          client_id: string
          created_at: string | null
          currency: string | null
          event_type: string
          id: string
          invoice_url: string | null
          period_end: string | null
          period_start: string | null
          stripe_event_id: string | null
        }
        Insert: {
          amount_cents?: number | null
          client_id: string
          created_at?: string | null
          currency?: string | null
          event_type: string
          id?: string
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          stripe_event_id?: string | null
        }
        Update: {
          amount_cents?: number | null
          client_id?: string
          created_at?: string | null
          currency?: string | null
          event_type?: string
          id?: string
          invoice_url?: string | null
          period_end?: string | null
          period_start?: string | null
          stripe_event_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          admin_id: string
          category: string | null
          client_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          category?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          activity_type: string
          admin_id: string
          client_id: string
          created_at: string
          entry_date: string
          hours: number
          id: string
          notes: string | null
        }
        Insert: {
          activity_type?: string
          admin_id: string
          client_id: string
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          notes?: string | null
        }
        Update: {
          activity_type?: string
          admin_id?: string
          client_id?: string
          created_at?: string
          entry_date?: string
          hours?: number
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_partner_invites: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          invited_by: string
          project_id: string
          status: string
          vendor_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          invited_by: string
          project_id: string
          status?: string
          vendor_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          invited_by?: string
          project_id?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_partner_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_partner_invites_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "central_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_progress: {
        Row: {
          admin_setup_dismissed: boolean
          admin_setup_items_json: Json
          checklist_items_json: Json
          completed_tours: Json
          created_at: string
          id: string
          onboarding_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_setup_dismissed?: boolean
          admin_setup_items_json?: Json
          checklist_items_json?: Json
          completed_tours?: Json
          created_at?: string
          id?: string
          onboarding_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_setup_dismissed?: boolean
          admin_setup_items_json?: Json
          checklist_items_json?: Json
          completed_tours?: Json
          created_at?: string
          id?: string
          onboarding_complete?: boolean
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_performance_reviews: {
        Row: {
          admin_id: string
          communication_rating: number
          cost_accuracy_rating: number
          created_at: string
          id: string
          notes: string | null
          project_id: string | null
          quality_rating: number
          review_date: string
          timeliness_rating: number
          vendor_id: string
        }
        Insert: {
          admin_id: string
          communication_rating?: number
          cost_accuracy_rating?: number
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quality_rating?: number
          review_date?: string
          timeliness_rating?: number
          vendor_id: string
        }
        Update: {
          admin_id?: string
          communication_rating?: number
          cost_accuracy_rating?: number
          created_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          quality_rating?: number
          review_date?: string
          timeliness_rating?: number
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_performance_reviews_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          phone: string | null
          property_id: string
          report_page_key: string | null
          specialty: string
          title: string
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          property_id: string
          report_page_key?: string | null
          specialty?: string
          title: string
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          phone?: string | null
          property_id?: string
          report_page_key?: string | null
          specialty?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_interactions: {
        Row: {
          client_id: string
          command_type: string | null
          created_at: string
          destination: string | null
          id: string
          response_text: string | null
          transcript: string
          was_successful: boolean
        }
        Insert: {
          client_id: string
          command_type?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          response_text?: string | null
          transcript: string
          was_successful?: boolean
        }
        Update: {
          client_id?: string
          command_type?: string | null
          created_at?: string
          destination?: string | null
          id?: string
          response_text?: string | null
          transcript?: string
          was_successful?: boolean
        }
        Relationships: []
      }
      warranty_registry: {
        Row: {
          claim_process: string | null
          client_id: string
          coverage_description: string | null
          created_at: string
          document_id: string | null
          equipment_id: string | null
          expiration_date: string | null
          id: string
          is_active: boolean
          item_name: string
          manufacturer: string | null
          model_number: string | null
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          support_email: string | null
          support_phone: string | null
          support_url: string | null
          warranty_duration_months: number | null
          warranty_type: string | null
        }
        Insert: {
          claim_process?: string | null
          client_id: string
          coverage_description?: string | null
          created_at?: string
          document_id?: string | null
          equipment_id?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_url?: string | null
          warranty_duration_months?: number | null
          warranty_type?: string | null
        }
        Update: {
          claim_process?: string | null
          client_id?: string
          coverage_description?: string | null
          created_at?: string
          document_id?: string | null
          equipment_id?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          manufacturer?: string | null
          model_number?: string | null
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          support_email?: string | null
          support_phone?: string | null
          support_url?: string | null
          warranty_duration_months?: number | null
          warranty_type?: string | null
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          event_type: string
          fired_at: string
          id: string
          payload_json: Json
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          event_type: string
          fired_at?: string
          id?: string
          payload_json?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          event_type?: string
          fired_at?: string
          id?: string
          payload_json?: Json
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          admin_id: string
          created_at: string
          endpoint_url: string
          events_subscribed_json: Json
          failure_count: number
          id: string
          is_active: boolean
          label: string
          last_triggered_at: string | null
          secret_token: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          endpoint_url: string
          events_subscribed_json?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          label: string
          last_triggered_at?: string | null
          secret_token: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          endpoint_url?: string
          events_subscribed_json?: Json
          failure_count?: number
          id?: string
          is_active?: boolean
          label?: string
          last_triggered_at?: string | null
          secret_token?: string
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
      app_role: "creator" | "client" | "trade_partner"
      crm_client_stage:
        | "lead"
        | "onboarding"
        | "active"
        | "proposal_out"
        | "project_running"
        | "completed"
        | "at_risk"
        | "churned"
      crm_contact_type: "client" | "trade_partner"
      crm_partner_stage:
        | "prospecting"
        | "vetting"
        | "approved"
        | "active"
        | "preferred"
        | "inactive"
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
      app_role: ["creator", "client", "trade_partner"],
      crm_client_stage: [
        "lead",
        "onboarding",
        "active",
        "proposal_out",
        "project_running",
        "completed",
        "at_risk",
        "churned",
      ],
      crm_contact_type: ["client", "trade_partner"],
      crm_partner_stage: [
        "prospecting",
        "vetting",
        "approved",
        "active",
        "preferred",
        "inactive",
      ],
    },
  },
} as const
