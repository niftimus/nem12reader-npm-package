import { parseNEM12, Nem12File } from '../src/parse';
import { getReadsCSV30 } from '../src/output';
import * as fs from 'fs';

let sampleNEM12Data: string = null;
let parsedOutput: Nem12File = null;
let reads: string = null;

try {
  console.debug('Reading raw file...');
  sampleNEM12Data = fs.readFileSync('tests/data/64070000001_20220518_20230518_20230519185451_UNITEDENERGY_VEC.csv', 'utf-8');
  console.debug('Successfully read raw file!')
  console.debug(sampleNEM12Data);
} catch (error) {
  console.error('Error reading raw file: ', error);
}

try {
  console.debug('Parsing file...');
  parsedOutput = parseNEM12(sampleNEM12Data);
  console.info('Succesfully parsed file!');
  console.debug(parsedOutput);
} catch (error) {
  console.error('Error parsing file: ', error);
}

try {
  console.debug('Converting E1 reads for NMI 6407000000 as 30 minute wide CSV...');
  reads = getReadsCSV30(parsedOutput, { nmi: '6407000000', nmiSuffix: 'E1' });
  console.info('Succesfully converted file!');
  console.debug(reads);
} catch (error) {
  console.error('Error converting file: ', error);
}
