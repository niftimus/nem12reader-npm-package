import { DateTime } from 'luxon';
import { Big } from 'big.js';
import { createObjectCsvStringifier } from 'csv-writer';
import { Nem12File, Nem12NMIDataDetails } from './parse';
import { getCanonicalUnitName, getIsAdditive, getUomFromUpper, convertToCanonicalUnit } from './units';

const createCsvStringifier = createObjectCsvStringifier;

export interface OutputFilterArgs {
  nmi?: string,
  nmiSuffix?: string,
}

export interface OutputNMISuffixReads {
  nmi: string,
  nmiSuffix: string,
  intervalDate: typeof DateTime,
  intervalValues: typeof Big[],
  qualityMethods: string[],
}

interface QualityDetail {
  qualityMethod: string,
  reasonCode: number,
  reasonDescription: string,
}

interface rowLong {
  intervalDate: string,
  nmi: string,
  registerId: string,
  nmiSuffix: string,
  mdmDataStreamIdentifier: string,
  meterSerialNumber: string,
  nextScheduledReadDate: typeof DateTime,
  reasonCode: number,
  reasonDescription: string,
  updateDatetime: typeof DateTime,
  uom: string,
  qualityMethod: string,
  intervalStartTimestamp: typeof DateTime,
  intervalEndTimestamp: typeof DateTime,
  readValue: number,
}

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = '0' + num;
  return num;
}

function convert30IntervalToString(i: number) {
  return pad(Math.floor(i / 2) % 24, 2) + (i % 2 === 1 ? '30' : '00');
}

const MINUTES_IN_DAY: number = 1440;

// Wide view
export function getReadsCSV30(nem12File: Nem12File, args?: OutputFilterArgs): string {
  try {

    const header = [
      { id: 'intervalDate', title: 'interval_date' },
      { id: 'nmi', title: 'nmi' },
      { id: 'registerId', title: 'register_id' },
      { id: 'nmiSuffix', title: 'nmi_suffix' },
      { id: 'mdmDataStreamIdenfier', title: 'mdm_data_stream_identifier' },
      { id: 'meterSerialNumber', title: 'meter_serial_number' },
      { id: 'nextScheduledReadDate', title: 'next_scheduled_read_date' },
      { id: 'qualityMethod', title: 'quality_method' },
      { id: 'updateDatetime', title: 'update_datetime' },
      { id: 'uom', title: 'uom' },
      { id: 'originalIntervalLength', title: 'original_interval_length' },
    ];

    //{ id: 'Interval_0030', title: 'INTERVAL_0030' },
    for (let i = 1; i <= 48; i++) {
      header.push({ id: 'interval_' + convert30IntervalToString(i), title: 'interval_' + convert30IntervalToString(i) });
    }

    const csvStringifier = createCsvStringifier({ 'header': header });

    let preFilteredNEM12FileData: Nem12NMIDataDetails[] = nem12File.data;

    if (args) {
      if (args.nmi !== undefined) { preFilteredNEM12FileData = preFilteredNEM12FileData.filter(item => item.nmi == args.nmi); }
      if (args.nmiSuffix !== undefined) { preFilteredNEM12FileData = preFilteredNEM12FileData.filter(item => item.nmiSuffix == args.nmiSuffix); }
    }

    // Filter to additive UOM only
    const recordsArray = preFilteredNEM12FileData.filter(item => getIsAdditive(getUomFromUpper(item.uom.toUpperCase()))).map(item => (

      item.intervalData.map(intervalDay => {
        const canonicalUnitName = getCanonicalUnitName(getUomFromUpper(item.uom.toUpperCase()));

        const row = {
          intervalDate: intervalDay.intervalDate.toFormat('yyyy-MM-dd'),
          nmi: item.nmi,
          registerId: item.registerId,
          nmiSuffix: item.nmiSuffix,
          mdmDataStreamIdenfier: item.mdmDataStreamIdenfier,
          meterSerialNumber: item.meterSerialNumber,
          nextScheduledReadDate: item.nextScheduledReadDate,
          qualityMethod: intervalDay.qualityMethod,
          updateDatetime: intervalDay.updateDateTime,
          uom: canonicalUnitName,
          originalIntervalLength: item.intervalLength,
        };

        const intervalStepIn30: number = 30 / item.intervalLength;

        for (let i = 1; i <= 48; i++) {
          // Sum up interval values (assuming additive) if 15 or 5 minute data
          row['interval_' + convert30IntervalToString(i)] = convertToCanonicalUnit(canonicalUnitName, intervalDay.intervalValues.slice(((i - 1) * intervalStepIn30), ((i - 1) * intervalStepIn30) + intervalStepIn30).map((x) => { return Big(x) }).reduce((a, b) => { const aa = new Big(a); const bb = new Big(b); return aa.plus(bb); }, 0));
        }

        return row;

      })),

    ).flat(1);

    const output: string = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(recordsArray);

    return output;


  } catch (error) {
    console.error('Error writing CSV string:', error.message);
  }

}

// Long view
export function getReadsCSVLong(nem12File: Nem12File, args?: OutputFilterArgs): string {

  try {
    const header = [
      { id: 'intervalDate', title: 'interval_date' },
      { id: 'nmi', title: 'nmi' },
      { id: 'registerId', title: 'register_id' },
      { id: 'nmiSuffix', title: 'nmi_suffix' },
      { id: 'mdmDataStreamIdenfier', title: 'mdm_data_stream_identifier' },
      { id: 'meterSerialNumber', title: 'meter_serial_number' },
      { id: 'nextScheduledReadDate', title: 'next_scheduled_read_date' },
      { id: 'updateDatetime', title: 'update_datetime' },
      { id: 'uom', title: 'uom' },
      { id: 'intervalLength', title: 'interval_length' },
      { id: 'qualityMethod', title: 'quality_method' },
      { id: 'reasonCode', title: 'reason_code' },
      { id: 'reasonDescription', title: 'reason_description' },
      { id: 'intervalStartTimestamp', title: 'interval_start_timestamp' },
      { id: 'intervalEndTimestamp', title: 'interval_end_timestamp' },
      { id: 'readValue', title: 'read_value' },
    ];

    const csvStringifier = createCsvStringifier({ 'header': header });

    let preFilteredNEM12FileData: Nem12NMIDataDetails[] = nem12File.data;

    if (args) {
      if (args.nmi !== undefined) { preFilteredNEM12FileData = preFilteredNEM12FileData.filter(item => item.nmi == args.nmi); }
      if (args.nmiSuffix !== undefined) { preFilteredNEM12FileData = preFilteredNEM12FileData.filter(item => item.nmiSuffix == args.nmiSuffix); }
    }

    const recordsArray = preFilteredNEM12FileData.map(item => (

      item.intervalData.map(intervalDay => {
        const rows: rowLong[] = [];

        const rowHeader = {
          intervalDate: intervalDay.intervalDate.toFormat('yyyy-MM-dd'),
          nmi: item.nmi,
          registerId: item.registerId,
          nmiSuffix: item.nmiSuffix,
          mdmDataStreamIdentifier: item.mdmDataStreamIdenfier,
          meterSerialNumber: item.meterSerialNumber,
          nextScheduledReadDate: item.nextScheduledReadDate,
          updateDatetime: intervalDay.updateDateTime,
          uom: item.uom,
          intervalLength: item.intervalLength,
        };

        const numIntervalsInDay = MINUTES_IN_DAY / item.intervalLength;

        const qualityArray: QualityDetail[] = [];

        if (intervalDay.intervalEvents != null) {

          for (let i = 1; i <= numIntervalsInDay; i++) {
            const intervalEvent = intervalDay.intervalEvents.filter((intervalEvent) => i >= intervalEvent.startInterval && i <= intervalEvent.endInterval);
            const intervalDetail: QualityDetail =
            {
              qualityMethod: intervalEvent[0]['qualityMethod'],
              reasonCode: intervalEvent[0]['reasonCode'],
              reasonDescription: intervalEvent[0]['reasonDescription'],
            };

            qualityArray.push(intervalDetail);
          }
        }

        for (let i = 1; i <= numIntervalsInDay; i++) {

          const r: rowLong = {
            ...rowHeader,
            qualityMethod: intervalDay.intervalEvents === null ? intervalDay.qualityMethod : qualityArray[i - 1]['qualityMethod'],
            reasonCode: (intervalDay.intervalEvents === null ? null : qualityArray[i - 1]['reasonCode']) || null,
            reasonDescription: intervalDay.intervalEvents === null ? null : qualityArray[i - 1]['reasonDescription'],
            intervalStartTimestamp: intervalDay.intervalDate.plus({ minutes: (i - 1) * item.intervalLength }),
            intervalEndTimestamp: intervalDay.intervalDate.plus({ minutes: (i) * item.intervalLength }),
            readValue: intervalDay.intervalValues[i - 1],
          }

          rows.push(r);
        }

        return rows;

      })),

    ).flat(2);

    const output: string = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(recordsArray);

    return output;

  } catch (error) {
    console.error('Error writing CSV string:', error.message);
  }

}
