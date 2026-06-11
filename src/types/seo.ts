// SEO Settings Types

export interface SEOSettings {
  id: string;
  site_name: string;
  site_description: string;
  site_keywords: string;
  site_url: string;
  og_image: string;
  twitter_handle: string;
  facebook_app_id: string;
  google_analytics_id: string;
  google_site_verification: string;
  facebook_pixel_id: string;
  schema_type: 'Organization' | 'LocalBusiness' | 'SoftwareApplication';
  company_name: string;
  company_logo: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  updated_at: string;
}

export interface SchemaMarkup {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  url: string;
  logo?: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: {
    '@type': string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
  priceRange?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    '@type': string;
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    ratingCount: string;
  };
}

export const DEFAULT_SEO: Partial<SEOSettings> = {
  site_name: 'FunnelSwift',
  site_description: 'Automate your marketing workflows with FunnelSwift',
  site_keywords: 'marketing automation, workflows, SaaS, funnel building',
  site_url: 'https://funnelswift.com',
  og_image: '/og-image.png',
  twitter_handle: '@funnelswift',
  schema_type: 'SoftwareApplication',
};
