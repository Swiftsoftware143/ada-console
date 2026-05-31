// Client types
export interface Client {
  id: string;
  name: string;
  domain: string;
  plan_tier: 'basic' | 'pro' | 'enterprise';
  active: boolean;
  created_at: string;
  updated_at: string;
  tags?: string[];
  location?: string;
  settings?: ClientSettings;
}

export interface ClientSettings {
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primary_color?: string;
  [key: string]: unknown;
}

// Widget types
export interface WidgetRequest {
  id: string;
  widget_id: string;
  business_name: string;
  contact_name: string;
  contact_email: string;
  domain: string;
  plan_tier: 'basic' | 'pro' | 'enterprise';
  status: 'pending' | 'pending_review' | 'delivered' | 'rejected';
  auto_deliver: boolean;
  created_at: string;
  updated_at: string;
}

export interface WidgetConfig {
  widgetId: string;
  domain: string;
  planTier: string;
  primaryColor: string;
  position: string;
  theme: string;
}

// Personal Website types
export interface PersonalWebsite {
  id: string;
  name: string;
  url: string;
  description?: string;
  tags?: string[];
  location?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: 'admin' | 'user';
  created_at: string;
}

// Stats types
export interface DashboardStats {
  total: number;
  active: number;
  inactive: number;
  thisMonth: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: null | {
    message: string;
    code: string;
  };
}

// Component prop types
export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  accentClass?: string;
  testId?: string;
}

export interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'small' | 'normal' | 'large' | 'xlarge';
}
