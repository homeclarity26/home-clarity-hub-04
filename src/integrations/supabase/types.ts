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
      invoices: {
        Row: {
          amount: number
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_date: string | null
          property_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid_date?: string | null
          property_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_date?: string | null
          property_id?: string
          status?: string
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
      profiles: {
        Row: {
          avatar_initials: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
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
          id?: string
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
          id?: string
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
          created_at: string
          id: string
          notes: string | null
          property_id: string
          report_page_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_tier?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id: string
          report_page_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_tier?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          property_id?: string
          report_page_id?: string | null
          status?: string
          title?: string
          updated_at?: string
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
          client_user_id: string
          created_at: string
          estimated_value: number | null
          id: string
          iguide_url: string | null
          metadata: Json | null
          property_name: string | null
          updated_at: string
        }
        Insert: {
          address: string
          client_user_id: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          iguide_url?: string | null
          metadata?: Json | null
          property_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          client_user_id?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          iguide_url?: string | null
          metadata?: Json | null
          property_name?: string | null
          updated_at?: string
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
          dependencies: Json | null
          group_name: string
          health_bar: Json | null
          id: string
          images: Json | null
          key_observations: Json | null
          maintenance: Json | null
          narrative: Json
          page_key: string
          recommendations: Json | null
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
          dependencies?: Json | null
          group_name: string
          health_bar?: Json | null
          id?: string
          images?: Json | null
          key_observations?: Json | null
          maintenance?: Json | null
          narrative?: Json
          page_key: string
          recommendations?: Json | null
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
          dependencies?: Json | null
          group_name?: string
          health_bar?: Json | null
          id?: string
          images?: Json | null
          key_observations?: Json | null
          maintenance?: Json | null
          narrative?: Json
          page_key?: string
          recommendations?: Json | null
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
