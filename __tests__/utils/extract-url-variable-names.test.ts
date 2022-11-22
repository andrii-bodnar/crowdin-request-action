import {expect, test} from '@jest/globals';
import {extractUrlVariableNames} from '../../src/utils/extract-url-variable-names';

test('extractUrlVariableNames', async () => {
    const data = [
        {
            input: '/projects/{projectId}',
            expected: ['projectId']
        },
        {
            input: '/projects/{projectId}/strings',
            expected: ['projectId']
        },
        {
            input: '/projects/{projectId}/strings/{stringId}',
            expected: ['projectId', 'stringId']
        },
        {
            input: '/projects/{projectId}/reports/settings-templates/{reportSettingsTemplateId}',
            expected: ['projectId', 'reportSettingsTemplateId']
        },
        {
            input: '/projects',
            expected: []
        }
    ];

    data.forEach(dataset => {
        const result = extractUrlVariableNames(dataset.input);

        expect(result).toStrictEqual(dataset.expected);
    });
});
