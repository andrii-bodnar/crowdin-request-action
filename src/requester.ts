import * as core from '@actions/core';
import crowdin from '@crowdin/crowdin-api-client';
import axios, {
    AxiosError,
    AxiosRequestConfig,
    AxiosResponse,
    AxiosResponseHeaders,
    Method,
    RawAxiosResponseHeaders
} from 'axios';
import {addQueryParameters} from './utils/add-query-parameters';
import normalizeUrl from 'normalize-url';
import {replacePathParameters} from './utils/replace-path-parameters';
import * as util from 'util';
import * as fs from 'fs';
import {RetryConfig, RetryService} from './retry';

export interface CredentialsConfig {
    token: string;
    organization?: string;
}

export class Requester {
    private credentialsConfig: CredentialsConfig;
    private body: any;
    private query: Record<string, any> | undefined;
    private headers: string[] | undefined;
    private crowdinClient: crowdin;
    private retryService: RetryService;

    private responseStatusCode: number | undefined;
    private responseHeaders: RawAxiosResponseHeaders | AxiosResponseHeaders | undefined;
    private data?: any;

    constructor(credentials: CredentialsConfig, retryConfig?: RetryConfig) {
        this.credentialsConfig = credentials;
        this.crowdinClient = new crowdin(credentials);

        if (!retryConfig) {
            retryConfig = {
                waitInterval: 0,
                retries: 0,
                skipErrorCodes: []
            };
        }

        this.retryService = new RetryService(retryConfig);
    }

    public setBody(body: any): void {
        this.body = body;
    }

    public setQuery(query: string): void {
        this.query = JSON.parse(query);
    }

    public setHeaders(headers: string[]): void {
        this.headers = headers;
    }

    public getResponseStatusCode(): number {
        return this.responseStatusCode as number;
    }

    public getData(): any {
        return this.data;
    }

    public getResponseHeaders(): RawAxiosResponseHeaders | AxiosResponseHeaders | undefined {
        return this.responseHeaders;
    }

    public async request(method: Method, request: string, pathParams: Map<string, any>): Promise<any> {
        const requestUrl = this.getRequestUrl(request, pathParams);
        const isStorageAdding = method.toUpperCase() === 'POST' && ['/storages', 'storages'].includes(request);

        let contentType = 'application/json';

        if (this.body) {
            if (isStorageAdding) {
                contentType = 'application/octet-stream';

                if (this.headers?.length === 0) {
                    core.error('Probably the "Crowdin-API-FileName" header is missing in the request');
                }

                // In this case we are reading file content from the passed path
                // Otherwise we assume that the body contains the actual file content
                if (fs.statSync(this.body).isFile()) {
                    this.body = fs.readFileSync(this.body);
                }
            } else {
                this.body = JSON.parse(this.body);
            }
        }

        const requestConfig = this.getRequestConfig(contentType);

        core.startGroup('Request');
        core.info(requestUrl);
        this.debugObject(requestConfig);
        this.query && this.debugObject(this.query);
        this.body && !isStorageAdding && this.debugObject(this.body);
        core.endGroup();

        try {
            let response: AxiosResponse;

            switch (method.toUpperCase()) {
                case 'GET':
                    response = await this.get(requestUrl, requestConfig);
                    break;
                case 'POST':
                    response = await this.post(requestUrl, this.body, requestConfig);
                    break;
                case 'PUT':
                    response = await this.put(requestUrl, this.body, requestConfig);
                    break;
                case 'PATCH':
                    response = await this.patch(requestUrl, this.body, requestConfig);
                    break;
                case 'DELETE':
                    response = await this.delete(requestUrl, requestConfig);
                    break;
                default:
                    core.warning(`Unsupported request method: ${method}`);
                    return;
            }

            this.responseStatusCode = response.status;
            this.responseHeaders = response.headers;
            this.data = response.data;

            core.startGroup('Response');
            this.debugObject(this.data);
            core.endGroup();

            return this.data;
        } catch (e: any) {
            if (core.isDebug() && e.response?.data) {
                core.error(util.inspect(e.response.data, false, 16));
            }

            if (e instanceof AxiosError) {
                this.responseStatusCode = e.status as number;
                throw Error(`An error occurred while making request! Message: ${e.message}`);
            }

            throw e;
        }
    }

    protected getRequestUrl(request: string, params: Map<string, any>) {
        let url = `${this.crowdinClient.languagesApi.url}/${replacePathParameters(request, params)}`;

        if (this.query) {
            url = addQueryParameters(url, this.query);
        }

        return normalizeUrl(url);
    }

    protected getRequestConfig(contentType: string) {
        let headers = new Map<string, any>();

        this.headers?.map(header => {
            const [headerName, value] = header.split(': ');

            if (!headerName || !value) {
                core.warning(`Can't parse the passed Header: ${header}`);
                return;
            }

            headers.set(headerName, value);
        });

        return {
            headers: {
                'Content-Type': contentType,
                'User-Agent': `crowdin-request-action/0.0.1 axios/${axios.VERSION}`,
                Authorization: `Bearer ${this.credentialsConfig.token}`,
                ...Object.fromEntries(headers)
            }
        };
    }

    protected async get(url: string, config: AxiosRequestConfig) {
        return await this.retryService.executeAsyncFunc(() => axios.get(url, config));
    }

    protected async post(url: string, data?: unknown, config?: AxiosRequestConfig) {
        return await this.retryService.executeAsyncFunc(() => axios.post(url, data, config));
    }

    protected async put(url: string, data?: unknown, config?: AxiosRequestConfig) {
        return await this.retryService.executeAsyncFunc(() => axios.put(url, data, config));
    }

    protected async patch(url: string, data?: unknown, config?: AxiosRequestConfig) {
        return await this.retryService.executeAsyncFunc(() => axios.patch(url, config));
    }

    protected async delete(url: string, config: AxiosRequestConfig) {
        return await this.retryService.executeAsyncFunc(() => axios.delete(url, config));
    }

    protected debugObject(data: unknown): void {
        core.info(util.inspect(data, false, 32));
    }
}
