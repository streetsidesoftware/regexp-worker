interface Worker {
    postMessage(message: any): void;
    terminate(): void;
}

declare function Worker(scriptURL: string): Worker;

export function supportsWebWorkers(): boolean {
    return typeof Worker !== 'undefined';
}
