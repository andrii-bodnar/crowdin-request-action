import * as core from '@actions/core';
import * as dotenv from 'dotenv';
import * as util from 'util';
import * as yaml from 'js-yaml';
import {CredentialsConfig, Requester} from './requester';
import {Method} from 'axios';
import {RetryConfig} from './retry';

dotenv.config();

async function run(): Promise<void> {
    try {
        let credentialsConfig: CredentialsConfig = {
            token: '',
            organization: ''
        };

        if (process.env.CROWDIN_PERSONAL_TOKEN) {
            credentialsConfig.token = process.env.CROWDIN_PERSONAL_TOKEN;
            core.setSecret(String(credentialsConfig.token));
        }

        if (process.env.CROWDIN_ORGANIZATION) {
            credentialsConfig.organization = process.env.CROWDIN_ORGANIZATION;
        }

        validateCredentials(credentialsConfig);

        await makeRequest(credentialsConfig);
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
}

async function makeRequest(credentialsConfig: CredentialsConfig): Promise<void> {
    const requester = new Requester(credentialsConfig, getRetryConfig());

    const route = core.getInput('route');
    const body = core.getInput('body');
    const query = core.getInput('query');
    const headers = core.getMultilineInput('headers');

    body && requester.setBody(body);
    query && requester.setQuery(query);
    headers && requester.setHeaders(headers);

    const parameters: Map<string, any> = getPathParameterInputs();
    const [method, request] = route.split(' ');

    if (!method || !request) {
        throw Error("Can't extract method and request from the 'route' parameter value!");
    }

    if (['GET'].includes(method.toUpperCase()) && body) {
        core.warning(`The '${method}' method can't be used with the 'body' parameter!`);
    }

    if (['POST', 'PATCH', 'PUT'].includes(method.toUpperCase()) && query) {
        core.warning(`The '${method}' method can't be used with the 'query' parameter!`);
    }

    await requester.request(<Method>method, request, parameters);

    setOutputs(requester);
}

function getPathParameterInputs(): Map<string, any> {
    let parameters = new Map<string, any>();

    Object.entries(process.env).map(([key, value]) => {
        if (!/^INPUT_/.test(key)) return;

        const inputName = key.substr('INPUT_'.length).toLowerCase();
        const inputValue = yaml.load(String(value));

        // We need only the path parameters with values
        if (['route', 'body', 'query', 'headers'].includes(inputName) || inputValue === undefined) {
            return;
        }

        try {
            parameters.set(inputName, inputValue);
        } catch (e) {
            core.debug(util.inspect(e, true, 8));
            throw Error(`Unexpected input parameter ${inputName} or value ${inputValue}!`);
        }
    });

    return parameters;
}

function getRetryConfig(): RetryConfig {
    const retries = +core.getInput('retries');
    const waitInterval = +core.getInput('wait_interval');
    const skipErrorCodes = core.getInput('skip_error_codes');
    const retryUntilFinished = core.getInput('retry_until_finished') === 'true';

    return {
        retries: retries ?? 0,
        waitInterval: waitInterval ?? 1000,
        skipErrorCodes: skipErrorCodes
            ? skipErrorCodes.split(',').map((code: string) => {
                  return +code.trim();
              })
            : [],
        retryUntilFinished: retryUntilFinished
    };
}

function setOutputs(requester: Requester): void {
    core.setOutput('code', requester.getResponseStatusCode());
    core.setOutput('headers', requester.getResponseHeaders());
    core.setOutput('data', requester.getData());
}

function validateCredentials(credentialsConfig: CredentialsConfig): void {
    if (credentialsConfig.token) {
        return;
    }

    let missingVariables = [];

    if (!credentialsConfig.token) {
        missingVariables.push('CROWDIN_PERSONAL_TOKEN');
    }

    throw Error('Missing environment variable(s): ' + missingVariables.join(', '));
}

run();
