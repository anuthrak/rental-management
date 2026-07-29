import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'

import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/components/i18n-provider'
import { SimpleModeEffect } from '@/components/simple-mode-effect'
import { MobileNav } from '@/components/mobile-nav'
import { TutorialSheet } from '@/components/tutorial-sheet'
import { Toaster } from '@/components/ui/sonner'
import { isDemoMode } from '@/lib/auth/session'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RentLedger — Utility & Rent Invoicing',
  description:
    'Create itemized rent and utility invoices for tenants, preview them live, save your history, and export to PDF or image.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f2ea' },
    { media: '(prefers-color-scheme: dark)', color: '#1f1d1a' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const demoMode = await isDemoMode()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable} bg-background`}
    >
      <body className="flex min-h-dvh flex-col font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <I18nProvider>
            <SimpleModeEffect />
            <div className="flex flex-1 flex-col pb-mobile-nav">{children}</div>
            <MobileNav isDemoMode={demoMode} />
            <TutorialSheet />
            <Toaster richColors position="top-center" />
          </I18nProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
