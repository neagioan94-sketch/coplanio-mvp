// =============================================================================
// DATABASE TYPES — PLACEHOLDER
//
// This file is a hand-written placeholder until the Supabase CLI generates it.
//
// To regenerate from a running Supabase project, run:
//   supabase gen types typescript --local > types/database.types.ts
//
// Or for a hosted project:
//   supabase gen types typescript --project-id <project-id> > types/database.types.ts
//
// Do NOT manually maintain the detailed row types here — regenerate via CLI.
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          avatar_url: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          avatar_url?: string | null;
          status?: string;
          updated_at?: string;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          timezone: string | null;
          country: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          timezone?: string | null;
          country?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          name?: string;
          slug?: string | null;
          timezone?: string | null;
          country?: string | null;
          status?: string;
          created_by?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      memberships: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: string;
          status: string;
          invited_by: string | null;
          joined_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role: string;
          status?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          role?: string;
          status?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          age_group: string | null;
          season: string | null;
          level: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          age_group?: string | null;
          season?: string | null;
          level?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          name?: string;
          age_group?: string | null;
          season?: string | null;
          level?: string | null;
          status?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      team_staff: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string;
          user_id: string;
          staff_role: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id: string;
          user_id: string;
          staff_role?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          staff_role?: string;
          status?: string;
          updated_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          display_name: string | null;
          date_of_birth: string | null;
          primary_position: string | null;
          preferred_foot: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          display_name?: string | null;
          date_of_birth?: string | null;
          primary_position?: string | null;
          preferred_foot?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          first_name?: string;
          last_name?: string;
          display_name?: string | null;
          date_of_birth?: string | null;
          primary_position?: string | null;
          preferred_foot?: string | null;
          status?: string;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      player_team_memberships: {
        Row: {
          id: string;
          organization_id: string;
          player_id: string;
          team_id: string;
          squad_number: number | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          player_id: string;
          team_id: string;
          squad_number?: number | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          squad_number?: number | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          updated_at?: string;
        };
      };
      exercises: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          objective: string;
          category: string | null;
          description: string | null;
          coaching_points: string | null;
          duration_minutes: number | null;
          player_count_min: number | null;
          player_count_max: number | null;
          difficulty: string | null;
          tags: string[];
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          objective: string;
          category?: string | null;
          description?: string | null;
          coaching_points?: string | null;
          duration_minutes?: number | null;
          player_count_min?: number | null;
          player_count_max?: number | null;
          difficulty?: string | null;
          tags?: string[];
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          name?: string;
          objective?: string;
          category?: string | null;
          description?: string | null;
          coaching_points?: string | null;
          duration_minutes?: number | null;
          player_count_min?: number | null;
          player_count_max?: number | null;
          difficulty?: string | null;
          tags?: string[];
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      training_sessions: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string;
          title: string;
          session_date: string;
          start_time: string | null;
          duration_minutes: number | null;
          objective: string | null;
          location: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id: string;
          title: string;
          session_date: string;
          start_time?: string | null;
          duration_minutes?: number | null;
          objective?: string | null;
          location?: string | null;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          title?: string;
          session_date?: string;
          start_time?: string | null;
          duration_minutes?: number | null;
          objective?: string | null;
          location?: string | null;
          status?: string;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      session_exercises: {
        Row: {
          id: string;
          organization_id: string;
          session_id: string;
          exercise_id: string | null;
          sort_order: number;
          planned_duration_minutes: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          session_id: string;
          exercise_id?: string | null;
          sort_order?: number;
          planned_duration_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          exercise_id?: string | null;
          sort_order?: number;
          planned_duration_minutes?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          organization_id: string;
          session_id: string;
          player_id: string;
          status: string;
          notes: string | null;
          recorded_by: string | null;
          recorded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          session_id: string;
          player_id: string;
          status?: string;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: string;
          notes?: string | null;
          recorded_by?: string | null;
          recorded_at?: string | null;
          updated_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          organization_id: string;
          team_id: string;
          match_date: string;
          opponent: string;
          location: string | null;
          competition: string | null;
          home_away: string | null;
          goals_for: number | null;
          goals_against: number | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          team_id: string;
          match_date: string;
          opponent: string;
          location?: string | null;
          competition?: string | null;
          home_away?: string | null;
          goals_for?: number | null;
          goals_against?: number | null;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          match_date?: string;
          opponent?: string;
          location?: string | null;
          competition?: string | null;
          home_away?: string | null;
          goals_for?: number | null;
          goals_against?: number | null;
          status?: string;
          notes?: string | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      assessment_types: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          category: string | null;
          unit: string | null;
          description: string | null;
          higher_is_better: boolean | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          category?: string | null;
          unit?: string | null;
          description?: string | null;
          higher_is_better?: boolean | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          name?: string;
          category?: string | null;
          unit?: string | null;
          description?: string | null;
          higher_is_better?: boolean | null;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      assessment_results: {
        Row: {
          id: string;
          organization_id: string;
          assessment_type_id: string;
          player_id: string;
          team_id: string | null;
          assessed_at: string;
          value: number;
          unit: string | null;
          notes: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          assessment_type_id: string;
          player_id: string;
          team_id?: string | null;
          assessed_at: string;
          value: number;
          unit?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assessed_at?: string;
          value?: number;
          unit?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          updated_at?: string;
        };
      };
      reports: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          report_type: string;
          source_entity_type: string | null;
          source_entity_id: string | null;
          content: Json | null;
          summary: string | null;
          status: string;
          generated_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          report_type: string;
          source_entity_type?: string | null;
          source_entity_id?: string | null;
          content?: Json | null;
          summary?: string | null;
          status?: string;
          generated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          title?: string;
          report_type?: string;
          source_entity_type?: string | null;
          source_entity_id?: string | null;
          content?: Json | null;
          summary?: string | null;
          status?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string | null;
          actor_user_id: string | null;
          action_type: string;
          target_type: string | null;
          target_id: string | null;
          previous_value: Json | null;
          new_value: Json | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          actor_user_id?: string | null;
          action_type: string;
          target_type?: string | null;
          target_id?: string | null;
          previous_value?: Json | null;
          new_value?: Json | null;
          source?: string | null;
          created_at?: string;
        };
        Update: never; // audit_events is append-only
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_org_member: {
        Args: { target_organization_id: string };
        Returns: boolean;
      };
      has_org_role: {
        Args: { target_organization_id: string; allowed_roles: string[] };
        Returns: boolean;
      };
      has_team_access: {
        Args: { target_organization_id: string; target_team_id: string };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
}
