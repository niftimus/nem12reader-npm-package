import path = require('path');
import { writeFileSync } from 'fs';
import { Parser } from 'jison';
import { DateTime, Settings } from 'luxon';


// AEMO spec reference: https://aemo.com.au/-/media/files/electricity/nem/retail_and_metering/market_settlement_and_transfer_solutions/2022/mdff-specification-nem12-nem13-v25.pdf?la=en
// Testing reference: https://www.testim.io/blog/typescript-unit-testing-101/

Settings.defaultZone = 'UTC+10';

export interface Nem12File {
  header: Nem12Header,
  data: Nem12NMIDataDetails[],
  footer: Nem12End,
}

export interface Nem12Header {
  recordIndicator: number,
  versionHeader: string,
  dateTime: typeof DateTime,
  fromParticipant: string,
  toParticipant: string,
}

export interface Nem12NMIDataDetails {
  recordIndicator: number,
  nmi: string,
  nmiConfiguration: string,
  registerId: string,
  nmiSuffix: string,
  mdmDataStreamIdenfier: string,
  meterSerialNumber: string,
  uom: string,
  intervalLength: number,
  nextScheduledReadDate: typeof DateTime,
  intervalData: Nem12IntervalData[],
}

export interface Nem12IntervalData {
  recordIndicator: number,
  intervalDate: typeof DateTime,
  intervalValues: number[],
  qualityMethod: string,
  reasonCode: number,
  reasonDescription: string,
  updateDateTime: typeof DateTime,
  msatsLoadDateTime: typeof DateTime,
  intervalEvents: Nem12IntervalEvent[],
  b2bDetails: Nem12B2BDetails[],
}

export interface Nem12IntervalEvent {
  recordIndicator: number,
  startInterval: number,
  endInterval: number,
  qualityMethod: string,
  reasonCode: number,
  reasonDescription: string,
}

export interface Nem12B2BDetails {
  recordIndicator: number,
  transCode: string,
  retServiceOrder: string,
  readDateTime: typeof DateTime,
  indexRead: number,
}


export interface Nem12End {
  recordIndicator: number,
}

export const nem12Grammar = {
  'lex': {
    'startConditions': {
      'INITIAL': null,
      'PROCESSING': null,
    },
    'rules': [
      [['INITIAL'], '100', 'if (this.topState()===\'INITIAL\') { this.pushState(\'PROCESSING\'); return \'RecordIndicator_100\';} else {return \'String\'};'],
      [['INITIAL', 'PROCESSING'], '(\\r?\\n|^)200(?=,)', 'if (this.topState()===\'INITIAL\') { this.pushState(\'PROCESSING\');} return \'RecordIndicator_200\';'],
      [['PROCESSING'], ',', 'return \'SEP\';'],
      [['PROCESSING'], '(\\r?\\n)300', 'return \'RecordIndicator_300\';'],
      [['PROCESSING'], '(\\r?\\n)400', 'return \'RecordIndicator_400\';'],
      [['PROCESSING'], '(\\r?\\n)500', 'return \'RecordIndicator_500\';'],
      [['PROCESSING'], '(\\r?\\n)900', 'return \'RecordIndicator_900\';'],
      [['PROCESSING'], '$', 'this.popState(); return \'EOF\';'],
      [['PROCESSING'], '[^,\\r\\n]*', 'return \'String\';'],
      [['PROCESSING'], '"(?:[^"\\\\]|\\\\.)*"', 'return \'StringLiteral\';'], // Fix the StringLiteral rule to handle escaped quotes
    ],
  },
  'bnf': {
    'nem12_file': [
      ['nem12_header nem12_data nem12_footer EOF', 'return { header: $1, data: $2,footer: $3};'],
      ['nem12_data EOF', 'return { header: null, data: $1, footer: null };'],
    ],

    'nem12_header': [
      ['block_100', '$$ = $1;'],
    ],

    'nem12_data': [
      ['nem12_nmi_data_details', '$$ = [$1];'],
      ['nem12_data nem12_nmi_data_details', '$$ = $1.concat($2);'],
    ],

    'nem12_footer': [
      ['block_900', '$$ = $1;'],
    ],

    'nem12_nmi_data_details': [
      ['block_200', '$$ = $1;'],
      ['block_200 nem12_interval_data_array', '$$ = {...$1, intervalData: $2};'],
    ],

    'nem12_interval_event': [
      ['block_400', '$$ = $1;'],
    ],

    'nem12_interval_event_array': [
      ['nem12_interval_event', '$$ = [$1];'],
      ['nem12_interval_event nem12_interval_event_array', '$$ = $2.concat($1);'],
    ],

    'nem12_b2b_details': [
      ['block_500', '$$ = $1;'],
    ],

    'nem12_b2b_details_array': [
      ['nem12_b2b_details', '$$ = [$1];'],
      ['nem12_b2b_details nem12_b2b_details_array', '$$ = $2.concat($1);'],
    ],

    'nem12_interval_data_array': [
      ['nem12_interval_data_with_400_500', '$$ = [$1];'],
      ['nem12_interval_data_with_400', '$$ = [$1];'],
      ['nem12_interval_data_with_500', '$$ = [$1];'],
      ['nem12_interval_data_no_blocks', '$$ = [$1];'],
      ['nem12_interval_data_with_400_500 nem12_interval_data_array', '$$ = $2.concat($1);'],
      ['nem12_interval_data_with_400 nem12_interval_data_array', '$$ = $2.concat($1);'],
      ['nem12_interval_data_with_500 nem12_interval_data_array', '$$ = $2.concat($1);'],
      ['nem12_interval_data_no_blocks nem12_interval_data_array', '$$ = $2.concat($1);'],
    ],

    'nem12_interval_data_with_400_500': [
      ['block_300 nem12_interval_event_array nem12_b2b_details_array', '$$ = {...$1, intervalEvents: $2, b2bDetails: $3};'],
    ],

    'nem12_interval_data_with_400': [
      ['block_300 nem12_interval_event_array', '$$ = {...$1, intervalEvents: $2, b2bDetails: null};'],
    ],

    'nem12_interval_data_with_500': [
      ['block_300 nem12_b2b_details_array', '$$ = {...$1, intervalEvents: null, b2bDetails: $2};'],
    ],

    'nem12_interval_data_no_blocks': [
      ['block_300', '$$ = {...$1, intervalEvents: null, b2bDetails: null};'],
    ],


    'block_100': [
      ['RecordIndicator_100 SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 100, versionHeader: $3, dateTime: DateTime.fromFormat($5, \'yyyyMMddHHmmss\'), fromParticipant: $7, toParticipant: $9}; '],
    ],

    'block_200': [
      ['RecordIndicator_200 SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 200, nmi: $3, nmiConfiguration: $5, registerId: $7, nmiSuffix: $9, mdmDataStreamIdentifier: $11, meterSerialNumber: $13, uom: $15, intervalLength: Number($17), nextScheduledReadDate: $19 === undefined ? undefined : DateTime.fromFormat( $19, \'yyyyMMdd\')};'],
    ],

    'block_300': [
      [
        'RecordIndicator_300 SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 300, intervalDate: DateTime.fromFormat($3, \'yyyyMMdd\'), intervalValues: [$5,$7,$9,$11,$13,$15,$17,$19,$21,$23,$25,$27,$29,$31,$33,$35,$37,$39,$41,$43,$45,$47,$49,$51,$53,$55,$57,$59,$61,$63,$65,$67,$69,$71,$73,$75,$77,$79,$81,$83,$85,$87,$89,$91,$93,$95,$97,$99,$101,$103,$105,$107,$109,$111,$113,$115,$117,$119,$121,$123,$125,$127,$129,$131,$133,$135,$137,$139,$141,$143,$145,$147,$149,$151,$153,$155,$157,$159,$161,$163,$165,$167,$169,$171,$173,$175,$177,$179,$181,$183,$185,$187,$189,$191,$193,$195,$197,$199,$201,$203,$205,$207,$209,$211,$213,$215,$217,$219,$221,$223,$225,$227,$229,$231,$233,$235,$237,$239,$241,$243,$245,$247,$249,$251,$253,$255,$257,$259,$261,$263,$265,$267,$269,$271,$273,$275,$277,$279,$281,$283,$285,$287,$289,$291,$293,$295,$297,$299,$301,$303,$305,$307,$309,$311,$313,$315,$317,$319,$321,$323,$325,$327,$329,$331,$333,$335,$337,$339,$341,$343,$345,$347,$349,$351,$353,$355,$357,$359,$361,$363,$365,$367,$369,$371,$373,$375,$377,$379,$381,$383,$385,$387,$389,$391,$393,$395,$397,$399,$401,$403,$405,$407,$409,$411,$413,$415,$417,$419,$421,$423,$425,$427,$429,$431,$433,$435,$437,$439,$441,$443,$445,$447,$449,$451,$453,$455,$457,$459,$461,$463,$465,$467,$469,$471,$473,$475,$477,$479,$481,$483,$485,$487,$489,$491,$493,$495,$497,$499,$501,$503,$505,$507,$509,$511,$513,$515,$517,$519,$521,$523,$525,$527,$529,$531,$533,$535,$537,$539,$541,$543,$545,$547,$549,$551,$553,$555,$557,$559,$561,$563,$565,$567,$569,$571,$573,$575,$577,$579].map(item => Number(item)), qualityMethod: $581, reasonCode: Number($583), reasonDescription: $585, updateDateTime: DateTime.fromFormat($587 ?? \'\', \'yyyyMMddHHmmss\'), msatsLoadDateTime: DateTime.fromFormat($589 ?? \'\', \'yyyyMMddHHmmss\')};',
      ],
      [
        'RecordIndicator_300 SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 300, intervalDate: DateTime.fromFormat($3, \'yyyyMMdd\'), intervalValues: [$5,$7,$9,$11,$13,$15,$17,$19,$21,$23,$25,$27,$29,$31,$33,$35,$37,$39,$41,$43,$45,$47,$49,$51,$53,$55,$57,$59,$61,$63,$65,$67,$69,$71,$73,$75,$77,$79,$81,$83,$85,$87,$89,$91,$93,$95,$97,$99,$101,$103,$105,$107,$109,$111,$113,$115,$117,$119,$121,$123,$125,$127,$129,$131,$133,$135,$137,$139,$141,$143,$145,$147,$149,$151,$153,$155,$157,$159,$161,$163,$165,$167,$169,$171,$173,$175,$177,$179,$181,$183,$185,$187,$189,$191,$193,$195].map(item => Number(item)), qualityMethod: $197, reasonCode: Number($199), reasonDescription: $201, updateDateTime: DateTime.fromFormat($203 ?? \'\', \'yyyyMMddHHmmss\'), msatsLoadDateTime: DateTime.fromFormat($205 ?? \'\', \'yyyyMMddHHmmss\')};',
      ],
      [
        'RecordIndicator_300 SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 300, intervalDate: DateTime.fromFormat($3, \'yyyyMMdd\'), intervalValues: [$5,$7,$9,$11,$13,$15,$17,$19,$21,$23,$25,$27,$29,$31,$33,$35,$37,$39,$41,$43,$45,$47,$49,$51,$53,$55,$57,$59,$61,$63,$65,$67,$69,$71,$73,$75,$77,$79,$81,$83,$85,$87,$89,$91,$93,$95,$97,$99].map(item => Number(item)), qualityMethod: $101, reasonCode: Number($103), reasonDescription: $105, updateDateTime: DateTime.fromFormat($107 ?? \'\', \'yyyyMMddHHmmss\'), msatsLoadDateTime: DateTime.fromFormat($109 ?? \'\', \'yyyyMMddHHmmss\')};'],
      // Relaxed 30 minute data (Vic energy compare download)
      [
        'RecordIndicator_300 SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 300, intervalDate: DateTime.fromFormat($3, \'yyyyMMdd\'), intervalValues: [$5,$7,$9,$11,$13,$15,$17,$19,$21,$23,$25,$27,$29,$31,$33,$35,$37,$39,$41,$43,$45,$47,$49,$51,$53,$55,$57,$59,$61,$63,$65,$67,$69,$71,$73,$75,$77,$79,$81,$83,$85,$87,$89,$91,$93,$95,$97,$99].map(item => Number(item)), qualityMethod: $101, reasonCode: Number($103), reasonDescription: $105, updateDateTime: DateTime.fromFormat($107 ?? \'\', \'yyyyMMddHHmmss\'), msatsLoadDateTime: null};',
      ],

    ],

    'block_400': [
      [
        'RecordIndicator_400 SEP Field SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 400, startInterval: Number($3), endInterval: Number($5), qualityMethod: $7, reasonCode: Number($9), reasonDescription: $11 };'],
    ],

    'block_500': [
      [
        'RecordIndicator_500 SEP Field SEP Field SEP Field SEP Field',
        '$$ = {recordIndicator: 500, transCode: $3, retServiceOrder: $5, readDateTime: DateTime.fromFormat($7 ?? \'\', \'yyyyMMddHHmmss\'), indexRead: Number($9) };'],
    ],

    'block_900': [
      [
        'RecordIndicator_900', '$$ = { recordIndicator: 900 };',
      ],
    ],

    'EmptyField': [''],
    'Field': [
      'EmptyField',
      'String',
    ],

  },
  parseParams: ['DateTime'],
};

export function generateNEM12ParserSource(): string {
  const newParser = new Parser(nem12Grammar);

  // generate source, ready to be written to disk
  return newParser.generate();
}

// Keep compiler happy by adding a type annotation
const annotation: string = `/**
 * @type Parser
 */`;
const parserSource: string = generateNEM12ParserSource().replace('var parser =', `${annotation}\nvar parser =`);

writeFileSync(path.join(__dirname, './Parser.js'), parserSource, {
  flag: 'w',
});
