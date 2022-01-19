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
declare function error(namespace: string, ...message: any[]): void

/**
 * Log any message with the silent level to the stream
 * */
declare function silent(namespace: string, context: object, ...message: any[]): void
declare function silent(namespace: string, ...message: any[]): void

/**
 * Pause the logger, saving all messages inside the buffer for when it is restarted
 * */
declare function pause(): void

/**
 * Restart the logger, pushing out the buffered messages first
 * */
declare function restart(): void

/**
 * Set/Get the log level
 * */
declare let level: LogLevels

/**
 * Set/Get the loggers name
 * */
declare let app: string

/**
 * Set/Get the stream
 * */
declare let stream: WriteStream

/**
 * Access the loggers record
 * */
declare let record: LogContext[]

/**
 * The main log class
 * */
declare class Log extends EventEmitter {
    // Max size of the record
    static maxRecordSize: number

    // The application now for the logger
    app: string

    // The logging level
    level: LogLevels

    // The stream the log uses
    stream: WriteStream

    // The record holder for the logger
    record: any[]

    constructor(app: string, level: LogLevels)

    // Pause the logger
    pause(): void

    // Start the logger back up
    resume(): void
}

