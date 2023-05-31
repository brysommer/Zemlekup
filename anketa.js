import { bot } from "./app.js";
import { dataBot, ranges } from './values.js';
import { writeGoogle, readGoogle } from './crud.js';
import { checkStatus, editingMessage } from './interval.js';
import { phrases, keyboards } from './language_ua.js';
import { sendAvaliableToChat } from './postingLot.js';
import { logger } from './logger/index.js';

let customerInfo = {};

const checkAndAssignChatStatus = (customerInfo, chatId) => {
  if (!customerInfo.hasOwnProperty(chatId)) {
    customerInfo[chatId] = {};
    customerInfo[chatId].phone = undefined;
    customerInfo[chatId].name = undefined;
    customerInfo[chatId].chatStatus = '';
  }
};

export const anketaListiner = async() => {
    bot.setMyCommands([
      {command: '/start', description: 'Почати'},
      {command: '/list', description: 'Показати доступні лоти'},
    ]);

    bot.on("callback_query", async (query) => {

      const action = query.data;
      const chatId = query.message.chat.id;
      checkAndAssignChatStatus(customerInfo, chatId); 

      switch (action) {
        case '/start':
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          bot.sendMessage(chatId, phrases.greetings, { reply_markup: keyboards.listInline });
          break;
        case '/list':
          await sendAvaliableToChat(chatId, bot);
          break;
        case '/autocontact':
          bot.sendMessage(chatId, 'Ця функція не працює в WEB версії Telegram' ,{ reply_markup: { keyboard: [[{ text: 'Легко поділитися номером', request_contact: true, } ]], resize_keyboard: true, one_time_keyboard: true }});  
          break;
        case  '/manualcontact':
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          customerInfo[chatId].chatStatus = 'phoneManual';
          bot.sendMessage(chatId, phrases.phoneRules, {
            reply_markup: { inline_keyboard: [[{ text: 'Почати спочатку', callback_data: '/start' }]] },
          });
          break;
        case '/comleate':
          if (!([chatId] in customerInfo)) bot.sendMessage(chatId, phrases.noContacts);
          else {
            const status = await readGoogle(ranges.statusCell(customerInfo[chatId].lotNumber))
            console.log(status[0]);
            if (status[0] === 'reserve') {
              try {
                await writeGoogle(ranges.statusCell(customerInfo[chatId].lotNumber), [['done']]);
                await writeGoogle(ranges.userNameCell(customerInfo[chatId].lotNumber), [[customerInfo[chatId].name]]);
                await writeGoogle(ranges.userPhoneCell(customerInfo[chatId].lotNumber), [[customerInfo[chatId].phone]]);
                await editingMessage(customerInfo[chatId].lotNumber);
                await bot.sendMessage(chatId, phrases.thanksForOrder(customerInfo[chatId].name)); 
                logger.warn(`USER_ID: ${chatId} comleate order`); 
              } catch (error) {
                logger.error(`Something went wrong on finishing order for lot#${customerInfo[chatId].lotNumber} from customer ${chatId}. Error: ${error}`);
              }
            } else {
              bot.sendMessage(chatId, phrases.aleadySold);
            }
          } 
          break;
        default: 
          let selectedLot = query.data;
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
            bot.sendMessage(chatId, phrases.contactRequest, { reply_markup: keyboards.contactRequestInline });
          } else bot.sendMessage(chatId, phrases.aleadySold);
        break;
      }
    })
    
    bot.on('message', async (msg) => {
      console.log(customerInfo);
      const chatId = msg.chat.id;
      checkAndAssignChatStatus(customerInfo, chatId);   
      if (msg.contact) {
        if (!customerInfo[chatId]) { customerInfo[chatId] = {} };
        customerInfo[chatId].name = msg.contact.first_name;
        customerInfo[chatId].phone = msg.contact.phone_number;
        bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), { 
          reply_markup: keyboards.inlineConfirmation });
      } else if (customerInfo[chatId].chatStatus === 'phoneManual') {
        customerInfo[chatId].phone = msg.text;
        customerInfo[chatId].chatStatus = 'nameManual';
        bot.sendMessage(chatId, phrases.nameRequest);
      } else if (customerInfo[chatId].chatStatus === 'nameManual') {
        if (msg.text.length >= 2) {
          customerInfo[chatId].name = msg.text;
          customerInfo[chatId].chatStatus = '';
          bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), {
            reply_markup: keyboards.inlineConfirmation });
        };  
      }

      switch (msg.text) {
        case '/start':
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          bot.sendMessage(msg.chat.id, phrases.greetings, { reply_markup: keyboards.listInline });
          break;
        case 'Зробити замовлення':
        case '/list':
          await sendAvaliableToChat(msg.chat.id, bot);
          break;
        case `Ні, я введу номер вручну`:
        case 'Ні, повторити введення':
          break;
        case 'Так, Оформити замовлення':
      };
  });
};