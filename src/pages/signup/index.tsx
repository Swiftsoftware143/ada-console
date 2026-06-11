// ADASwift Sign-Up Page
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { PLANS } from '../../types';

const MINTBIRD_BASE = process.env.NEXT_PUBLIC_MINTBIRD_URL || 'https://mintbird.com/checkout';
const SUCCESS_URL = `${process.env.NEXT_PUBLIC_APP_URL}/signup/success`;

export default function SignupPage(): JSX.Element {
  const getCheckoutUrl = (planId: string): string => {
    return `${MINTBIRD_BASE}/${planId}?return=${encodeURIComponent(SUCCESS_URL)}&plan=${planId}`;
  };

  return (
    <>
      <Head>
        <title>ADASwift - Create Account</title>
        <meta name="description" content="Create your ADASwift account" />
      </Head>
      
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Create Your ADASwift Account</h1>
          <p style={styles.subtitle}>Choose a plan to get started</p>
          
          <div style={styles.plansContainer}>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                style={{
                  ...styles.plan,
                  ...(plan.featured ? styles.planFeatured : {}),
                }}
              >
                {plan.featured && <span style={styles.badge}>⭐ Most Popular</span>}
                <h2 style={styles.planName}>{plan.name}</h2>
                <div style={styles.price}>{plan.price}</div>
                <ul style={styles.featureList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} style={styles.feature}>{feature}</li>
                  ))}
                </ul>
                <a
                  href={getCheckoutUrl(plan.id)}
                  style={{
                    ...styles.button,
                    ...(plan.featured ? styles.buttonFeatured : {}),
                  }}
                >
                  Choose {plan.name}
                </a>
              </div>
            ))}
          </div>
          
          <div style={styles.loginSection}>
            <p style={styles.loginText}>
              Already have an account?{' '}
              <Link href="/login" style={styles.loginLink}>
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    padding: '50px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    maxWidth: '1000px',
    width: '100%',
  },
  title: {
    textAlign: 'center',
    fontSize: '36px',
    marginBottom: '10px',
  },
  subtitle: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#666',
    marginBottom: '40px',
  },
  plansContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  plan: {
    border: '2px solid #ddd',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    position: 'relative',
  },
  planFeatured: {
    borderColor: '#007bff',
    backgroundColor: '#f0f8ff',
    transform: 'scale(1.02)',
  },
  badge: {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffc107',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  planName: {
    fontSize: '24px',
    marginBottom: '10px',
  },
  price: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: '20px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    marginBottom: '30px',
  },
  feature: {
    padding: '8px 0',
    borderBottom: '1px solid #eee',
  },
  button: {
    display: 'inline-block',
    padding: '14px 40px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  buttonFeatured: {
    backgroundColor: '#28a745',
  },
  loginSection: {
    textAlign: 'center',
    paddingTop: '30px',
    borderTop: '1px solid #eee',
  },
  loginText: {
    fontSize: '16px',
    color: '#666',
  },
  loginLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
