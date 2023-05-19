import { getClient, getSheetsInstance } from "./google.js";
import { dataBot } from './values.js';

const spreadsheetId = dataBot.googleSheetId;

const writeGoogle = async (range, data) => {
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

const readGoogle = async (range) => {
    const client = await getClient();
    const sheets = getSheetsInstance(client);
    const response = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    if (response.data.values) {
      if (response.data.values.length > 1) return response.data.values.map(row => row[0]);
      return response.data.values[0];
    } 
    return response.data;
};

export { writeGoogle, readGoogle }
  