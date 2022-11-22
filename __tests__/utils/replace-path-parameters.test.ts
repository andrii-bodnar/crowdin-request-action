import {expect, test} from '@jest/globals';
import {replacePathParameters} from '../../src/utils/replace-path-parameters';

test('replacePathParameters', async () => {
    const url = '/languages/{languageId}';
    let parameters = new Map<string, any>();

    parameters.set('languageId'.toLowerCase(), 'uk');

    expect(replacePathParameters(url, parameters)).toEqual('/languages/uk');
});

test('replacePathParameters few parameters', async () => {
    const url = '/projects/{projectId}/translations/builds/{buildId}/download';
    let parameters = new Map<string, any>();

    parameters.set('projectId'.toLowerCase(), '2');
    parameters.set('buildId'.toLowerCase(), '20');

    expect(replacePathParameters(url, parameters)).toEqual('/projects/2/translations/builds/20/download');
});

test('replacePathParameters no parameters', async () => {
    const url = '/projects';
    let parameters = new Map<string, any>();

    expect(replacePathParameters(url, parameters)).toEqual('/projects');
});
