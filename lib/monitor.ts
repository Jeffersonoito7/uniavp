/**
 * Centralizador de captura de erros.
 * Envia para Sentry se NEXT_PUBLIC_SENTRY_DSN estiver configurado.
 * Sempre loga no console como fallback.
 *
 * Setup Sentry (gratuito):
 *   1. Crie projeto em sentry.io (Next.js)
 *   2. Adicione ao .env.local:
 *      NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
 */

import * as Sentry from '@sentry/nextjs'
import { createLogger } from '@/lib/logger'

const log = createLogger('monitor')

export type ErrorContext = {
  endpoint?: string
  tenantId?: string
  userId?: string
  extra?: Record<string, unknown>
}

export function captureException(error: unknown, context?: ErrorContext) {
  const err = error instanceof Error ? error : new Error(String(error))

  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope(scope => {
      if (context?.endpoint) scope.setTag('endpoint', context.endpoint)
      if (context?.tenantId) scope.setTag('tenant_id', context.tenantId)
      if (context?.userId) scope.setUser({ id: context.userId })
      if (context?.extra) scope.setExtras(context.extra)
      Sentry.captureException(err)
    })
  }

  log.error(err.message, { endpoint: context?.endpoint, tenantId: context?.tenantId, ...context?.extra })
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext) {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.withScope(scope => {
      if (context?.tenantId) scope.setTag('tenant_id', context.tenantId)
      if (context?.userId) scope.setUser({ id: context.userId })
      Sentry.captureMessage(message, level)
    })
  }

  if (level === 'error') log.error(message)
  else if (level === 'warning') log.warn(message)
  else log.info(message)
}
