import TelegramBot from 'node-telegram-bot-api';
import { getSpreadsheetData } from "./filedata.js";
import { anketaListiner } from './anketa.js';
import { dataBot, ranges } from './values.js';
import { writeGoogle } from './crud.js';

const bot = new TelegramBot(dataBot.telegramBotToken, { polling: true });
export default bot;

anketaListiner();
//channel lots autoposting
bot.on('message', async (message) => {
  if (message.text < 9999999) {
    try {
      const rowNumber = parseInt(message.text);
      const data = await getSpreadsheetData(dataBot.googleSheetId, `${dataBot.googleSheetName}!${dataBot.content.startColumn}${rowNumber}:${dataBot.content.endColumn}${rowNumber}`);
      if (data.values && data.values.length > 0) {
        const message = data.values[0].join('\n')
        .replace(/^/, '\u{1F4CA} ') // add diagramm in 1 line 
        .replace(/^.*\n.*\n.*\n.*\n/, '$&\u{1F69C} '); // add tractor in 4 line
        const keyboard = { inline_keyboard: [[{ 
          text: 'Скористайтеся ботом, щоб зробити замовлення',
          url: dataBot.botUrl,
        }]] };
        const sentMessage = await bot.sendMessage(dataBot.channelId, message, { reply_markup: keyboard });
        await writeGoogle(ranges.message_idCell(rowNumber), [[sentMessage.message_id]]);
      }
    } catch (error) {
      console.error(error);
    }
  }
});