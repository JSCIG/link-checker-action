import { getInput } from '@actions/core';
import { Octokit } from '@octokit/rest';
import parseGithubURL from 'parse-github-url';
import { head, normalizeLink } from './utils';

const github = new Octokit({
  auth: getInput('token', { required: true }),
});

const usedRepos = new Set<string>();

export async function testGitHubLink(link: string): Promise<void> {
  const parsed = parseGithubURL(link);
  if (parsed == null || parsed.owner === null || parsed.name === null) {
    return;
  } else if (['pull', 'issues', 'wiki', 'actions', 'projects', 'settings'].includes(parsed.branch)) {
    return;
  } else if (parsed.filepath) {
    await head(normalizeLink(link));
  } else if (usedRepos.has(`${parsed.owner}/${parsed.name}`)) {
    return;
  }
  usedRepos.add(`${parsed.owner}/${parsed.name}`);
  const { data } = await github.repos.get({ owner: parsed.owner, repo: parsed.name });
  if (data.owner.login !== parsed.owner) {
    throw `Transferred to ${data.html_url}`;
  } else if (data.name !== parsed.name) {
    throw `Renamed to ${data.html_url}`;
  }
}
