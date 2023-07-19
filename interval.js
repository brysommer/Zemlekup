import { readGoogle, writeGoogle } from './crud.js';
import { dataBot, ranges } from './values.js';
import { bot } from "./app.js";
import { logger } from './logger/index.js';
import { keyboards } from './language_ua.js';


export const getLotContentByID = async (lotNumber) => {
    const content = await readGoogle(ranges.postContentLine(lotNumber));
    const message = `\u{1F4CA} ${content[0]} \n ${content[1]} \n ${content[2]} \n ${content[3]} \n \u{1F69C} ${content[4]}`;
    return message;
}

// 🗽🌞
const checkStatus = (rowNumber, chat_id) => {
    setTimeout(async () => {
        const response = await readGoogle(ranges.statusCell(rowNumber));
        const message = await getLotContentByID(rowNumber);
        const data = response[0];
        if (data === 'reserve') {
            try {
                await bot.sendMessage(chat_id, 'Ви забронювали ділянку, завершіть замовлення. Незабаром ділянка стане доступною для покупки іншим користувачам');
                await bot.sendMessage(chat_id, message, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
                logger.info(`USER_ID: ${chat_id} received first reminder 🎃 about lot#${rowNumber}`);
            } catch (error) {
                logger.error(`Impossible to send remind about lot#${rowNumber}. Error: ${err}`);
            }
            setTimeout(async () => {
                const response = await readGoogle(ranges.statusCell(rowNumber));
                const data = response[0];
                if (data === 'reserve') {
                    bot.sendMessage(chat_id, 'Ділянка яку ви бронювали доступна для покупки');
                    try {
                        await writeGoogle(ranges.statusCell(rowNumber), [['new']]);
                        await refreshMessage(rowNumber);
                        await bot.sendMessage(chat_id, message, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
                        logger.info(`USER_ID: ${chat_id} received second reminder about lot#${rowNumber}. Lot#${rowNumber} avaliable for selling again ⛵`);
                    } catch (error) {
                        logger.error(`Impossible to send remind about lot#${rowNumber}. Error: ${error}`);
                    }
                    setTimeout(async () => {
                        const response = await readGoogle(ranges.statusCell(rowNumber));
                        const data = response[0];
                        if (data === 'new') {
                            try {
                                await bot.sendMessage(chat_id, 'Ділянка якою ви цікавились ще не продана');
                                await bot.sendMessage(chat_id, message, { reply_markup: { inline_keyboard: [[{ text: "Купити ділянку", callback_data: `${rowNumber}` }]] } });
                                logger.info(`USER_ID: ${chat_id} received LAST CHANCE 🚸 remind about lot#${rowNumber}`);
                            } catch (error) {
                                logger.error(`Impossible to send remind about lot#${rowNumber}. Error: ${err}`);
                            }
                        } return false;
                    }, dataBot.lastChanceFirst);
                } return false;
            }, dataBot.secondReminder);
        } return false;
    }, dataBot.firstReminder);
} 


const editingMessage = async (lotNumber) => {
    const message_id = await (await readGoogle(ranges.message_idCell(lotNumber)))[0];
    const oldMessage = await readGoogle(ranges.postContentLine(lotNumber));
    const oldMessageString = oldMessage.join('\n');
    const newMessage = "📌 " + oldMessageString;
    try {
        await bot.editMessageText(newMessage, {chat_id: dataBot.channelId, message_id: message_id});
    } catch (error) {
        logger.warn(`Can't edit. Message ID: ${message_id}. Reason: ${error}`);
    }
  } 

  const refreshMessage = async (lotNumber) => {
    const message_id = await (await readGoogle(ranges.message_idCell(lotNumber)))[0];
    const content = await readGoogle(ranges.postContentLine(lotNumber));
    const formattedMessage = `\u{1F4CA} ${content[0]} \n ${content[1]} \n ${content[2]} \n ${content[3]} \n \u{1F69C} ${content[4]}`;
    const newMessage = "Знову доступна 😉 \n " + formattedMessage;
    try {
        await bot.editMessageText(newMessage, {chat_id: dataBot.channelId, message_id: message_id, reply_markup: keyboards.channelKeyboard });
    } catch (error) {
        logger.warn(`Can't edit. Message ID: ${message_id}. Reason: ${error}`);
    }
  } 

  const editingMessageReserved = async (lotNumber) => {
    const message_id = await (await readGoogle(ranges.message_idCell(lotNumber)))[0];
    const oldMessage = await readGoogle(ranges.postContentLine(lotNumber));
    const oldMessageString = oldMessage.join('\n');
    const newMessage = "РЕЗЕРВ 🙄 \n'" + oldMessageString;
    try {
        await bot.editMessageText(newMessage, {chat_id: dataBot.channelId, message_id: message_id, });
    } catch (error) {
        logger.warn(`Can't edit. Message ID: ${message_id}. Reason: ${error}`);
    }
  } 

export { checkStatus, editingMessage, editingMessageReserved };