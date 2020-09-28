import { issueCommand } from '@actions/core/lib/command';

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
