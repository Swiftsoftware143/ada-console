// ADASwift TypeScript Types

export interface User {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface Client {
  id: string;
  name: string;
  slug?: string;
  domain: string;
  plan_tier: 'basic' | 'starter' | 'pro' | 'growth' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  active: boolean;
  credits_balance?: number;
  created_at: string;
  contact_email?: string;
  contact_name?: string;
  contact_phone?: string;
  tags?: string | string[];
  location?: string;
  notes?: string;
  agency_name?: string;
  cta_url?: string;
  widget_position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  primary_color?: string;
  enabled_profiles?: Record<string, boolean>;
  enabled_features?: Record<string, boolean>;
  category?: string;
  automation_trigger?: string;
  automation_trigger_id?: string;
  widget_delivery_status?: string;
  widget_delivered_at?: string;
}

export interface PersonalWebsite {
  id: string;
  name: string;
  domain: string;
  plan_tier: 'basic' | 'starter' | 'pro' | 'growth' | 'enterprise';
  active: boolean;
  created_at: string;
  contact_email?: string;
  contact_name?: string;
  tags?: string | string[];
  location?: string;
  notes?: string;
  agency_name?: string;
  cta_url?: string;
  widget_position?: 'bottom-left' | 'bottom-right';
  primary_color?: string;
  enabled_profiles?: Record<string, boolean>;
  enabled_features?: Record<string, boolean>;
}

export interface WidgetConfig {
  id: string;
  client_id: string;
  name: string;
  primary_color: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  welcome_message: string;
  ai_enabled: boolean;
  created_at: string;
}

export interface DashboardStats {
  total_widgets: number;
  active_widgets: number;
  total_interactions: number;
  monthly_interactions: number;
}

export interface WidgetRequest {
  id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  domain: string;
  plan_tier: string;
  status: 'pending' | 'pending_review' | 'delivered';
  widget_id: string;
  embed_code?: string;
  delivered_at?: string;
  auto_deliver?: boolean;
  created_at: string;
}

export interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
  fromEmail: string;
  fromName: string;
  subjectTemplate: string;
  htmlTemplate: string;
  textTemplate: string;
}

export interface SMTPSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
}

export interface PreviewData {
  contact_name: string;
  first_name: string;
  last_name: string;
  company_name: string;
  domain: string;
  plan_tier: string;
  billing_period: string;
  embed_code: string;
}

export interface AutomationStats {
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  bySource: Record<string, number>;
}

export interface AutomationLog {
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
}

export interface ScanSettings {
  client_id: string;
  monthly_scan_enabled: boolean;
  last_scan_at?: string;
  last_scan_score?: number;
  scan_count: number;
}

export interface ScanReport {
  id: string;
  client_id: string;
  domain: string;
  overall_score: number;
  error_count: number;
  warning_count: number;
  notice_count?: number;
  scan_results: {
    issues?: ScanIssue[];
  };
  previous_scan_id?: string;
  improvement_score?: number;
  email_sent?: boolean;
  email_sent_at?: string;
  scan_date: string;
  clients?: {
    name: string;
    domain: string;
  };
}

export interface ScanIssue {
  type: 'error' | 'warning' | 'notice';
  message: string;
  code?: string;
}

export interface PlanConfig {
  id: string;
  name: string;
  max_pages: number;
  price: number;
  features: {
    profiles: boolean;
    content: boolean;
    display: boolean;
    keyboard: boolean;
  };
}

export interface Setting {
  key: string;
  value: string;
  updated_at?: string;
}

// Component Props Types
export interface StatusBadgeProps {
  active: boolean;
  testId?: string;
}

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (client?: Client) => void;
  isPersonal?: boolean;
}

export interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  clientName?: string;
}

export interface MasterStatusHeroProps {
  name: string;
  domain: string;
  active: boolean;
  onToggle: () => void;
}

export interface MasterToggleProps {
  active: boolean;
  onChange: (active: boolean) => void;
  disabled?: boolean;
  testId?: string;
}

export interface EmbedCodeBlockProps {
  code: string;
  testId?: string;
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
}

export interface CategoryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoriesChange?: () => void;
}

export interface PersonalWebsiteFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (website?: PersonalWebsite) => void;
}

// Supabase Types
export interface SupabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

// Utility Types
export type SortDirection = 'asc' | 'desc';

export interface Column {
  key: string;
  label: string;
}

// Netlify Function Types
export interface WebhookPayload {
  contact_email: string;
  business_name: string;
  domain: string;
  contact_name?: string;
  plan_tier?: string;
  trigger_source?: string;
  trigger_id?: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
  error?: string;
  client_id?: string;
  log_id?: string;
  email_sent?: boolean;
}
