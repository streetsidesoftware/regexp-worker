export class TimeoutError extends Error {
    message: string;
    elapsedTimeMs: number;
    constructor(message: string, elapsedTimeMs: number) {
        super(message);
        this.name = 'TimeoutError';
        this.message = message;
        this.elapsedTimeMs = elapsedTimeMs;
    }
}
