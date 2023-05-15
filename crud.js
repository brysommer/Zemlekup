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
    return response.data.values[0];
};

export { writeGoogle, readGoogle }
  