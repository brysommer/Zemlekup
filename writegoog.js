import { getClient, getSheetsInstance } from "./google.js";
import { dataBot } from './values.js';

const spreadsheetId = dataBot.googleSheetId;
const sheetName = dataBot.googleSheetName;

const logErrorToConsole = (data) => {
  console.log(`Status "${data}" not found in spreadsheet`);
}

export const writeSpreadsheetData = async (spreadsheetId, range, data) => {
  const client = await getClient();
  const sheets = getSheetsInstance(client);
  const request = {
    spreadsheetId,
    range,
    valueInputOption: "USER_ENTERED",
    resource: { values: data },
  };
  const response = await sheets.spreadsheets.values.update(request);
  return response.data;
};
//ВИКОРИСТОВУЄТЬСЯ!!!!//
const sendToBaseMessageId = async (id, rowNumber) => {
  if (rowNumber) {
    await writeSpreadsheetData(spreadsheetId, `${sheetName}!${dataBot.content.message_idColumn}${rowNumber}`, [[id]]);
  } else logErrorToConsole(id);
};

export {
  sendToBaseMessageId,
}

