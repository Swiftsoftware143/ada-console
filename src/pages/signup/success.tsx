// ADASwift Sign-Up Success Handler
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { VALID_PLANS, SYSTEM_TAG } from '../../types';

export default function SignupSuccessPage(): JSX.Element {
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Creating your account...');
  const [userData, setUserData] = useState<{ email: string; plan: string } | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const { email, plan, customer_id, status: paymentStatus } = router.query;

    if (paymentStatus !== 'success') {
      setStatus('error');
      setMessage('Payment was not successful. Please try again.');
      return;
    }

    if (!email || !plan || !customer_id) {
      setStatus('error');
      setMessage('Missing required information. Please try signing up again.');
      return;
    }

    if (!VALID_PLANS.includes(plan as any)) {
      setStatus('error');
      setMessage('Invalid plan selected. Please try again.');
      return;
    }

    setUserData({ email: email as string, plan: plan as string });
    createUserAccount(email as string, plan as string, customer_id as string);
  }, [router.isReady, router.query]);

  const createUserAccount = async (email: string, plan: string, customerId: string): Promise<void> => {
    try {
      const response = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, planId: plan, mintbirdCustomerId: customerId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create account');

      setStatus('success');
      setMessage('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <>
      <Head>
        <title>ADASwift - Setting Up Your Account</title>
      </Head>
      
      <div style={styles.container}>
        <div style={styles.card}>
          {status === 'processing' && <div style={styles.spinner} />}
          
          <h1 style={styles.title}>
            {status === 'success' ? '🎉 Welcome to ADASwift!' : 
             status === 'error' ? '❌ Something Went Wrong' : 
             'Setting Up Your Account'}
          </h1>
          
          <p style={styles.message}>{message}</p>
          
          {status === 'success' && userData && (
            <div style={styles.details}>
              <p><strong>Email:</strong> {userData.email}</p>
              <p><strong>Plan:</strong> {userData.plan.charAt(0).toUpperCase() + userData.plan.slice(1)}</p>
              <p><strong>System Tag:</strong> <code style={styles.code}>{SYSTEM_TAG}</code></p>
            </div>
          )}
          
          {status === 'error' && (
            <>
              <Link href="/signup" style={styles.button}>Back to Sign Up</Link>
              <p style={styles.loginText}>
                Already have an account?{' '}
                <Link href="/login" style={styles.loginLink}>Log in here</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    padding: '50px',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '500px',
    width: '100%',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #007bff',
    borderRadius: '50%',
    margin: '0 auto 20px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
  },
  message: {
    fontSize: '18px',
    color: '#666',
    marginBottom: '30px',
  },
  details: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'left',
    marginBottom: '20px',
  },
  code: {
    backgroundColor: '#e9ecef',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  button: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '20px',
  },
  loginText: {
    fontSize: '14px',
    color: '#666',
  },
  loginLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};
