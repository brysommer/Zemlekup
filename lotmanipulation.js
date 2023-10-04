import { readGoogle } from './crud.js';
import { dataBot } from './values.js';
import { createNewLot } from './models/lots.js';

const getLotData = async (lotNumber) => {
    const range = `${dataBot.googleSheetName}!A${lotNumber}:S${lotNumber}`;
    const data = await readGoogle(range);
    const lotData = {
        cadastral_number: data[2],
        state: data[11],
        region: data[12],
        lot_status: data[13],
        lotNumber
    };
    const newLot = await createNewLot(lotData);
    console.log(newLot);
}

export { getLotData };