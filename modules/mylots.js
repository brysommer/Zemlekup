import { findLotsByStatus } from '../models/lots.js';

export const myLotsDataList = async (chatid) => {
    const status = 'done'
    const soldLots = await findLotsByStatus(status);
    const myLots = soldLots.filter(item => item.user_id === chatid);
    let myLotsList = '';
    myLots.forEach(item => {
        const pricePerArea = item.price/item.area;
        const message = `📊 ${item.area} га, ₴  ${item.price} ( ${pricePerArea} грн/га) 
дохідність ${item.revenue}% 
${item.cadastral_number} 
${item.state} область, ${item.region} район 
🚜 орендар: ${item.tenant} , ${item.lease_term} років
        
`;
        myLotsList = myLotsList + message;
    });
    console.log(myLotsList);
    return myLotsList;
}

