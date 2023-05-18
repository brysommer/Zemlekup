import { bot } from "./app.js";
import { dataBot, ranges } from './values.js';
import { writeGoogle, readGoogle } from './crud.js';
import { checkStatus } from './interval.js';
import { phrases, keyboards } from './language_ua.js';
import { sendAvaliableToChat } from './postingLot.js';
import { logger } from './logger/index.js';

let customerPhone;
let customerName;
let customerInfo = {};
const phoneRegex = /^\d{10,12}$/;

export const anketaListiner = async() => {
    bot.setMyCommands([
      {command: '/start', description: 'Почати'},
      {command: '/list', description: 'Показати доступні лоти'},
    ]);

    bot.on("callback_query", async (query) => {
      let selectedLot = query.data;
      const chatId = query.message.chat.id;
      customerInfo[chatId] = { lotNumber : query.data, phone: undefined, name: undefined };
      const choosenLotStatus = await readGoogle(ranges.statusCell(customerInfo[chatId].lotNumber));
      if (choosenLotStatus[0] === 'new') {
        try {
          await writeGoogle(ranges.statusCell(customerInfo[chatId].lotNumber), [['reserve']]);
          await writeGoogle(ranges.user_idCell(customerInfo[chatId].lotNumber), [[`${chatId}`]]);
          logger.info(`USER_ID: ${chatId} reserved lot#${selectedLot}`);
        } catch (error) {
          logger.error(`Impossible reserve lot#${selectedLot}. Error: ${err}`);
        }
        checkStatus(selectedLot, chatId);
        bot.sendMessage(chatId, phrases.contactRequest,
          { reply_markup: { keyboard: keyboards.contactRequest, resize_keyboard: true }});
      } else bot.sendMessage(chatId, phrases.aleadySold);
    })
    
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      if (msg.contact) {
        if (!customerInfo[chatId]) {
          customerInfo[chatId] = {};
        }
        customerInfo[chatId].name = msg.contact.first_name;
        customerInfo[chatId].phone = msg.contact.phone_number;
        customerPhone = msg.contact.phone_number;
        customerName = msg.contact.first_name;
        bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), { 
          reply_markup: { keyboard: keyboards.dataConfirmation, resize_keyboard: true, one_time_keyboard: true }});
      } else if (phoneRegex.test(msg.text)) {
        customerInfo[chatId].phone = msg.text;
        customerPhone = msg.text;
        bot.sendMessage(chatId, phrases.nameRequest);
      } else if ((customerPhone && customerName == undefined)) {
        if (msg.text.length >= 2) {
          customerName = msg.text;
          customerInfo[chatId].name = msg.text;
          bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), {
            reply_markup: { keyboard: keyboards.dataConfirmation, resize_keyboard: true, one_time_keyboard: true },
          });
        };  
      }

      switch (msg.text) {
        case '/start':
        case 'Почати спочатку':
          customerPhone = undefined;
          customerName = undefined;
          bot.sendMessage(msg.chat.id, phrases.greetings, {
              reply_markup: { keyboard: keyboards.startingKeyboard, resize_keyboard: true, one_time_keyboard: true }
          });
          break;
        case 'Зробити замовлення':
        case '/list':
          await sendAvaliableToChat(msg.chat.id, bot);
          break;
        case `Ні, я введу номер вручну`:
        case 'Ні, повторити введення':
          customerPhone = undefined;
          customerName = undefined;  
          bot.sendMessage(chatId, phrases.phoneRules, {
            reply_markup: { keyboard: keyboards.enterPhone, resize_keyboard: true },
          });
          break;     
        case 'Так, Оформити замовлення':
          if (!([chatId] in customerInfo)) bot.sendMessage(chatId, phrases.noContacts);
          else {
            try {
              await writeGoogle(ranges.statusCell(customerInfo[chatId].lotNumber), [['done']]);
              await writeGoogle(ranges.userNameCell(customerInfo[chatId].lotNumber), [[customerInfo[chatId].name]]);
              await writeGoogle(ranges.userPhoneCell(customerInfo[chatId].lotNumber), [[customerInfo[chatId].phone]]);
              const editingMessage = async () => {
                const message_id = await (await readGoogle(ranges.message_idCell(customerInfo[chatId].lotNumber)))[0];
                const oldMessage = await readGoogle(ranges.postContentLine(customerInfo[chatId].lotNumber));
                const oldMessageString = oldMessage.join('\n');
                const newMessage = "📌 " + oldMessageString;
                if (message_id) {
                  try {
                    await bot.editMessageText(newMessage, {chat_id: dataBot.channelId, message_id: message_id});
                  } catch (error) {}
                } 
              };
              await editingMessage();
              await bot.sendMessage(chatId, phrases.thanksForOrder(customerInfo[chatId].name)); 
              logger.warn(`USER_ID: ${chatId} comleate order`); 
            } catch (error) {
              logger.error(`Something went wrong on finishing order for lot#${customerInfo[chatId].lotNumber} from customer ${chatId}. Error: ${error}`);
            }
          } 
          break;
      };
  });
};