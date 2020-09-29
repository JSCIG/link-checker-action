import { debug } from '@actions/core';
import { issueCommand } from '@actions/core/lib/command';
import fetch from 'node-fetch';
import { URL } from 'url';

interface LineNumber {
  line: string;
  number: number;
}

export function* lineNo(input: string, search: string): Generator<LineNumber> {
  let number = 1;
  for (const line of input.split(/\r?\n/)) {
    if (line.includes(search)) {
      yield { line, number };
    }
    number++;
  }
}

export function warning(message: string, file?: string, line?: number, col?: number): void {
  issueCommand('warning', { file, line, col }, message);
}

export async function head(link: string): Promise<void> {
  const response = await fetch(link, { method: 'HEAD', redirect: 'manual' });
  debug(`${link} - ${response.status}`);
  if (response.headers.has('location')) {
    const location = response.headers.get('location');
    throw `${response.status} Redirected to ${location}`;
  } else if (response.status === 401) {
    throw `403 Unauthorized`;
  } else if (response.status === 403) {
    throw `403 Forbidden`;
  } else if (response.status === 404) {
    throw `404 Not Found`;
  } else if (response.status === 500) {
    throw `500 Internal Server Error`;
  } else if (response.status == 429) {
    throw new Error(`${link} Stopped due to rate limit`);
  }
}

export function normalizeLink(input: string): string {
  const link = new URL(input);
  link.hash = '';
  if (!link.pathname.endsWith('/')) {
    link.pathname += '/';
  }
  return link.toString();
}
