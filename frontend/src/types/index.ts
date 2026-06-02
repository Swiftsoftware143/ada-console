// ADASwift TypeScript Types

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  plan_slug: string;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  credits_balance: number;
  created_at: string;
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
