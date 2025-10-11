import * as React from 'react'
import { createRootRoute, createRoute, createRouter, RouterProvider } from '@tanstack/react-router'
import { Outlet } from '@tanstack/react-router'
import { ThemeProvider } from '@/components/theme-provider'
import { SiteHeader } from '@/components/site-header'
import BackgroundField from '@/components/background/BackgroundField'
import TerminalHero from '@/components/terminal/TerminalHero'
import { ContactPage } from '@/components/contact/ContactPage'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
    </div>
  )
}

function Home() {
  return (
    <div className="relative min-h-screen">
      <BackgroundField />
      <section className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="w-full">
          <TerminalHero />
          <div className="mx-auto max-w-3xl mt-6 text-center text-sm opacity-80">
            <p>secure • curious • hands-on</p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Placeholder({ title }: { title: string }) {
  return (
    <section className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="opacity-80 mt-2">Static UI for now. We can add a Worker API later if needed.</p>
    </section>
  )
}

const rootRoute = createRootRoute({
  component: () => (
    <ThemeProvider>
      <Shell>
        <React.Suspense>
          <Outlet />
        </React.Suspense>
      </Shell>
    </ThemeProvider>
  ),
})

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Home })
const projectsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/projects', component: () => <Placeholder title="Projects" /> })
const labsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/labs', component: () => <Placeholder title="Labs" /> })
const writeupsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/writeups', component: () => <Placeholder title="Write-ups" /> })
const readingRoute = createRoute({ getParentRoute: () => rootRoute, path: '/reading', component: () => <Placeholder title="Reading" /> })
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', component: ContactPage })

const routeTree = rootRoute.addChildren([
  indexRoute,
  projectsRoute,
  labsRoute,
  writeupsRoute,
  readingRoute,
  contactRoute,
])

const router = createRouter({ routeTree })

export function App() {
  return <RouterProvider router={router} />
}
