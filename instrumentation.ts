export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnv } = await import('./lib/env')
    validateEnv()

    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      await import('./sentry.server.config')
    }
  }
  if (process.env.NEXT_RUNTIME === 'edge' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    await import('./sentry.edge.config')
  }
}
