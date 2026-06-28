/// <reference types="vite/client" />
import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
  type ErrorComponentProps,
} from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';

import { envConfigs } from '@/config';
import { getQueryClient } from '@/lib/query-client';
import { getLocale, locales, localizeUrl } from '@/paraglide/runtime.js';
import { usePublicConfig } from '@/hooks/use-public-config';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { Plausible } from '@/components/analytics/plausible';
import { Toaster } from '@/components/ui/sonner';

import '@fontsource-variable/inter';
import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@/styles/globals.css';

export const Route = createRootRoute({
  head: () => {
    // head() runs on the SSR server AND again on the client during hydration.
    // On the client, app_url falls back to the localhost dev default when
    // VITE_APP_URL wasn't inlined into the client bundle at build — which would
    // emit a second, localhost set of hreflang links. Prefer the live origin
    // on the client so it always matches; the server uses the configured URL.
    const appUrl =
      (typeof window !== 'undefined' && window.location?.origin) ||
      envConfigs.app_url ||
      '';
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { title: envConfigs.app_name },
        { name: 'description', content: envConfigs.app_description },
      ],
      links: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        ...locales.map((loc) => ({
          rel: 'alternate',
          hrefLang: loc,
          href: localizeUrl(`${appUrl}/`, { locale: loc }).href,
        })),
      ],
    };
  },
  component: RootComponent,
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
  errorComponent: RootError,
});

function RootComponent() {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <Outlet />
        <AnalyticsScripts />
        <Toaster position="top-center" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AnalyticsScripts() {
  const { data: configs } = usePublicConfig();
  const googleAnalyticsId = configs?.google_analytics_id?.trim();
  const plausibleDomain = configs?.plausible_domain?.trim();
  const plausibleSrc = configs?.plausible_src?.trim();

  return (
    <>
      {googleAnalyticsId ? (
        <GoogleAnalytics measurementId={googleAnalyticsId} />
      ) : null}
      {plausibleDomain ? (
        <Plausible domain={plausibleDomain} src={plausibleSrc || undefined} />
      ) : null}
    </>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang={getLocale()} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <a href="/" className="text-sm underline underline-offset-4">
        Back to home
      </a>
    </div>
  );
}

function RootError({ error, reset }: ErrorComponentProps) {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Oops</h1>
      <p className="text-muted-foreground">
        Something went wrong. Please try again.
      </p>
      {import.meta.env.DEV && error instanceof Error && (
        <pre className="bg-muted mt-2 max-w-lg overflow-auto rounded p-4 text-xs">
          {error.message}
        </pre>
      )}
      <button
        type="button"
        onClick={reset}
        className="text-sm underline underline-offset-4"
      >
        Try again
      </button>
    </div>
  );
}
