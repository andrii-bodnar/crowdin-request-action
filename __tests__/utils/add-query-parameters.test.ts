import {expect, test} from '@jest/globals';
import {addQueryParameters} from '../../src/utils/add-query-parameters';

test('addQueryParameters', async () => {
    const data = [
        {
            url: 'https://api.crowdin.com/api/v2/projects',
            parameters: {
                userId: '1'
            },
            expected: 'https://api.crowdin.com/api/v2/projects?userId=1'
        },
        {
            url: 'https://api.crowdin.com/api/v2/projects',
            parameters: {
                userId: '1',
                limit: '10',
                offset: '0'
            },
            expected: 'https://api.crowdin.com/api/v2/projects?userId=1&limit=10&offset=0'
        }
    ];

    data.forEach(dataset => {
        const result = addQueryParameters(dataset.url, dataset.parameters);

        expect(result).toBe(dataset.expected);
    });
});
