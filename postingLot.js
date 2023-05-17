import bot from "./app.js";
import { writeGoogle, readGoogle } from './crud.js';
import { dataBot, ranges } from './values.js';

const postingLots = () => {
    bot.on('message', async (message) => {
        if (message.text < 9999999 && message.text != 1) {
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
};

const sendAvaliableToChat = async (chatId, bot) => {
  const readedStatus = await readGoogle(ranges.statusColumn);
  const newRows = readedStatus
    .map((value, index) => value === "new" ? index + 1 : null)
    .filter(value => value !== null);
  const contentPromises = newRows.map(rowNumber => readGoogle(ranges.postContentLine(rowNumber)));
  const rowDataArray = await Promise.all(contentPromises);
  console.log(rowDataArray);
  rowDataArray.forEach((element, index) => {
      const rowNumber = newRows[index];
      const rowText = `\u{1F4CA} ${element[0]} \n ${element[1]} \n ${element[2]} \n ${element[3]} \n \u{1F69C} ${element[4]}`;; // Adds a smiley emoji
      bot.sendMessage(chatId, rowText, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
  });
};

export { postingLots, sendAvaliableToChat }
