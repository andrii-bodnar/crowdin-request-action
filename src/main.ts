import * as core from '@actions/core';
import * as dotenv from 'dotenv';
import {CredentialsConfig} from './config';

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
            core.setSecret(String(credentialsConfig.organization));
        }

        validateCredentials(credentialsConfig);

        core.info('Tada!');
    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message);
    }
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
