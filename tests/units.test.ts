import { getCanonicalUnitName, convertToCanonicalUnit, getIsAdditive, getUomFromUpper } from '../src/units';

describe('testing file unit conversion', () => {

  test('get unit name should return null on null', () => {
    const outputName0: string = getCanonicalUnitName(null);

    expect(outputName0).toBeNull();
  });

  test('get unit name should return null on unknown unit', () => {
    const outputName1: string = getCanonicalUnitName('xxx');

    expect(outputName1).toBeNull();
  });

  test('get unit name should return same unit on canonical unit', () => {
    const outputName2: string = getCanonicalUnitName('kWh');

    expect(outputName2).toEqual('kWh');
  });

  test('get unit name should return canonical unit on non-canonical unit', () => {
    const outputName3: string = getCanonicalUnitName('MWh');

    expect(outputName3).toEqual('kWh');
  });

  test('get unit name should return canonical unit on non-canonical unit', () => {
    const outputName3: string = getCanonicalUnitName('MWh');

    expect(outputName3).toEqual('kWh');
  });


  test('get canonical value should return null on null unit', () => {
    const outputValue0: number = convertToCanonicalUnit(null, 123.45);

    expect(outputValue0).toBeNull();
  });

  test('get canonical value should return lower magnitude value on smaller unit', () => {
    const outputValue1: number = convertToCanonicalUnit('Wh', 123.45);

    expect(outputValue1).toEqual(0.12345);
  });

  test('get canonical value should return lower magnitude value on larger unit', () => {
    const outputValue2: number = convertToCanonicalUnit('MWh', 123.45);

    expect(outputValue2).toEqual(123450);
  });

  test('get canonical value should same magnitude value on canonical unit', () => {
    const outputValue3: number = convertToCanonicalUnit('kWh', 123.45);

    expect(outputValue3).toEqual(123.45);
  });

  test('get additive flag for unit on known additive unit should succeed', () => {
    const outputFlag0: boolean = getIsAdditive('kWh');

    expect(outputFlag0).toEqual(true);
  });

  test('get additive flag for unit on known non-additive unit should succeed', () => {
    const outputFlag1: boolean = getIsAdditive('kW');

    expect(outputFlag1).toEqual(false);
  });

  test('get additive flag on unknown unit should return null', () => {
    const outputFlag2: boolean = getIsAdditive('xyz');

    expect(outputFlag2).toBeNull();
  });

  test('get uom from upper case on known UOM', () => {
    const outputUOM0: string = getUomFromUpper('KWH');

    expect(outputUOM0).toEqual('kWh');
  });

});
