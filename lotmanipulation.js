import { readGoogle } from './crud.js';
import { dataBot } from './values.js';
import { createNewLot } from './models/lots.js';

const getLotData = async (lotNumber) => {
    const range = `${dataBot.googleSheetName}!A${lotNumber}:X${lotNumber}`;
    const data = await readGoogle(range);
    const lotData = {
        cadastral_number: data[2],
        state: data[6],
        region: data[21],
        lot_status: data[13],
        lotNumber: lotNumber-1,
        area: data[18],
        price: data[19],
        revenue: data[20],
        tenant: data[22],
        lease_term: data[23],
    };
    const newLot = await createNewLot(lotData);
    console.log(newLot);
}

export { getLotData };