/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Database {
  public: {
    Tables: {
      websites: {
        Row: {
          id: number;
          url: string;
          title: string;
          desc: string | null;
          category: string | null;
          is_gsa: boolean;
          is_index: boolean;
          is_featured: boolean;
          traffic: number;
          domain_rating: number;
          backlinks: number;
          referring_domains: number;
          is_wp: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          url: string;
          title: string;
          desc?: string | null;
          category?: string | null;
          is_gsa?: boolean;
          is_index?: boolean;
          is_featured?: boolean;
          traffic?: number;
          domain_rating?: number;
          backlinks?: number;
          referring_domains?: number;
          is_wp?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          url?: string;
          title?: string;
          desc?: string | null;
          category?: string | null;
          is_gsa?: boolean;
          is_index?: boolean;
          is_featured?: boolean;
          traffic?: number;
          domain_rating?: number;
          backlinks?: number;
          referring_domains?: number;
          is_wp?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      games: {
        Row: {
          id: number;
          url: string;
          title: string;
          desc: string | null;
          category: string | null;
          game_url: string | null;
          game_icon: string | null;
          game_thumb: string | null;
          game_developer: string | null;
          game_publish_year: number | null;
          game_controls: any | null;
          game: string | null;
          is_featured: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          url: string;
          title: string;
          desc?: string | null;
          category?: string | null;
          game_url?: string | null;
          game_icon?: string | null;
          game_thumb?: string | null;
          game_developer?: string | null;
          game_publish_year?: number | null;
          game_controls?: any | null;
          game?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          url?: string;
          title?: string;
          desc?: string | null;
          category?: string | null;
          game_url?: string | null;
          game_icon?: string | null;
          game_thumb?: string | null;
          game_developer?: string | null;
          game_publish_year?: number | null;
          game_controls?: any | null;
          game?: string | null;
          is_featured?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      cloudflare_accounts: {
        Row: {
          id: number;
          account_name: string;
          email: string;
          api_token: string;
          account_id: string;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          account_name: string;
          email: string;
          api_token: string;
          account_id: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          account_name?: string;
          email?: string;
          api_token?: string;
          account_id?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
      cloudflare_purge_logs: {
        Row: {
          id: number;
          cloudflare_account_id: number | null;
          mode: "url" | "hostname" | "tag" | "prefix";
          payload: any;
          exclusions: any | null;
          status_code: number | null;
          result: any | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: number;
          cloudflare_account_id?: number | null;
          mode: "url" | "hostname" | "tag" | "prefix";
          payload: any;
          exclusions?: any | null;
          status_code?: number | null;
          result?: any | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: number;
          cloudflare_account_id?: number | null;
          mode?: "url" | "hostname" | "tag" | "prefix";
          payload?: any;
          exclusions?: any | null;
          status_code?: number | null;
          result?: any | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      textlinks: {
        Row: {
          id: number;
          link: string;
          anchor_text: string;
          target: string;
          rel: string;
          title: string | null;
          website_id: number | null;
          custom_domain: string | null;
          show_on_all_pages: boolean;
          include_paths: string | null;
          exclude_paths: string | null;
          created_at: string;
          updated_at: string;
          created_by: string | null;
          updated_by: string | null;
        };
        Insert: {
          id?: number;
          link: string;
          anchor_text: string;
          target?: string;
          rel?: string;
          title?: string | null;
          website_id?: number | null;
          custom_domain?: string | null;
          show_on_all_pages?: boolean;
          include_paths?: string | null;
          exclude_paths?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
        Update: {
          id?: number;
          link?: string;
          anchor_text?: string;
          target?: string;
          rel?: string;
          title?: string | null;
          website_id?: number | null;
          custom_domain?: string | null;
          show_on_all_pages?: boolean;
          include_paths?: string | null;
          exclude_paths?: string | null;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
          updated_by?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
