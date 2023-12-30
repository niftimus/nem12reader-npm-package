import { Parser } from 'jison';
import { DateTime } from 'luxon';
import { parser as preGeneratedParser } from './Parser';
import { Nem12File, nem12Grammar, Nem12NMIDataDetails } from './generate';

export { Nem12File, Nem12NMIDataDetails };

export function parseNEM12(nem12String: string): Nem12File {

  // Use pre-compiled parser if available
  const parser = preGeneratedParser ?? new Parser(nem12Grammar);

  try {
    const parsedNEM12Data: Nem12File = parser.parse(nem12String, DateTime);
    return parsedNEM12Data;

  } catch (error) {
    console.error('Error parsing CSV:', error.message);
  }

}

