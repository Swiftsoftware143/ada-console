// SEO Utilities
import { SEOSettings, SchemaMarkup } from '../types/seo';

export function generateSchemaMarkup(settings: SEOSettings, pageType: 'home' | 'product' | 'about' | 'contact' = 'home'): SchemaMarkup {
  const baseSchema: SchemaMarkup = {
    '@context': 'https://schema.org',
    '@type': settings.schema_type,
    name: settings.site_name,
    description: settings.site_description,
    url: settings.site_url,
    logo: settings.company_logo,
    image: settings.og_image,
  };

  if (settings.company_phone) {
    baseSchema.telephone = settings.company_phone;
  }

  if (settings.company_email) {
    baseSchema.email = settings.company_email;
  }

  if (settings.company_address) {
    const [street, city, stateZip, country] = settings.company_address.split(',').map(s => s.trim());
    const [state, postalCode] = stateZip ? stateZip.split(' ') : ['', ''];
    
    baseSchema.address = {
      '@type': 'PostalAddress',
      streetAddress: street || '',
      addressLocality: city || '',
      addressRegion: state || '',
      postalCode: postalCode || '',
      addressCountry: country || 'US',
    };
  }

  if (pageType === 'product' && settings.schema_type === 'SoftwareApplication') {
    baseSchema.applicationCategory = 'BusinessApplication';
    baseSchema.operatingSystem = 'Web';
    baseSchema.offers = {
      '@type': 'Offer',
      price: '29.00',
      priceCurrency: 'USD',
    };
    baseSchema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '127',
    };
  }

  return baseSchema;
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateProductSchema(
  name: string,
  description: string,
  image: string,
  price: string,
  currency: string = 'USD'
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '127',
    },
  };
}
