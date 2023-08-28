import { readGoogle } from './crud.js';
import { dataBot } from './values.js';
import { createNewLot } from './models/lots.js';

const getLotData = async (lotNumber) => {
    const range = `${dataBot.googleSheetName}!K${lotNumber}:R${lotNumber}`;
    const data = await readGoogle(range);
    const lotData = {
        area: data[2],
        price: data[3],
        revenue: data[4],
        cadastral_number: data[7],
        state: data[0],
        region: data[1],
        tenant: data[5],
        lease_term: data[6],
    };
    const newLot = await createNewLot(lotData);
    console.log(newLot);
}

export { getLotData };