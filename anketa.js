import { bot } from "./app.js";
import { dataBot, ranges } from './values.js';
import { writeGoogle, readGoogle } from './crud.js';
import { checkStatus, editingMessage, getLotContentByID } from './interval.js';
import { phrases, keyboards } from './language_ua.js';
import { sendAvaliableToChat, filterKeyboard, sendFiltredToChat } from './postingLot.js';
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

      const checkRegex = (string) => {
        const regex = /state\p{L}+/gu;
        return regex.test(string);
      }

      if(!isNaN(Number(action))) {
        let selectedLot = query.data;
        customerInfo[chatId] = { lotNumber : query.data, phone: undefined, name: undefined };
        const choosenLotStatus = await readGoogle(ranges.statusCell(customerInfo[chatId].lotNumber));
        if (choosenLotStatus[0] === 'new') {
          try {
            await writeGoogle(ranges.statusCell(customerInfo[chatId].lotNumber), [['reserve']]);
            logger.info(`USER_ID: ${chatId} reserved lot#${selectedLot}`);
            customerInfo[chatId].chatStatus = '';
          } catch (error) {
            logger.warn(`Impossible reserve lot#${selectedLot}. Error: ${err}`);
          }
          try {
            await writeGoogle(ranges.user_idCell(customerInfo[chatId].lotNumber), [[`${chatId}`]]);
          } catch (error) {
            logger.warn(`Impossible to write chatId#${chatId} to sheet. Error: ${err}`);
          }
          checkStatus(selectedLot, chatId);
          const message = await bot.sendMessage(chatId, phrases.contactRequest, { reply_markup: keyboards.contactRequestInline });
          customerInfo[chatId].recentMessage = message.message_id;
        } else bot.sendMessage(chatId, phrases.aleadySold);
      } else if(checkRegex(action)) {
        await sendFiltredToChat(chatId, action, ranges.stateColumn);
        
      }
      switch (action) {
        case '/start':
          bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          const message3 = bot.sendMessage(chatId, phrases.greetings, { reply_markup: keyboards.listInline });
          customerInfo[chatId].recentMessage = message3.message_id;
          break;
        case '/list':
          bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          await sendAvaliableToChat(chatId, bot);
          break;
        case '/autocontact':
          bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          const message = await bot.sendMessage(chatId, '.', {
            reply_markup: { inline_keyboard: [[{ text: 'Почати спочатку', callback_data: '/start' }]] },
          });
          bot.sendMessage(chatId, 'Ця функція не працює в WEB версії Telegram' ,{ reply_markup: { keyboard: [[{ text: 'Легко поділитися номером', request_contact: true, } ]], resize_keyboard: true, one_time_keyboard: true }});  
          customerInfo[chatId].recentMessage = message.message_id;
          break;
        case  '/manualcontact':
          bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          customerInfo[chatId].chatStatus = 'phoneManual';
          const message1 = await bot.sendMessage(chatId, phrases.phoneRules, {
            reply_markup: { inline_keyboard: [[{ text: 'Почати спочатку', callback_data: '/start' }]] },
          });
          customerInfo[chatId].recentMessage = message1.message_id;
          break;
        case '/comleate':
          bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
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
                const soldLotContent = await getLotContentByID(customerInfo[chatId].lotNumber);
                await bot.sendMessage(chatId, phrases.thanksForOrder(customerInfo[chatId].name));
                await bot.sendMessage(chatId, soldLotContent); 
                logger.warn(`USER_ID: ${chatId} comleate order`); 
              } catch (error) {
                logger.error(`Something went wrong on finishing order for lot#${customerInfo[chatId].lotNumber} from customer ${chatId}. Error: ${error}`);
              }
            } else {
              bot.sendMessage(chatId, phrases.aleadySold);
            }
          } 
          break;
      }
    })
    
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      checkAndAssignChatStatus(customerInfo, chatId);   
      if (msg.contact) {
        if (!customerInfo[chatId]) { customerInfo[chatId] = {} };
        customerInfo[chatId].name = msg.contact.first_name;
        customerInfo[chatId].phone = msg.contact.phone_number;
        bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        const message = await bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), { 
          reply_markup: keyboards.inlineConfirmation });
        customerInfo[chatId].recentMessage = message.message_id;
        console.log(customerInfo[chatId].recentMessage)
      } else if (customerInfo[chatId].chatStatus === 'phoneManual') {
        bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        customerInfo[chatId].phone = msg.text;
        customerInfo[chatId].chatStatus = 'nameManual';
        const message = await bot.sendMessage(chatId, phrases.nameRequest);
        customerInfo[chatId].recentMessage = message.message_id;
      } else if (customerInfo[chatId].chatStatus === 'nameManual') {
        bot.deleteMessage(chatId, customerInfo[chatId].recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        customerInfo[chatId].name = msg.text;
        customerInfo[chatId].chatStatus = '';
        const message = await bot.sendMessage(chatId, phrases.dataConfirmation(customerInfo[chatId].phone, customerInfo[chatId].name), {
          reply_markup: keyboards.inlineConfirmation });
        customerInfo[chatId].recentMessage = message.message_id;
      }


      switch (msg.text) {
        case '/filter': 
          filterKeyboard(chatId, 'Область', ranges.stateColumn);
          break;
        case '/start':
          customerInfo[chatId].phone = undefined;
          customerInfo[chatId].name = undefined;
          const message = await bot.sendMessage(msg.chat.id, phrases.greetings, { reply_markup: keyboards.listInline });
          customerInfo[chatId].recentMessage = message.message_id;
          break;
        case 'Зробити замовлення':
        case '/list':
          await sendAvaliableToChat(msg.chat.id, bot);
          break;
      };
  });
};