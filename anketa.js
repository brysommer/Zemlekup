import { bot } from "./app.js";
import { ranges } from './values.js';
import { writeGoogle, readGoogle } from './crud.js';
import { checkStatus, editingMessage, getLotContentByID, editingMessageReserved } from './interval.js';
import { phrases, keyboards } from './language_ua.js';
import { sendAvaliableToChat, filterKeyboard, sendFiltredToChat, cuttingCallbackData } from './postingLot.js';
import { logger } from './logger/index.js';
import { 
  updateRecentMessageByChatId,
  updateChatStatusByChatId,
  createNewUserByChatId,
  updateUserByChatId,
  findUserByChatId
} from './models/users.js';
import { updateReservist_idByLotNumber, findReservByLotNumber, createNewReserv } from './models/reservations.js';
import { updateStatusByLotNumber, updateLotIDByLotNumber } from './models/lots.js';
import { myLotsDataList } from './modules/mylots.js';
import { addUserToWaitingList } from './modules/waitinglist.js';
//import { regionFilterKeyboard, sendFiltredByRegToChat } from './modules/regionfilter.js';

export const anketaListiner = async() => {
    bot.setMyCommands([
      {command: '/start', description: 'Почати'},
      {command: '/list', description: 'Показати усі доступні лоти'},
      {command: '/filter', description: 'Фільтрувати ділянки за областями'},
      {command: '/reserved', description: 'Переглянути заброньовані ділянки'},
      {command: '/mylots', description: 'Переглянути придбані ділянки'}
    ]);

    bot.on("callback_query", async (query) => {
      const action = query.data;
      const chatId = query.message.chat.id;
      const userInfo = await findUserByChatId(chatId);
      
      
      const checkRegex = (string, word) => {
        const regex = new RegExp(`${word}\\p{L}+`, 'gu');
        return regex.test(string);
      }

      if (userInfo?.isBan) {
        await bot.sendMessage(chatId, `Ваш акаунт заблоковано`);
        return
      } else if(!isNaN(Number(action))) {
        let selectedLot = query.data;
        const choosenLotStatus = await readGoogle(ranges.statusCell(selectedLot));
        const reserv = await findReservByLotNumber(selectedLot);
        if (!reserv) await createNewReserv(selectedLot);
        if (choosenLotStatus[0] === 'new' || reserv?.reservist_id == chatId) {
          try {
            //await writeGoogle(ranges.statusCell(selectedLot), [['reserve']]);
            //await editingMessageReserved(selectedLot);
            if (userInfo?.isAuthenticated) {
              logger.info(`User: ${userInfo.firstname} reserved lot#${selectedLot}. Contact information: ${userInfo.contact}`);
            } else {
              logger.info(`Unregistred user reserved lot#${selectedLot}, USER_ID: ${chatId} `);
            }
            await updateChatStatusByChatId(chatId, '');
          } catch (error) {
            logger.warn(`Impossible reserve lot#${selectedLot}. Error: ${error}`);
          }
          try {
            await writeGoogle(ranges.user_idCell(selectedLot), [[`${chatId}`]]);
            //here We adding reservist chatid to reservations sheet will delate line over in next updates
            await updateReservist_idByLotNumber(chatId, selectedLot);
          } catch (error) {
            logger.warn(`Impossible to write chatId#${chatId} to sheet. Error: ${error}`);
          }
          checkStatus(selectedLot, chatId);
          await updateUserByChatId(chatId, { lotNumber: selectedLot });
          if (userInfo?.isAuthenticated) {
            const message = await bot.sendMessage(chatId, `Раді вас знову бачити ${userInfo.firstname}`, { reply_markup: keyboards.finishOrder });
            await updateRecentMessageByChatId(chatId, message.message_id);  
          } else {
            const message = await bot.sendMessage(chatId, phrases.contactRequest, { reply_markup: keyboards.contactRequestInline });
            await updateRecentMessageByChatId(chatId, message.message_id);  
          }
        } else {
        //here waitlist updating function starting
        const waitlist = await addUserToWaitingList(selectedLot, chatId);
        if (waitlist) {
          await bot.sendMessage(chatId, `${phrases.waitlist}${waitlist}`);
        } else {
          await bot.sendMessage(chatId, phrases.alreadyWaiting);
        }
        //bot.sendMessage(chatId, phrases.aleadySold);
        }
      } else if(checkRegex(action, 'state')) {
        //const stateName = cuttingCallbackData(action, 'state');
        //console.log(stateName);
        //await regionFilterKeyboard(chatId, stateName);
        await sendFiltredToChat(chatId, action, ranges.stateColumn);
      } //else if(checkRegex(action, 'region')) {
       // const regionName = cuttingCallbackData(action, 'region');
       // console.log(regionName);
       // await sendFiltredByRegToChat(chatId, regionName);
    //  }
      switch (action) {
        case '/start':
          bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          const message3 = bot.sendMessage(chatId, phrases.greetings, { reply_markup: keyboards.listInline });
          await updateRecentMessageByChatId(chatId, message3.message_id);
          break;
        case '/filter': 
          await filterKeyboard(chatId, 'Область', ranges.stateColumn);
          break;
        case '/list':
          bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          await sendAvaliableToChat(chatId, bot);
          break;
        case '/autocontact':
          bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          const message = await bot.sendMessage(chatId, `Для користувачів Telegram WEB` , {
            reply_markup: { inline_keyboard: [[{ text: 'Ввести контакти', callback_data: '/manualcontact' }]] },
          });
          bot.sendMessage(chatId, 'Натисніть на кнопку "Легко поділитися номером" щоб ми отримали доступ до вашого номеру телефону' ,{ reply_markup: { keyboard: [[{ text: 'Легко поділитися номером', request_contact: true, } ]], resize_keyboard: true, one_time_keyboard: true }});  
          await updateRecentMessageByChatId(chatId, message.message_id);
          break;
        case  '/manualcontact':
          bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          await updateChatStatusByChatId(chatId, 'phoneManual')
          const message1 = await bot.sendMessage(chatId, phrases.phoneRules, {
            reply_markup: { inline_keyboard: [[{ text: 'Почати спочатку', callback_data: '/start' }]] },
          });
          await updateRecentMessageByChatId(chatId, message1.message_id);
          break;
        case '/comleate':
          bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
          const status = await readGoogle(ranges.statusCell(userInfo?.lotNumber));
          if (status[0] === 'reserve') {
            try {
              await writeGoogle(ranges.statusCell(userInfo.lotNumber), [['done']]);
              await updateStatusByLotNumber(userInfo.lotNumber, 'done');
              await updateLotIDByLotNumber(userInfo.lotNumber, chatId);
              await writeGoogle(ranges.userNameCell(userInfo.lotNumber), [[userInfo.firstname]]);
              await writeGoogle(ranges.userPhoneCell(userInfo.lotNumber), [[userInfo.contact]]);
              await editingMessage(userInfo.lotNumber);
              const soldLotContent = await getLotContentByID(userInfo.lotNumber);
              await bot.sendMessage(chatId, phrases.thanksForOrder(userInfo.firstname));
              await bot.sendMessage(chatId, soldLotContent); 
              logger.warn(`USER_ID: ${chatId} comleate order`);
              //here sanding reminder for users in waiting list that lot they waitng already sold
              await updateUserByChatId(chatId, 
              { 
                isAuthenticated: true,
                lotNumber: null,
              }) 
            } catch (error) {
              logger.error(`Something went wrong on finishing order for lot#${userInfo?.lotNumber} from customer ${chatId}. Error: ${error}`);
            }
          } else {
            bot.sendMessage(chatId, phrases.aleadySold);
          }
        break;
      }
    })
    
    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const userInfo = await findUserByChatId(chatId);
      if (userInfo?.isBan) {
        await bot.sendMessage(chatId, `Ваш акаунт заблоковано`);
        return
      } else if (msg.contact) {
        bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        const userData = await updateUserByChatId(chatId, { 
          firstname: msg.contact.first_name,
          contact: msg.contact.phone_number,
        });
        logger.info(`Unregistred user ID: ${chatId} shared contact. Name: ${msg.contact.first_name}, Phone: ${msg.contact.phone_number}`);
        const message = await bot.sendMessage(chatId, phrases.dataConfirmation(userData?.contact, userData?.firstname), { 
          reply_markup: keyboards.inlineConfirmation });
        await updateRecentMessageByChatId(chatId, message.message_id);

      } else if (userInfo?.chatStatus === 'phoneManual') {
        bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        await updateUserByChatId(chatId, { contact: msg.text, chatStatus: 'nameManual' });
        logger.info(`Unregistred user ID: ${chatId} posted contact. Contact: ${msg.text}`);
        const message = await bot.sendMessage(chatId, phrases.nameRequest);
        await updateRecentMessageByChatId(chatId, message.message_id)
      } else if (userInfo?.chatStatus === 'nameManual') {
        bot.deleteMessage(chatId, userInfo?.recentMessage).catch((error) => {logger.warn(`Помилка видалення повідомлення: ${error}`);});
        const message = await bot.sendMessage(chatId, phrases.dataConfirmation(userInfo.contact, msg.text), {
          reply_markup: keyboards.inlineConfirmation });
        await updateRecentMessageByChatId(chatId, message.message_id);
        logger.info(`Unregistred user ID: ${chatId} posted name. Name: ${msg.text}`);
        await updateUserByChatId(chatId, {
          firstname: msg.text,
          chatStatus: '',
          recentMessage: message.message_id,
        })
      }

      switch (msg.text) {
        case '/reserved': 
          const lotsStatus = await readGoogle(ranges.statusColumn);
          const idColumn = await readGoogle(ranges.user_idColumn);
          const indices = lotsStatus.reduce((acc, status, index) => {
            if (status === 'reserve' && idColumn[index] == chatId) {
              acc.push(index + 1);
            }
            return acc;
          }, []);
          if(indices.length > 0) {
            await bot.sendMessage(chatId, `Ваші заброньовані ділянки:`);
            const contentPromises = indices.map(el => getLotContentByID(el));
            const lotsContent = await Promise.all(contentPromises);  
            lotsContent.forEach(element => {
              bot.sendMessage(chatId, element);
            });
          } else await bot.sendMessage(chatId, `У вас немає заброньованих ділянок`);
          
          break;
        case '/filter': 
          filterKeyboard(chatId, 'Область', ranges.stateColumn);
          break;
        case '/start':
          if (!userInfo) await createNewUserByChatId(chatId);
          const message = await bot.sendMessage(msg.chat.id, phrases.greetings, { reply_markup: keyboards.listInline });
          await updateRecentMessageByChatId(chatId, message.message_id);
          break;
        case 'Зробити замовлення':
        case '/list':
          await sendAvaliableToChat(msg.chat.id, bot);
          break;
        case '/mylots':
          bot.sendMessage(chatId, 'myLots!!!');
          const messageText = await myLotsDataList(chatId);
          if (messageText) bot.sendMessage(chatId, messageText) 
          else bot.sendMessage(chatId, 'Нічого не знайдено');
          break;
      };
  });
};