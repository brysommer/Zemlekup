import bot from "./app.js";
import { sendNewRowsToTelegram } from './crawler.js';
import { searchForNew } from "./filedata.js";
import { dataBot } from './values.js';
import { writeGoogle, readGoogle } from './crud.js';
import { checkStatus } from './interval.js';

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
      const statusNew = await searchForNew(spreadsheetId, `${dataBot.googleSheetName}!${dataBot.statusColumn}${customerInfo[chatId].lotNumber}`)
      if (statusNew) {
        await writeGoogle(`${dataBot.googleSheetName}!${dataBot.statusColumn}${customerInfo[chatId].lotNumber}`, [['reserve']]);
        checkStatus(selectedOrderRaw, chatId);
        await writeGoogle(`${dataBot.googleSheetName}!${dataBot.user.idColumn}${customerInfo[chatId].lotNumber}`, [[`${chatId}`]]);
        bot.sendMessage(chatId, phrases.contactRequest, { reply_markup: { keyboard: keyboards.contactRequest, resize_keyboard: true }});
      } else bot.sendMessage(chatId, 'є замовлення від іншого користувача');
    })
    bot.onText(/\/list/ , async (msg) => {
      await sendNewRowsToTelegram(spreadsheetId, dataBot.googleSheetName, dataBot.statusColumn, msg.chat.id, bot);     
    });
    bot.on('message', async (msg) => {
      console.log(customerInfo);
      const chatId = msg.chat.id;
      if (msg.text === 'Зробити замовлення') await sendNewRowsToTelegram(spreadsheetId, dataBot.googleSheetName, dataBot.statusColumn, chatId, bot);
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
          if (!([chatId] in customerInfo)) bot.sendMessage(chatId, 'Будь ласка представтеся перед тим як зробити замовлення')
          else {
            await writeGoogle(`${dataBot.googleSheetName}!${dataBot.statusColumn}${customerInfo[chatId].lotNumber}`, [['done']]);
            await writeGoogle(`${dataBot.googleSheetName}!${dataBot.user.nameColumn}${customerInfo[chatId].lotNumber}`, [[customerInfo[chatId].name]]);
            await writeGoogle(`${dataBot.googleSheetName}!${dataBot.user.phoneColumn}${customerInfo[chatId].lotNumber}`, [[customerInfo[chatId].phone]]);
            const message_id = await (await readGoogle(`${dataBot.googleSheetName}!${dataBot.content.message_idColumn}${customerInfo[chatId].lotNumber}`))[0];
            const oldMessage = await readGoogle(`${dataBot.googleSheetName}!${dataBot.content.startColumn}${customerInfo[chatId].lotNumber}:${dataBot.content.endColumn}${selectedOrderRaw}`);
            const oldMessageString = oldMessage.join('\n');
            const newMessage = "📌 " + oldMessageString;
            try {
              await bot.editMessageText(newMessage, {chat_id: dataBot.channelId, message_id: message_id});
            } catch (error) {
              console.log(error)
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