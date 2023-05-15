import { getSpreadsheetData } from "./filedata.js";

const getArrayFromColumn = async (spreadsheetId, sheetName, columnName) => {
    const data = await getSpreadsheetData(spreadsheetId, `${sheetName}!${columnName}:${columnName}`);
    return data.values.map(row => row[0]);
};
//ВИКОРИСТОВУЄТЬСЯ!!!
const sendNewRowsToTelegram = async (spreadsheetId, sheetName, columnName, chatId, bot) => {
  const getStatusData = await  getArrayFromColumn(spreadsheetId, sheetName, columnName);
  const newRows = getStatusData
    .map((value, index) => value === "new" ? index + 1 : null)
    .filter(value => value !== null);
  const rowPromises = newRows.map(rowNumber => getSpreadsheetData(spreadsheetId, `${sheetName}!A${rowNumber}:I${rowNumber}`));
  const rowDataArray = await Promise.all(rowPromises);
  rowDataArray.forEach((rowData, index) => {
      const rowNumber = newRows[index];
      const rowText = `\u{1F4CA} ${rowData.values[0][0]} \n ${rowData.values[0][1]} \n ${rowData.values[0][2]} \n ${rowData.values[0][3]} \n \u{1F69C} ${rowData.values[0][4]}`;; // Adds a smiley emoji
      bot.sendMessage(chatId, rowText, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
  });
};

export {
  sendNewRowsToTelegram
};