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
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          item_type: string
          quantity: number
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
          invoice_number: string | null
          issue_date: string | null
          notes: string | null
          paid_date: string | null
          property_id: string
          status: string
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
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          property_id: string
          status?: string
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
          invoice_number?: string | null
          issue_date?: string | null
          notes?: string | null
          paid_date?: string | null
          property_id?: string
          status?: string
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
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          approved_tier: string | null
          contractor_contact: string | null
          contractor_name: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          estimated_start_date: string | null
          id: string
          notes: string | null
          property_id: string
          report_page_id: string | null
          status: string
          title: string
          updated_at: string
          value_contribution_estimate: number | null
        }
        Insert: {
          approved_tier?: string | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          property_id: string
          report_page_id?: string | null
          status?: string
          title: string
          updated_at?: string
          value_contribution_estimate?: number | null
        }
        Update: {
          approved_tier?: string | null
          contractor_contact?: string | null
          contractor_name?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          estimated_start_date?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          report_page_id?: string | null
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
      reports: {
        Row: {
          created_at: string
          created_by: string
          id: string
          property_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          property_id: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
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
      tasks: {
        Row: {
          admin_id: string
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
      app_role: "creator" | "client"
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
      app_role: ["creator", "client"],
    },
  },
} as const
