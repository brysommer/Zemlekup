import bot from "./app.js";
import { sendToRawContact, sendToRawStatusReserve, sendToRawStatusDone } from './writegoog.js'
import { changeMessage } from "./editChannel.js";
import { googleFindMessageId, sendNewRowsToTelegram } from './crawler.js';
import { getSpreadsheetData, searchForNew } from "./filedata.js";
import { dataBot } from './values.js';

let customerPhone;
let customerName;
let customerInfo = {};
let selectedOrderRaw;



const spreadsheetId = dataBot.googleSheetId;
const phoneRegex = /^\d{10,12}$/;

const phrases = {
  greetings: 'Привіт, якщо ви хочете зробити замовлення, натисніть кнопку "Зробити замовлення".',
  contactRequest: 'Нам потрібні ваші контактні дані. Отримати з контактних даних телеграм?',
  dataConfirmation: `Ваш номер телефону: ${customerPhone}. Ваше імя ${customerName}. Дані вірні?`,
  thanksForOrder: `Замовлення успішно оформлено. Дякую ${customerName}`,
  wrongName: 'Невірне ім\'я. Будь ласка, введіть своє справжнє ім\'я:',
  wrongPhone: 'Невірний номер телефону. Будь ласка, введіть номер телефону ще раз:',
  phoneRules: 'Введіть ваш номер телефону без +. Лише цифри. І відправте повідомлення',
  nameRequest: 'Введіть своє ім\'я:',
};

const keyboards = {
  startingKeyboard: [['Зробити замовлення']],
  contactRequest: [
    [ { text: 'Так', request_contact: true, } ],
    ['Ні, я введу номер вручну'],
    ['/start'],
  ],
  dataConfirmation: [
    ['Так, Оформити замовлення'],
    ['Ні, повторити введення'],
    ['/start'],
  ],
  enterPhone: [ ['/start'] ]
}

export const anketaListiner = async() => {
    bot.setMyCommands([
      {command: '/start', description: 'Почати'},
      {command: '/list', description: 'Показати доступні лоти'},
    ]);
    bot.onText(/\/start/ , (msg) => {
        customerPhone = undefined;
        customerName = undefined;
        bot.sendMessage(msg.chat.id, phrases.greetings, {
            reply_markup: { keyboard: keyboards.startingKeyboard, resize_keyboard: true, one_time_keyboard: true }
        });
    });
    //'Купити ділянку' button handler
    bot.on("callback_query", async (query) => {
      selectedOrderRaw = query.data;
      const chatId = query.message.chat.id;
      customerInfo[chatId] = { lotNumber : query.data, phone: undefined, name: undefined };
      const range = `post!N${ customerInfo[chatId].lotNumber }`;
      const statusNew = await searchForNew(spreadsheetId, range)
      if (statusNew) {
        sendToRawStatusReserve(customerInfo[chatId].lotNumber);
        bot.sendMessage(chatId, phrases.contactRequest, { reply_markup: { keyboard: keyboards.contactRequest, resize_keyboard: true }});
      } else bot.sendMessage(chatId, 'є замовлення від іншого користувача');
    })
    bot.onText(/\/list/ , async (msg) => {
      await sendNewRowsToTelegram(spreadsheetId, dataBot.googleSheetName, dataBot.lotStatusColumn, msg.chat.id, bot);     
    });
    bot.on('message', async (msg) => {
      console.log(customerInfo);
      const chatId = msg.chat.id;
      if (msg.text === 'Зробити замовлення') await sendNewRowsToTelegram(spreadsheetId, dataBot.googleSheetName, dataBot.lotStatusColumn, chatId, bot);
      else if (msg.contact) {
        if (!customerInfo[chatId]) {
          customerInfo[chatId] = {};
        }
        customerInfo[chatId].name = msg.contact.first_name;
        customerInfo[chatId].phone = msg.contact.phone_number;
        customerPhone = msg.contact.phone_number;
        customerName = msg.contact.first_name;
        bot.sendMessage(chatId, `Ваш номер телефону: ${customerInfo[chatId].phone}. Ваше імя ${customerInfo[chatId].name}. Дані вірні?`, { 
          reply_markup: { keyboard: keyboards.dataConfirmation, resize_keyboard: true, one_time_keyboard: true }});
      } else if(msg.text === 'Так, Оформити замовлення') {
          const chatId = msg.chat.id;
          // переписати функції запису даних згідно рядка а не колонки
          if (!([chatId] in customerInfo)) bot.sendMessage(chatId, 'Будь ласка представтеся перед тим як зробити замовлення')
          else {
            await sendToRawContact(customerInfo[chatId].phone, customerInfo[chatId].name, customerInfo[chatId].lotNumber);
            await sendToRawStatusDone(customerInfo[chatId].lotNumber);
            const range = `post!A${customerInfo[chatId].lotNumber}:E${customerInfo[chatId].lotNumber}`;
            const data = await getSpreadsheetData(spreadsheetId, range);
            if (data.values && data.values.length > 0) {
            const message = data.values[0].join('\n');
            const idToDelete = await googleFindMessageId(customerInfo[chatId].lotNumber)
            await changeMessage(idToDelete, message);
            }
            bot.sendMessage(chatId, `Замовлення успішно оформлено. Дякую ${customerInfo[chatId].name}`);
          } 
      } else if (msg.text === 'Почати спочатку') {
        bot.sendMessage(chatId, '/start');
      } else if(msg.text === `Ні, я введу номер вручну` || msg.text === 'Ні, повторити введення') {
        customerPhone = undefined;
        customerName = undefined;  
        bot.sendMessage(chatId, phrases.phoneRules, {
          reply_markup: { keyboard: keyboards.enterPhone, resize_keyboard: true },
        });
      } else if (phoneRegex.test(msg.text)) {
        customerInfo[chatId].phone = msg.text;
        customerPhone = msg.text;
        bot.sendMessage(chatId, phrases.nameRequest);
      } else if (customerPhone && customerName == undefined ) {
        if (msg.text.length >= 2) {
        customerName = msg.text;
        customerInfo[chatId].name = msg.text;
        bot.sendMessage(chatId, `Ваш номер телефону: ${customerInfo[chatId].phone}. Ваше імя ${customerInfo[chatId].name}. Дані вірні?` , {
          reply_markup: { keyboard: keyboards.dataConfirmation, resize_keyboard: true, one_time_keyboard: true },
        });
        };
      };
  });
};