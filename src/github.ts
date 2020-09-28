import { getInput } from '@actions/core';
import { Octokit } from '@octokit/rest';
import parseGithubURL from 'parse-github-url';

const github = new Octokit({
  auth: getInput('token', { required: true }),
});

const usedRepos = new Set<string>();

export async function testGitHubLink(link: string): Promise<void> {
  const result = parseGithubURL(link);
  if (result == null || result.owner === null || result.name === null) {
    return;
  } else if (result.filepath && !['pull', 'issues'].includes(result.branch)) {
    if (result.branch === 'blob') {
      const index = result.filepath.indexOf('/');
      result.branch = result.filepath.slice(0, index);
      result.filepath = result.filepath.slice(index + 1);
    }
    await github.repos.getContent({
      repo: result.name,
      owner: result.owner,
      ref: result.branch,
      path: result.filepath,
    });
  } else if (usedRepos.has(`${result.owner}/${result.name}`)) {
    return;
  }
  const { data } = await github.repos.get({ owner: result.owner, repo: result.name });
  usedRepos.add(data.full_name);
  if (data.owner.login !== result.owner) {
    throw `Transferred to ${data.html_url}`;
  } else if (data.name !== result.name) {
    throw `Renamed to ${data.html_url}`;
  }
}
