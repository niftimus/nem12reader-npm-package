# nem12reader-npm-package
NEM12 Reader NPM package. Custom parsing of AEMO's NEM12 interval [meter data file format](https://aemo.com.au/-/media/files/electricity/nem/retail_and_metering/market_settlement_and_transfer_solutions/2022/mdff-specification-nem12-nem13-v25.pdf?la=en).

Convert to more convenient formats for downstream data ingestion and processing via another tool.

Supported output formats:
- JSON (default)
- CSV 30 wide - outputs additive values (e.g. energy import / export) only in 30 minute granularity
- CSV long - outputs reads at native granulartiy with start / end times

## How to run (CLI)

### Output to JSON

```BASH
ts-node src/convert.ts --inputFile tests/data/64070000001_20220518_20230518_20230519185451_UNITEDENERGY_VEC.csv --format json --outputFile test-output.json
```

### Output to wide CSV

```BASH
ts-node src/convert.ts --inputFile tests/data/64070000001_20220518_20230518_20230519185451_UNITEDENERGY_VEC.csv --format csv --shape wide --outputFile test-output-wide.csv
```

### Output to long CSV

```BASH
ts-node src/convert.ts --inputFile tests/data/64070000001_20220518_20230518_20230519185451_UNITEDENERGY_VEC.csv --format csv --shape long --outputFile test-output-long.csv
```

## How to use as a module
0. Install pre-requisites - e.g. for Ubuntu:

    ```BASH
    curl -sL https://deb.nodesource.com/setup_18.x | sudo -E bash - 
    sudo apt-get install nodejs
    sudo apt-get install npm
    ```

1. Clone this repo to a local directory and install packages:
    ```BASH
    cd ~
    git clone nem12-reader-npm-package
    cd nem12-reader-npm-package
    sudo npm install -g ts-node
    npm i
    sudo npm install npm@latest -g
    sudo npm install -g typescript
    ```

2. Compile package:
    ```BASH
    npm run compile
    ```

    Note: This step pre-compiles the parser as a JavaScript file `Parser.js` for performance reasons.

3. (Optional) run tests:
    ```BASH
    npm test
    ```

4. Create local package: 
    ```BASH
    npm pack
    ```

5. Create a new npm project:
    ```BASH
    mkdir ~/demo-nem12-reader
    cd ~/demo-nem12-reader
    npm init -y
    ```

6. Install local .tgz package:
    ```BASH
    npm install ../nem12reader-npm-package/nem12-reader-npm-package-0.0.1.tgz
    ```

7. Create demo code:
    ```BASH
    cat << EOF > index.ts
    import { parseNEM12, getReadsCSV30, Nem12File } from 'nem12-reader-npm-package';
    import fs from 'fs';

    try {

        // Read filename from command line
        const filename = process.argv[2];

        // Read raw file
        const sampleNEM12Data: string = fs.readFileSync(filename, 'utf-8');

        // Parse file
        const parsedOutput: Nem12File = parseNEM12(sampleNEM12Data);

        // Converting E1 reads for NMI 6407000000 as 30 minute wide CSV...
        const reads: string = getReadsCSV30(parsedOutput, { nmi: '6407000000', nmiSuffix: 'E1' });

        // Output parsed file
        console.log(reads);
    } catch (error) {
        console.error('Error: ', error);
    }
    EOF
    ```

8. Run the new app:
      ```BASH
      ts-node index.ts ../nem12reader-npm-package/tests/data/64070000001_20220518_20230518_20230519185451_UNITEDENERGY_VEC.csv
      ```

      Example output:
      ```
      ...
      2023-05-17,6407000000,E1,E1,,0914269,,A,2023-05-18T02:22:31.000+10:00,kWh,30,0.281,0.256,0.256,0.256,0.281,0.281,0.269,0.225,0.25,0.231,0.263,0.244,0.25,0.319,2.656,1.319,0.094,0.025,0.081,0.031,0,0.069,0,0,0.019,0.013,0.144,0.031,0.013,0.025,0,0,0,0.113,0.144,0.531,1.681,1.719,1.563,1.675,0.613,0.481,0.463,1.375,1.413,1.019,1.15,1.15
      2023-05-16,6407000000,E1,E1,,0914269,,A,2023-05-17T02:08:27.000+10:00,kWh,30,0.138,0.088,0.081,0.1,0.106,0.113,0.106,0.1,0.119,0.119,0.113,0.088,0.094,0.081,1.188,0.306,0.194,0.356,0.463,0.156,0.725,0.375,0.1,0.331,0.25,0.094,0.363,0.306,0.331,0,0.475,0.506,0.006,0.031,0.113,0.131,1.325,1.856,1.906,0.275,0.163,0.2,0.269,0.2,0.144,0.131,0.225,0.319
      ...
      ```

## Appendix

### Output schemas

#### JSON (default)

```JSON
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Generated schema for Root",
  "type": "object",
  "properties": {
    "header": {
      "type": "object",
      "properties": {
        "recordIndicator": {
          "type": "number"
        },
        "versionHeader": {
          "type": "string"
        },
        "dateTime": {
            "type": "string"
        },
        "fromParticipant": {
          "type": "string"
        },
        "toParticipant": {
          "type": "string"
        }
      }
    },
    "data": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "recordIndicator": {
            "type": "number"
          },
          "nmi": {
            "type": "string"
          },
          "nmiConfiguration": {
            "type": "string"
          },
          "registerId": {
            "type": "string"
          },
          "nmiSuffix": {
            "type": "string"
          },
          "meterSerialNumber": {
            "type": "string"
          },
          "uom": {
            "type": "string"
          },
          "intervalLength": {
            "type": "number"
          },
          "intervalData": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "recordIndicator": {
                  "type": "number"
                },
                "intervalDate": {
                  "type": "string"
                },
                "intervalValues": {
                  "type": "array",
                  "items": {
                    "type": "number"
                  }
                },
                "qualityMethod": {
                  "type": "string"
                },
                "reasonCode": {
                    "type": "number"
                  },
                "updateDateTime": {
                  "type": "string"
                },
                "msatsLoadDateTime": {
                    "type": "string"
                },
                "intervalEvents": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "recordIndicator": {
                        "type": "number"
                      },
                      "startInterval": {
                        "type": "number"
                      },
                      "endInterval": {
                        "type": "number"
                      },
                      "qualityMethod": {
                        "type": "string"
                      },
                      "reasonCode": {
                        "type": "number"
                      }
                    }
                  }
                },
                "b2bDetails": {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      "recordIndicator": {
                        "type": "number"
                      },
                      "transCode": {
                        "type": "string"
                      },
                      "retServiceOrder": {
                        "type": "string"
                      },
                      "readDateTime": {
                        "type": "string"
                      },
                      "indexRead": {
                        "type": "number"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "footer": {
      "type": "object",
      "properties": {
        "recordIndicator": {
          "type": "number"
        }
      }
    }
  }
}
```

#### Wide CSV (additive values only at 30 minute granularity)

|interval_date|nmi|register_id|nmi_suffix|mdm_data_stream_identifier|meter_serial_number|next_scheduled_read_date|quality_method|update_datetime|uom|original_interval_length|interval_0030|interval_0100|...|interval_2330|interval_0000|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

#### Long CSV

|interval_date|nmi|register_id|nmi_suffix|mdm_data_stream_identifier|meter_serial_number|next_scheduled_read_date|update_datetime|uom|interval_length|quality_method|reason_code|reason_description|interval_start_timestamp|interval_end_timestamp|read_value|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

### Limitations

- Performs basic validation only (file structure). Invalid data may be read.
- Requires re-compile if the parsing grammar changes.
- Wide 30 minute CSV output filters to additive UOMs only as it doesn't make sense to sum non-additive UOMs.
