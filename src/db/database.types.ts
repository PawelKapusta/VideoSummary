export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          youtube_channel_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          youtube_channel_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          youtube_channel_id?: string
        }
        Relationships: []
      }
      generation_requests: {
        Row: {
          created_at: string
          id: string
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_requests_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      hidden_summaries: {
        Row: {
          hidden_at: string
          id: string
          summary_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          id?: string
          summary_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          id?: string
          summary_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hidden_summaries_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          error_code: Database["public"]["Enums"]["summary_error_code"] | null
          full_summary: Json | null
          generated_at: string | null
          id: string
          status: Database["public"]["Enums"]["summary_status"]
          tldr: string | null
          video_id: string
        }
        Insert: {
          error_code?: Database["public"]["Enums"]["summary_error_code"] | null
          full_summary?: Json | null
          generated_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["summary_status"]
          tldr?: string | null
          video_id: string
        }
        Update: {
          error_code?: Database["public"]["Enums"]["summary_error_code"] | null
          full_summary?: Json | null
          generated_at?: string | null
          id?: string
          status?: Database["public"]["Enums"]["summary_status"]
          tldr?: string | null
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: true
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_ratings: {
        Row: {
          created_at: string
          id: string
          rating: boolean
          summary_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          rating: boolean
          summary_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          rating?: boolean
          summary_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_ratings_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "summaries"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          metadata_last_checked_at: string | null
          published_at: string | null
          thumbnail_url: string | null
          title: string
          youtube_video_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          metadata_last_checked_at?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title: string
          youtube_video_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          metadata_last_checked_at?: string | null
          published_at?: string | null
          thumbnail_url?: string | null
          title?: string
          youtube_video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      subscribe_to_channel_atomic: {
        Args: { p_channel_id: string; p_lock_key: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      summary_error_code: "NO_SUBTITLES" | "VIDEO_PRIVATE" | "VIDEO_TOO_LONG"
      summary_status: "pending" | "in_progress" | "completed" | "failed"
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
    Enums: {
      summary_error_code: ["NO_SUBTITLES", "VIDEO_PRIVATE", "VIDEO_TOO_LONG"],
      summary_status: ["pending", "in_progress", "completed", "failed"],
    },
  },
} as const

