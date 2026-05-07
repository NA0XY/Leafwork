export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          display_name?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      workflows: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          steps: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          steps: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          steps?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_logs: {
        Row: {
          id: string;
          user_id: string | null;
          tool_name: string;
          file_size_bytes: number;
          duration_ms: number;
          ai_tokens_used: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          tool_name: string;
          file_size_bytes: number;
          duration_ms: number;
          ai_tokens_used?: number | null;
          created_at?: string;
        };
        Update: {
          ai_tokens_used?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
