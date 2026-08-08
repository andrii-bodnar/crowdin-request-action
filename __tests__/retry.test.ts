import {expect, test} from '@jest/globals';
import {RetryService} from '../src/retry';

jest.mock('@actions/core');
jest.mock('../src/utils/wait', () => ({
    wait: jest.fn().mockResolvedValue('done')
}));

test('executeAsyncFunc returns response on first success', async () => {
    const mockFunc = jest.fn().mockResolvedValue({data: 'success'});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: []
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: 'success'});
    expect(mockFunc).toHaveBeenCalledTimes(1);
});

test('executeAsyncFunc retries on error and eventually succeeds', async () => {
    const mockFunc = jest.fn()
        .mockRejectedValueOnce({message: 'Error', code: 500})
        .mockResolvedValue({data: 'success'});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: []
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: 'success'});
    expect(mockFunc).toHaveBeenCalledTimes(2);
});

test('executeAsyncFunc throws error when retries are exhausted', async () => {
    const errorObj = {message: 'Error', code: 500};
    const mockFunc = jest.fn().mockRejectedValue(errorObj);
    const service = new RetryService({
        retries: 2,
        waitInterval: 0,
        skipErrorCodes: []
    });
    await expect(service.executeAsyncFunc(mockFunc)).rejects.toEqual(errorObj);
    expect(mockFunc).toHaveBeenCalledTimes(3);
});

test('executeAsyncFunc skips retry for error codes in skipErrorCodes', async () => {
    const errorObj = {message: 'Error', code: 400};
    const mockFunc = jest.fn().mockRejectedValue(errorObj);
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: [400]
    });
    await expect(service.executeAsyncFunc(mockFunc)).rejects.toEqual(errorObj);
    expect(mockFunc).toHaveBeenCalledTimes(1);
});

test('executeAsyncFunc retries on pending status when retryUntilFinished is true', async () => {
    const mockFunc = jest.fn()
        .mockResolvedValueOnce({data: {data: {status: 'created'}}})
        .mockResolvedValue({data: {data: {status: 'finished'}}});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: [],
        retryUntilFinished: true
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: {data: {status: 'finished'}}});
    expect(mockFunc).toHaveBeenCalledTimes(2);
});

test('executeAsyncFunc stops retrying on finished status when retryUntilFinished is true', async () => {
    const mockFunc = jest.fn().mockResolvedValue({data: {data: {status: 'finished'}}});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: [],
        retryUntilFinished: true
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: {data: {status: 'finished'}}});
    expect(mockFunc).toHaveBeenCalledTimes(1);
});

test('executeAsyncFunc stops retrying on canceled status when retryUntilFinished is true', async () => {
    const mockFunc = jest.fn().mockResolvedValue({data: {data: {status: 'canceled'}}});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: [],
        retryUntilFinished: true
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: {data: {status: 'canceled'}}});
    expect(mockFunc).toHaveBeenCalledTimes(1);
});

test('executeAsyncFunc stops retrying on failed status when retryUntilFinished is true', async () => {
    const mockFunc = jest.fn().mockResolvedValue({data: {data: {status: 'failed'}}});
    const service = new RetryService({
        retries: 3,
        waitInterval: 0,
        skipErrorCodes: [],
        retryUntilFinished: true
    });
    const result = await service.executeAsyncFunc(mockFunc);
    expect(result).toEqual({data: {data: {status: 'failed'}}});
    expect(mockFunc).toHaveBeenCalledTimes(1);
});
