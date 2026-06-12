import { createClient } from '@supabase/supabase-js';
import { Client, PersonalWebsite } from '@/types';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

export const DEFAULT_PROFILES: Record<string, boolean> = {
  epilepsy: false,
  cognitive: false,
  adhd: false,
  blindness: false,
  visImpaired: false,
};

export const DEFAULT_FEATURES: Record<string, boolean> = {
  readableFont: false,
  dyslexia: false,
  highlightTitles: false,
  highlightLinks: false,
  stopAnimations: false,
  muteSounds: false,
  hideImages: false,
  virtualKeyboard: false,
  readingGuide: false,
  readingMask: false,
};

export const PROFILE_LABELS: Record<string, string> = {
  epilepsy: "Epilepsy Safe",
  cognitive: "Cognitive Disability",
  adhd: "ADHD Friendly",
  blindness: "Blindness Mode",
  visImpaired: "Visually Impaired",
};

export const FEATURE_LABELS: Record<string, string> = {
  readableFont: "Readable Font",
  dyslexia: "Dyslexia Friendly",
  highlightTitles: "Highlight Titles",
  highlightLinks: "Highlight Links",
  stopAnimations: "Stop Animations",
  muteSounds: "Mute Sounds",
  hideImages: "Hide Images",
  virtualKeyboard: "Virtual Keyboard",
  readingGuide: "Reading Guide",
  readingMask: "Reading Mask",
};

// Type definitions for database tables
declare module '@supabase/supabase-js' {
  interface Database {
    public: {
      Tables: {
        clients: {
          Row: Client;
          Insert: Omit<Client, 'id' | 'created_at'>;
          Update: Partial<Client>;
        };
        personal_websites: {
          Row: PersonalWebsite;
          Insert: Omit<PersonalWebsite, 'id' | 'created_at'>;
          Update: Partial<PersonalWebsite>;
        };
        settings: {
          Row: {
            key: string;
            value: string;
            updated_at?: string;
          };
          Insert: {
            key: string;
            value: string;
            updated_at?: string;
          };
          Update: {
            value?: string;
            updated_at?: string;
          };
        };
        widget_automation_log: {
          Row: {
            id: string;
            trigger_source: string;
            trigger_id?: string;
            contact_email: string;
            contact_name?: string;
            business_name: string;
            domain: string;
            plan_tier: string;
            email_status: string;
            email_sent?: boolean;
            email_sent_at?: string;
            error_message?: string;
            client_id?: string;
            created_at: string;
          };
          Insert: Omit<{
            id: string;
            trigger_source: string;
            trigger_id?: string;
            contact_email: string;
            contact_name?: string;
            business_name: string;
            domain: string;
            plan_tier: string;
            email_status: string;
            email_sent?: boolean;
            email_sent_at?: string;
            error_message?: string;
            client_id?: string;
            created_at: string;
          }, 'id' | 'created_at'>;
        };
        scan_reports: {
          Row: {
            id: string;
            client_id: string;
            domain: string;
            overall_score: number;
            error_count: number;
            warning_count: number;
            notice_count?: number;
            scan_results: Record<string, unknown>;
            previous_scan_id?: string;
            improvement_score?: number;
            email_sent?: boolean;
            email_sent_at?: string;
            scan_date: string;
          };
          Insert: Omit<{
            id: string;
            client_id: string;
            domain: string;
            overall_score: number;
            error_count: number;
            warning_count: number;
            notice_count?: number;
            scan_results: Record<string, unknown>;
            previous_scan_id?: string;
            improvement_score?: number;
            email_sent?: boolean;
            email_sent_at?: string;
            scan_date: string;
          }, 'id' | 'scan_date'>;
        };
        client_scan_settings: {
          Row: {
            client_id: string;
            monthly_scan_enabled: boolean;
            last_scan_at?: string;
            last_scan_score?: number;
            scan_count: number;
          };
          Insert: {
            client_id: string;
            monthly_scan_enabled: boolean;
            last_scan_at?: string;
            last_scan_score?: number;
            scan_count?: number;
          };
          Update: {
            monthly_scan_enabled?: boolean;
            last_scan_at?: string;
            last_scan_score?: number;
            scan_count?: number;
          };
        };
      };
    };
  }
}
