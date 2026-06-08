'use client';

import { useEffect } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('client');

export function LogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    log.info('app mounted', {
      href: window.location.href,
      userAgent: navigator.userAgent.slice(0, 80),
    });

    const onError = (event: ErrorEvent) => {
      log.error('uncaught error', event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      log.error('unhandled rejection', event.reason, {
        type: 'unhandledrejection',
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return <>{children}</>;
}
