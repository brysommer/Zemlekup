import { findLotsByStatus } from '../models/lots.js';

export const myLotsDataList = async (chatid) => {
    const status = 'done'
    const soldLots = await findLotsByStatus(status);
    if (!soldLots) return //тимчасова заглушка
    const myLots = soldLots.filter(item => item.user_id === chatid);
    let myLotsList = '';
    myLots.forEach(item => {
        const pricePerArea = item.price/item.area;
        const expectedRevenue = item.price*item.revenue/100;
        const message = `📊 ${item.area} га, ₴  ${item.price} ( ${pricePerArea} грн/га) 
дохідність ${item.revenue}% 
очікуваний річний дохід  ${expectedRevenue} грн
${item.cadastral_number} 
${item.state} область, ${item.region} район 
🚜 орендар: ${item.tenant} , ${item.lease_term} років
        
`;
        myLotsList = myLotsList + message;
    });
    console.log(myLotsList);
    return myLotsList;
}

