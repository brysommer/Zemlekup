import { findLotsByStatusAndState, findLotsByStatusAndRegion } from '../models/lots.js';
import { bot } from "../app.js";

const regionFilterKeyboard = async (chatId, state) => {
    const stateData = await findLotsByStatusAndState('new', state);
    let allRegions = [];
    stateData.forEach(item => {
        if (item?.region) {
            allRegions.push(item.region)
        }});
    const regionsList = allRegions.filter((value, index, self) => self.indexOf(value) === index);
    console.log(regionsList);
    const result = [];
    const chunkSize = 3; 
  
    for (let i = 0; i < regionsList.length; i += chunkSize) {
      const chunk = regionsList.slice(i, i + chunkSize);
      const row = chunk.map(region => ({
        text: region,
        callback_data: `region${region}`
      }));
      result.push(row);
    };
  
    bot.sendMessage(chatId, `Виберіть район:`, { reply_markup: { inline_keyboard: result } });

  }

  const getLotContentFromData = (lot) => {
    const message = `\u{1F4CA} ${lot.area} га, ₴ ${lot.price} ( ${lot.area/lot.price} грн/га) \n дохідність ${lot.revenue} % \n ${lot.cadastral_number} \n ${lot.state} область, ${lot.region} район \n \u{1F69C} орендар: ${lot.tenant}, ${lot.lease_term} років`;
    return message;
}
  const sendFiltredByRegToChat = async (chatId, region) => {
    const regionLots = await findLotsByStatusAndRegion('new', region);
    const lotsData = regionLots.map(el => getLotContentFromData(el));
    lotsData.forEach(async (element, index) => {
      const rowNumber = regionLots[index].lotNumber;
      await bot.sendMessage(chatId, element, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
    });
  };

export { regionFilterKeyboard, sendFiltredByRegToChat };


  
  