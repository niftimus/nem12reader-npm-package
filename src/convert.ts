import { parseNEM12, Nem12File } from './parse';
import { getReadsCSV30, getReadsCSVLong } from './output';
import { parse } from 'ts-command-line-args';
import { readFileSync, writeFileSync } from 'fs';

interface ICopyFilesArguments {
  inputFile: string;
  outputFile?: string;
  format?: string;
  shape?: string;
  help?: boolean;
}

export const args = parse<ICopyFilesArguments>(
  {
    inputFile: { type: String, optional: null, alias: 'i', description: 'Input file full path (to NEM12 CSV)' },
    outputFile: { type: String, optional: true, alias: 'o', description: 'Ouptut file full path' },
    format: { type: String, optional: true, alias: 'f', defaultValue: 'csv', group: ['csv', 'json'], description: 'Ouput format [csv | json]' },
    shape: { type: String, optional: true, alias: 's', defaultValue: 'wide', group: ['wide', 'long'], description: 'Ouput shape [wide | long]' },
    help: { type: Boolean, optional: true, alias: 'h', description: 'Prints this usage guide' },
  },
  {
    helpArg: 'help',
    headerContentSections: [{ header: 'convertNEM12', content: 'Convert AEMO NEM12 CSV into structured formats.' }],
  },
);

const sampleNEM12Data: string = readFileSync(args.inputFile, 'utf-8');

try {
  const parsedOutput: Nem12File = parseNEM12(sampleNEM12Data);
  let items: string;

  if (args.format === 'json') {
    items = JSON.stringify(parsedOutput);
    console.debug(items);
  } else if (args.format === 'csv') {
    if (args.shape === 'wide') {
      items = getReadsCSV30(parsedOutput);
      console.debug(items);
    } else if (args.shape === 'long') {
      items = getReadsCSVLong(parsedOutput);
      console.debug(items);
    }
  }
  if (args.outputFile) {
    writeFileSync(args.outputFile, items, {
      encoding: 'utf8',
    });
  }
} catch (error) {
  console.error('Error outputting file:', error);
}