import { motion } from 'motion/react';
import Image from 'next/image';
import loadingBanner from '@/src/assets/images/loading_banner_1780908269460.png';

export function LoadingView() {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen relative flex items-center justify-center bg-background"
    >
      <div className="absolute inset-0 z-0">
        <Image 
          src={loadingBanner}
          alt="Loading Background" 
          fill 
          className="object-cover opacity-40 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="font-display text-5xl md:text-7xl font-bold text-primary tracking-widest drop-shadow-2xl">
          CINEMATIC
        </h1>
        <div className="mt-8 flex gap-2">
          <motion.div 
            className="w-3 h-3 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0 }}
          />
          <motion.div 
            className="w-3 h-3 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div 
            className="w-3 h-3 bg-primary rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
          />
        </div>
      </div>
    </motion.div>
  );
}
