// lib/utils/logger.ts
// Simple logging utility for API routes

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    data?: any
    userId?: string
    route?: string
}

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development'

    private formatLog(entry: LogEntry): string {
        const { timestamp, level, message, route, userId, data } = entry
        let log = `[${timestamp}] [${level.toUpperCase()}]`

        if (route) log += ` [${route}]`
        if (userId) log += ` [User: ${userId}]`
        log += ` ${message}`

        if (data && this.isDevelopment) {
            log += `\n${JSON.stringify(data, null, 2)}`
        }

        return log
    }

    private log(level: LogLevel, message: string, data?: any, meta?: { userId?: string; route?: string }) {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data,
            ...meta,
        }

        const formattedLog = this.formatLog(entry)

        // In production, you would send this to a logging service
        // For now, just console log
        switch (level) {
            case 'error':
                console.error(formattedLog)
                break
            case 'warn':
                console.warn(formattedLog)
                break
            case 'debug':
                if (this.isDevelopment) console.debug(formattedLog)
                break
            default:
                console.log(formattedLog)
        }

        // TODO: Send to external logging service (e.g., Sentry, LogRocket, etc.)
    }

    info(message: string, data?: any, meta?: { userId?: string; route?: string }) {
        this.log('info', message, data, meta)
    }

    warn(message: string, data?: any, meta?: { userId?: string; route?: string }) {
        this.log('warn', message, data, meta)
    }

    error(message: string, error?: any, meta?: { userId?: string; route?: string }) {
        this.log('error', message, error, meta)
    }

    debug(message: string, data?: any, meta?: { userId?: string; route?: string }) {
        this.log('debug', message, data, meta)
    }

    // API request logger
    apiRequest(route: string, method: string, userId?: string) {
        this.info(`API Request: ${method} ${route}`, undefined, { userId, route })
    }

    // API response logger
    apiResponse(route: string, method: string, status: number, duration: number, userId?: string) {
        const level = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info'
        this.log(level, `API Response: ${method} ${route} - ${status} (${duration}ms)`, undefined, { userId, route })
    }

    // API error logger
    apiError(route: string, method: string, error: any, userId?: string) {
        this.error(`API Error: ${method} ${route}`, error, { userId, route })
    }
}

export const logger = new Logger()
