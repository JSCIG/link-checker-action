import { debug } from '@actions/core';
import fetch from 'node-fetch';
import { testGitHubLink } from './github';
import { normalizeLink } from './utils';

const usedLinks = new Set<string>();

export async function testLink(link: string): Promise<void> {
  if (link.includes('//github.com/')) {
    return testGitHubLink(link);
  } else if (usedLinks.has(normalizeLink(link))) {
    return;
  }
  usedLinks.add(normalizeLink(link));
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
