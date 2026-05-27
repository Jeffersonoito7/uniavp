type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogEntry = {
  level: LogLevel
  module: string
  msg: string
  ts: string
  [key: string]: unknown
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

function activeLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel | undefined
  if (env && env in LEVEL_ORDER) return env
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

function emit(level: LogLevel, module: string, msg: string, extra?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < LEVEL_ORDER[activeLevel()]) return

  const entry: LogEntry = { level, module, msg, ts: new Date().toISOString(), ...extra }

  if (process.env.NODE_ENV === 'production') {
    const output = JSON.stringify(entry)
    if (level === 'error') process.stderr.write(output + '\n')
    else process.stdout.write(output + '\n')
  } else {
    const prefix = `[${level.toUpperCase()}] [${module}]`
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(prefix, msg, extra ?? '')
  }
}

export function createLogger(module: string) {
  return {
    debug: (msg: string, extra?: Record<string, unknown>) => emit('debug', module, msg, extra),
    info:  (msg: string, extra?: Record<string, unknown>) => emit('info',  module, msg, extra),
    warn:  (msg: string, extra?: Record<string, unknown>) => emit('warn',  module, msg, extra),
    error: (msg: string, extra?: Record<string, unknown>) => emit('error', module, msg, extra),
  }
}
