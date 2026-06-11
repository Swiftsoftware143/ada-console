// ADASwift - App Entry Point with Dynamic SEO
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import '../styles/globals.css';
import { SEOSettings, DEFAULT_SEO } from '../types/seo';
import { generateSchemaMarkup } from '../lib/seo';

export default function App({ Component, pageProps }: AppProps) {
  const [seoSettings, setSeoSettings] = useState<SEOSettings>(DEFAULT_SEO as SEOSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSEOSettings();
  }, []);

  const fetchSEOSettings = async () => {
    try {
      const response = await fetch('/api/seo-settings');
      if (response.ok) {
        const data = await response.json();
        setSeoSettings({ ...DEFAULT_SEO, ...data } as SEOSettings);
      }
    } catch (error) {
      console.error('Failed to fetch SEO settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const schemaMarkup = generateSchemaMarkup(seoSettings, 'home');

  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#10b981" />
        
        <title>{seoSettings.site_name}</title>
        <meta name="description" content={seoSettings.site_description} />
        <meta name="keywords" content={seoSettings.site_keywords} />
        <meta name="author" content={seoSettings.company_name || seoSettings.site_name} />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        
        <link rel="canonical" href={seoSettings.site_url} />
        
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={seoSettings.site_name} />
        <meta property="og:title" content={seoSettings.site_name} />
        <meta property="og:description" content={seoSettings.site_description} />
        <meta property="og:url" content={seoSettings.site_url} />
        <meta property="og:image" content={`${seoSettings.site_url}${seoSettings.og_image}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        {seoSettings.facebook_app_id && (
          <meta property="fb:app_id" content={seoSettings.facebook_app_id} />
        )}
        
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content={seoSettings.twitter_handle} />
        <meta name="twitter:creator" content={seoSettings.twitter_handle} />
        <meta name="twitter:title" content={seoSettings.site_name} />
        <meta name="twitter:description" content={seoSettings.site_description} />
        <meta name="twitter:image" content={`${seoSettings.site_url}${seoSettings.og_image}`} />
        
        {seoSettings.google_site_verification && (
          <meta name="google-site-verification" content={seoSettings.google_site_verification} />
        )}
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {!loading && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }}
          />
        )}
      </Head>
      <Component {...pageProps} />
    </>
  );
}
