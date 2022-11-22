import * as core from '@actions/core';
import {wait} from './utils/wait';

export interface RetryConfig {
    // Retries count
    retries: number;

    // Wait interval in ms between retries
    waitInterval: number;

    // An array of error codes to check if retry should not be applied
    skipErrorCodes: number[];

    // Retry the request until the asynchronous action finish
    // Should be used to check the status of the asynchronous operation (build, pre-translate, report generation, etc.)
    retryUntilFinished?: boolean;
}

/**
 * @internal
 */
export class RetryService {
    constructor(private config: RetryConfig) {}

    /**
     * @param func function to execute
     */
    async executeAsyncFunc<T>(func: () => Promise<T>): Promise<T> {
        let i = 0;

        while (true) {
            i++;

            try {
                const response = await func();

                if (this.shouldRetryOnSuccessResponse(response)) {
                    core.info(`Retrying the successful request (${i})`);

                    await wait(this.config.waitInterval);

                    continue;
                }

                return response;
            } catch (error: any) {
                if (!this.shouldRetryOnErrorResponse(error, i)) {
                    throw error;
                }

                core.warning(`An error occurred, retrying the request. Message: ${error.message}`);

                await wait(this.config.waitInterval);
            }
        }
    }

    private shouldRetryOnSuccessResponse(response: any): boolean {
        if (!this.config.retryUntilFinished || !response.data.data.status) {
            return false;
        }

        return !['finished', 'canceled', 'failed'].includes(response.data.data.status.toLowerCase());
    }

    private shouldRetryOnErrorResponse(error: any, retry: number): boolean {
        let skip = false;

        if (this.config.skipErrorCodes.includes(error.code)) {
            skip = true;
        }

        return !(skip || retry >= this.config.retries);
    }
}
