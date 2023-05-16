import bot from "./app.js";
import { writeGoogle, readGoogle } from './crud.js';
import { dataBot, ranges } from './values.js';

const postingLots = () => {
    bot.on('message', async (message) => {
        if (message.text < 9999999) {
          try {
            const rowNumber = parseInt(message.text);
            const lot = await readGoogle(ranges.postContentLine(rowNumber));
            if (lot && lot.length > 0) {
              const message = lot.join('\n')
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
}

export { postingLots }
