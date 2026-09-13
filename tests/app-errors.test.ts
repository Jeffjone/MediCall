import { describe, expect, test } from 'bun:test';
import { errorMessage, errorStatus, retryRead } from '../src/lib/app-errors';

describe('safe recovery', () => {
  test.each([400,401,402,403,404,408,413,429,500,502,503,504])('classifies %s without exposing provider payload', status => {
    const message = errorMessage({status, responseBody:'{"message":"private-provider-secret"}'});
    expect(message).not.toContain('private-provider-secret');
    expect(message).not.toContain('Something went wrong');
  });
  test('handles network, timeouts, chunk errors and HTML', () => {
    expect(errorMessage(new Error('Failed to fetch'))).toContain('Connection lost');
    expect(errorMessage(new DOMException('expired','TimeoutError'))).toContain('too long');
    expect(errorMessage(new Error('Failed to fetch dynamically imported module'))).toContain('Reload');
    expect(errorMessage(new Error('<html>private</html>'))).not.toContain('private');
  });
  test('bounded retries only for server reads', () => {
    expect(retryRead(0,{status:502})).toBe(true);
    expect(retryRead(2,{status:502})).toBe(false);
    for (const status of [400,401,403,404,429]) expect(retryRead(0,{status})).toBe(false);
  });
  test('cyclic and nested causes', () => {
    const a: {cause?: unknown} = {}; const b = {cause:a}; a.cause=b;
    expect(errorStatus(a)).toBeUndefined();
    expect(errorStatus({cause:{statusCode:503}})).toBe(503);
  });
});
