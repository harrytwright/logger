/**
 * Very basic d.ts file
 * */

import { EventEmitter } from 'events'
import { WriteStream } from "tty";

export type LogLevels = 'silly' | 'verbose' | 'info' | 'timing' | 'http' | 'notice' | 'warn' | 'error' | 'silent'

export interface LogContext {
    id: number
    level: LogLevels
    message: string
    namespace: string
    context: object
}

/**
 * Log any message with the silly level to the stream
 * */
declare function silly(namespace: string, context: object, ...message: any[]): void
declare function silly(namespace: string, ...message: any[]): void

/**
 * Log any message with the verbose level to the stream
 * */
declare function verbose(namespace: string, context: object, ...message: any[]): void
declare function verbose(namespace: string, ...message: any[]): void

/**
 * Log any message with the info level to the stream
 * */
declare function info(namespace: string, context: object, ...message: any[]): void
declare function info(namespace: string, ...message: any[]): void

/**
 * Log any message with the timing level to the stream
 * */
declare function timing(namespace: string, context: object, ...message: any[]): void
declare function timing(namespace: string, ...message: any[]): void

/**
 * Log any message with the http level to the stream
 * */
declare function http(namespace: string, context: object, ...message: any[]): void
declare function http(namespace: string, ...message: any[]): void

/**
 * Log any message with the notice level to the stream
 * */
declare function notice(namespace: string, context: object, ...message: any[]): void
declare function notice(namespace: string, ...message: any[]): void

/**
 * Log any message with the warn level to the stream
 * */
declare function warn(namespace: string, context: object, ...message: any[]): void
declare function warn(namespace: string, ...message: any[]): void

/**
 * Log any message with the error level to the stream
 * */
declare function error(namespace: string, context: object, ...message: any[]): void
declare function error(namespace: string, error: Error, ...message: any[]): void
declare function error(namespace: string, ...message: any[]): void

/**
 * Log any message with the silent level to the stream
 * */
declare function silent(namespace: string, context: object, ...message: any[]): void
declare function silent(namespace: string, ...message: any[]): void

/**
 * Set any configuration value
 * */
declare function set(key: 'app', value: string): any
declare function set(key: 'redact', value: boolean): any
declare function set(key: 'level', value: LogLevels): any
declare function set(key: 'stream', value: WriteStream): any
declare function set(key: 'maxRecordSize', value: number): any

/**
 * Get any configuration value
 * */
declare function get(key: 'app'): string
declare function get(key: 'redact'): boolean
declare function get(key: 'level'): LogLevels
declare function get(key: 'stream'): WriteStream
declare function get(key: 'maxRecordSize'): number

/**
 * Pause the logger, saving all messages inside the buffer for when it is restarted
 * */
declare function pause(): void

/**
 * Restart the logger, pushing out the buffered messages first
 * */
declare function resume(): void

/**
 * Set/Get the log level
 * */
declare let level: LogLevels

/**
 * Set/Get the loggers name
 * */
declare let app: string

/**
 * Set/Get if the logger is redacting
 * */
declare let redact: boolean

/**
 * Set/Get the stream
 * */
declare let stream: WriteStream

/**
 * Access the loggers record
 * */
declare let record: LogContext[]

/**
 * Add a custom redaction function to the fold
 *
 * @note This is new and experimental for custom redactions, use at your own risk
 * */
declare function redaction(fn: (value: any, redaction: string) => string): void

/**
 * The main log class
 * */
declare class Log extends EventEmitter {
    // Max size of the record
    static maxRecordSize: number

    // The application now for the logger
    app: string

    // If the application is redacting or not
    redact: boolean

    // The logging level
    level: LogLevels

    // The stream the log uses
    stream: WriteStream

    // The record holder for the logger
    record: any[]

    constructor(app?: string, level?: LogLevels)

    // Pause the logger
    pause(): void

    // Start the logger back up
    resume(): void

    /**
     * Log any message with the 'silly' level to the stream
     * */
    silly(namespace: string, context: object, ...message: any[]): void
    silly(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'verbose' level to the stream
     * */
    verbose(namespace: string, context: object, ...message: any[]): void
    verbose(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'info' level to the stream
     * */
    info(namespace: string, context: object, ...message: any[]): void
    info(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'timing' level to the stream
     * */
    timing(namespace: string, context: object, ...message: any[]): void
    timing(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'http' level to the stream
     * */
    http(namespace: string, context: object, ...message: any[]): void
    http(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'notice' level to the stream
     * */
    notice(namespace: string, context: object, ...message: any[]): void
    notice(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'warn' level to the stream
     * */
    warn(namespace: string, context: object, ...message: any[]): void
    warn(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'error' level to the stream
     * */
    error(namespace: string, context: object, ...message: any[]): void
    error(namespace: string, error: Error, ...message: any[]): void
    error(namespace: string, ...message: any[]): void

    /**
     * Log any message with the 'silent' level to the stream
     * */
    silent(namespace: string, context: object, ...message: any[]): void
    silent(namespace: string, ...message: any[]): void

    set(key: 'app', value: string): any
    set(key: 'redact', value: boolean): any
    set(key: 'level', value: LogLevels): any
    set(key: 'stream', value: WriteStream): any
    set(key: 'maxRecordSize', value: number): any

    get(key: 'app'): string
    get(key: 'redact'): boolean
    get(key: 'level'): LogLevels
    get(key: 'stream'): WriteStream
    get(key: 'maxRecordSize'): number

    /**
     * Add redactions to the loggers
     * */
    redaction(fn: (value: any, redaction: string) => string): void
}

