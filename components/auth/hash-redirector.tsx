'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HashRedirector() {
  const router = useRouter();

  useEffect(() => {
    // This effect will only run in the browser
    if (typeof window === 'undefined') return;

    // Check if we have a hash that might contain auth tokens
    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return;

    // Check if it contains auth tokens but we're not on the reset-password page
    if (hash.includes('access_token=') && 
        !window.location.pathname.includes('/reset-password')) {
      console.log('Found auth token in hash, redirecting to reset-password');
      
      // Preserve the hash when redirecting
      const resetUrl = `/reset-password${hash}`;
      
      // Use the router to navigate
      router.push(resetUrl);
    }
  }, [router]);

  // This component doesn't render anything visible
  return null;
} 