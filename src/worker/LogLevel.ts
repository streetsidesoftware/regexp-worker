export enum LogLevel {
    LogLevelNone = 0,
    LogLevelError = 1,
    LogLevelWarn = 2,
    LogLevelInfo = 3,
    LogLevelDebug = 4,
}

export type LogParams = Parameters<typeof console.log>;
