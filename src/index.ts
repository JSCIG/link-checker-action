import { getInput, setFailed } from '@actions/core';
import glob from '@actions/glob';
import cheerio from 'cheerio';
import fs from 'fs/promises';
import MarkdownIt from 'markdown-it';
import { warning, lineNo } from './utils';

const markdown = new MarkdownIt();

const usedLinks = new Set<string>();

async function main(): Promise<void> {
  const pattern = getInput('pattern', { required: true });
  const files = await glob.create(pattern);
  for await (const file of files.globGenerator()) {
    const content = await fs.readFile(file, 'utf-8');
    for (const link of getLinks(content, /.(md|markdown)$/i.test(file))) {
      if (!/^https:\/\//.test(link)) {
        continue;
      } else if (usedLinks.has(link)) {
        continue;
      }
      try {
        await testLink(link);
      } catch (error) {
        for (const { line, number } of lineNo(content, (line) => line.includes(link))) {
          warning(`${link} - ${error}`, file, number, line.indexOf(link) + 1);
        }
      }
      usedLinks.add(link);
    }
  }
}

async function testLink(link: string) {
  const response = await fetch(link, { method: 'HEAD' });
  if (response.status === 200) {
    return;
  } else if (response.headers.has('location')) {
    const location = response.headers.get('location');
    throw `${response.status} Redirected to ${location}`;
  } else if (response.status === 401) {
    throw '403 Unauthorized';
  } else if (response.status === 403) {
    throw '403 Forbidden';
  } else if (response.status === 404) {
    throw '404 Not Found';
  } else if (response.status === 500) {
    throw '500 Internal Server Error';
  }
}

function* getLinks(content: string, isMarkdown: boolean) {
  if (isMarkdown) {
    content = markdown.render(content);
  }
  const $ = cheerio.load(content);
  for (const element of $('a').toArray()) {
    yield element.attribs.href;
  }
}

main().catch((error: Error) => setFailed(error.message));
