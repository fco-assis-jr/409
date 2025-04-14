import '../css/app.css'

import { createInertiaApp } from '@inertiajs/react'
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { initializeTheme } from './hooks/use-appearance'
import { Toaster } from '@/components/ui/sonner'

const appName = import.meta.env.VITE_APP_NAME || 'Laravel'

createInertiaApp({
  title: (title) => `${title} ${appName}`,
  resolve: (name) =>
    resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
  setup({ el, App, props }) {
    const root = createRoot(el)

    root.render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <>
          <App {...props} />
          <Toaster richColors closeButton position="top-right" />
        </>
      </ThemeProvider>
    )
  },
  progress: {
    color: '#4B5563',
  },
})

initializeTheme()
