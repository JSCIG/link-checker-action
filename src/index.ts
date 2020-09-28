import { getInput, group, setFailed } from '@actions/core';
import * as glob from '@actions/glob';
import * as cheerio from 'cheerio';
import { promises as fs } from 'fs';
import MarkdownIt from 'markdown-it';
import path from 'path';
import { testLink } from './links';
import { lineNo, warning } from './utils';

const markdown = new MarkdownIt();

const usedLinks = new Set<string>();

async function main(): Promise<void> {
  const pattern = getInput('pattern', { required: true });
  const ignorableLinks = getInput('ignorable_links', { required: true })
    .split('\n')
    .map((link) => link.trim());
  const files = await glob.create(pattern);
  for await (const file of files.globGenerator()) {
    const relativedPath = path.relative(process.cwd(), file);
    await group(`Checking /${relativedPath}`, async () => {
      const content = await fs.readFile(file, 'utf-8');
      for (const link of getLinks(content, /.(md|markdown)$/i.test(file))) {
        if (!/^https?:\/\//i.test(link)) {
          continue; // ignore not http url
        } else if (ignorableLinks.find((keyword) => link.includes(keyword))) {
          continue; // ignore by keywords
        } else if (usedLinks.has(link)) {
          continue; // ignore used link
        }
        try {
          await testLink(link);
        } catch (err) {
          if (err instanceof Error && err.message.includes('rate limit')) {
            throw err;
          }
          for (const { line, number } of lineNo(content, link)) {
            warning(`${link} -> ${err}`, relativedPath, number, line.indexOf(link) + 1);
          }
        }
        usedLinks.add(link);
      }
    });
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

main().catch(setFailed);
