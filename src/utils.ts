interface LineNumber {
  line: string;
  number: number;
}

export function* lineNo(input: string, match: (line: string) => boolean): Generator<LineNumber> {
  let number = 1;
  for (const line of input.split(/\r?\n/)) {
    if (match(line)) {
      yield { line, number };
    }
    number++;
  }
}

export function warning(message: string, file?: string, line?: number, col?: number): void {
  const options = { file, line, col };
  const properties = Object.entries(options)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}=${value}`)
    .join(',');
  console.log(`::warning ${properties}::${message}`);
}
