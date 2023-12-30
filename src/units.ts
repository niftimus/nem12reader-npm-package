const units: object = {
  MWh: {
    description: 'megawatt hour',
    canonical: 'kWh',
    multiplier_to_canonical: 1000,
    additive: true,
  },
  kWh: {
    description: 'kilowatt hour',
    canonical: 'kWh',
    multiplier_to_canonical: 1,
    additive: true,
  },
  Wh: {
    description: 'watt hour',
    canonical: 'kWh',
    multiplier_to_canonical: 0.001,
    additive: true,
  },
  MVArh: {
    description: 'megavolt ampere reactive hour (megavar hour)',
    canonical: 'kVArh',
    multiplier_to_canonical: 1000,
    additive: true,
  },
  kVArh: {
    description: 'kilovolt ampere reactive hour',
    canonical: 'kVArh',
    multiplier_to_canonical: 1,
    additive: true,
  },
  VArh: {
    description: 'volt ampere reactive hour',
    canonical: 'kVArh',
    multiplier_to_canonical: 0.001,
    additive: true,
  },
  MVAr: {
    description: 'megavolt ampere reactive',
    canonical: 'kVAr',
    multiplier_to_canonical: 1000,
    additive: false,
  },
  kVAr: {
    description: 'kilovolt ampere reactive',
    canonical: 'kVAr',
    multiplier_to_canonical: 1,
    additive: false,
  },
  VAr: {
    description: 'volt ampere reactive',
    canonical: 'kVAr',
    multiplier_to_canonical: 0.001,
    additive: false,
  },
  MW: {
    description: 'megawatt',
    canonical: 'kW',
    multiplier_to_canonical: 1000,
    additive: false,
  },
  kW: {
    description: 'kilowatt',
    canonical: 'kW',
    multiplier_to_canonical: 1,
    additive: false,
  },
  W: {
    description: 'watt',
    canonical: 'kW',
    multiplier_to_canonical: 0.001,
    additive: false,
  },
  MVAh: {
    description: 'megavolt ampere hour',
    canonical: 'kVAh',
    multiplier_to_canonical: 1000,
    additive: true,
  },
  kVAh: {
    description: 'kilovolt ampere hour',
    canonical: 'kVAh',
    multiplier_to_canonical: 1,
    additive: true,
  },
  VAh: {
    description: 'volt ampere hour',
    canonical: 'kVAh',
    multiplier_to_canonical: 0.001,
    additive: true,
  },
  MVA: {
    description: 'megavolt ampere',
    canonical: 'kVA',
    multiplier_to_canonical: 1000,
    additive: false,
  },
  kVA: {
    description: 'kilovolt ampere',
    canonical: 'kVA',
    multiplier_to_canonical: 1,
    additive: false,
  },
  VA: {
    description: 'volt ampere',
    canonical: 'kVA',
    multiplier_to_canonical: 0.001,
    additive: false,
  },
  kV: {
    description: 'kilovolt',
    canonical: 'V',
    multiplier_to_canonical: 1000,
    additive: false,
  },
  V: {
    description: 'volt',
    canonical: 'V',
    multiplier_to_canonical: 1,
    additive: false,
  },
  kA: {
    description: 'kiloampere',
    canonical: 'A',
    multiplier_to_canonical: 1000,
    additive: false,
  },
  A: {
    description: 'ampere',
    canonical: 'A',
    multiplier_to_canonical: 1,
    additive: false,
  },
  pf: {
    description: 'Power Factor',
    canonical: 'pf',
    multiplier_to_canonical: 1,
    additive: false,
  },
};

const upper_units_to_uom: object = {
  'MWH': {
    'uom': 'MWh',
  },
  'KWH': {
    'uom': 'kWh',
  },
  'WH': {
    'uom': 'Wh',
  },
  'MVARH': {
    'uom': 'MVArh',
  },
  'KVARH': {
    'uom': 'kVArh',
  },
  'VARH': {
    'uom': 'VArh',
  },
  'MVAR': {
    'uom': 'MVAr',
  },
  'KVAR': {
    'uom': 'kVAr',
  },
  'VAR': {
    'uom': 'VAr',
  },
  'MW': {
    'uom': 'MW',
  },
  'KW': {
    'uom': 'kW',
  },
  'W': {
    'uom': 'W',
  },
  'MVAH': {
    'uom': 'MVAh',
  },
  'KVAH': {
    'uom': 'kVAh',
  },
  'VAH': {
    'uom': 'VAh',
  },
  'MVA': {
    'uom': 'MVA',
  },
  'KVA': {
    'uom': 'kVA',
  },
  'VA': {
    'uom': 'VA',
  },
  'KV': {
    'uom': 'kV',
  },
  'V': {
    'uom': 'V',
  },
  'KA': {
    'uom': 'kA',
  },
  'A': {
    'uom': 'A',
  },
  'PF': {
    'uom': 'pf',
  },
};

export function getCanonicalUnitName(uom: string): string {
  try {
    return units[uom].canonical;
  } catch (errorMsg) {
    console.error('Error getting UOM', errorMsg);
    return null;
  }
}

export function convertToCanonicalUnit(inputUOM: string, inputValue: number): number {
  try {
    return inputValue * units[inputUOM].multiplier_to_canonical;
  } catch (errorMsg) {
    console.error('Error converting UOM', errorMsg);
    return null;
  }

}

export function getIsAdditive(inputUOM: string): boolean {
  try {
    return units[inputUOM].additive;
  } catch (errorMsg) {
    console.error('Error getting additive status of UOM', errorMsg);
    return null;
  }

}

export function getUomFromUpper(inputUOM: string): string {
  try {
    return upper_units_to_uom[inputUOM].uom;
  } catch (errorMsg) {
    console.error('Error getting UOM from upper case', errorMsg);
    return null;
  }
}