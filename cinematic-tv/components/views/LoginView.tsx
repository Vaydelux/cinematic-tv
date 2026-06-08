'use client';

import { motion } from 'motion/react';
import { Mail, Lock, LogIn } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { auth, googleProvider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!auth || !googleProvider) throw new Error('Firebase sign-in is not configured.');
      await signInWithPopup(auth, googleProvider);
      onLogin();
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to log in with Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="relative flex min-h-screen items-center justify-center p-4 sm:p-6 md:justify-start md:px-20"
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?auto=format&fit=crop&q=80" 
          alt="Cinematic background" 
          fill 
          className="object-cover opacity-80"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/30" />
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full max-w-md rounded-lg cinema-panel cinema-ring p-5 sm:p-8 md:max-w-xl md:p-12"
      >
        <h1 className="mb-2 break-words font-display text-3xl font-bold uppercase tracking-tight text-primary drop-shadow sm:text-4xl md:text-5xl">Cinematic TV</h1>
        <p className="font-display text-lg md:text-xl text-on-surface-variant mb-6">Sign in to start watching.</p>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-5 md:gap-6">
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md border border-white/10 bg-white/[0.08] py-3.5 font-display text-base font-semibold text-on-surface shadow-lg transition-colors hover:bg-white/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 sm:py-4 md:text-xl"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 bg-white rounded-full">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
