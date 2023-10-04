import { dataBot } from './values.js'

const phrases = {
    greetings: 'Вітаю, якщо Ви хочете зробити замовлення, натисніть кнопку "Зробити замовлення"',
    contactRequest: 'Нам потрібні ваші контактні дані. Отримати з контактних даних телеграм?',
    dataConfirmation: (customerName, customerPhone) => {
        return `Ваш номер телефону: ${customerPhone}. Ваше імя ${customerName}. Дані вірні?`;
    },
    thanksForOrder: (customerName) => {
        return `Невдовзі менеджер зв’яжеться з Вами.
        Вітаємо з успішною покупкою ${customerName}. Ви придбали:`;
    },
    aleadySold: 'Є замовлення від іншого користувача',
    noContacts: 'Будь ласка представтеся перед тим як зробити замовлення',
    wrongName: 'Невірне ім\'я. Будь ласка, введіть своє справжнє ім\'я:',
    wrongPhone: 'Невірний номер телефону. Будь ласка, введіть номер телефону ще раз:',
    phoneRules: 'Введіть, будь ласка, номер телефону. Або інші контактні дані',
    nameRequest: 'Введіть своє ім\'я:',
    waitlist: 'Вас додано до черги за номером #',
    alreadyWaiting: 'Ви вже в списку очікування'
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
    enterPhone: [ ['/start'] ],
    contactRequestInline: { inline_keyboard: [
      [{ text: 'Так', callback_data: '/autocontact' }],
      [{ text: 'Ні, я введу контакти самостійно', callback_data: '/manualcontact' }],
      [{ text: 'Почати спочатку', callback_data: '/start' }]
    ]},
    listInline: { inline_keyboard: [
      [{ text: 'Зробити замовлення', callback_data: `/filter` }]
    ]},
    inlineConfirmation: {
      inline_keyboard: [
        [{ text: 'Так, Оформити замовлення', callback_data: '/comleate' }],
        [{ text: 'Ні, повторити введення', callback_data: '/manualcontact'},],
        [{ text: 'Почати спочатку', callback_data: '/start' }]
      ]  
    },
    channelKeyboard : { inline_keyboard: [[{ 
      text: 'Скористайтеся ботом, щоб зробити замовлення',
      url: dataBot.botUrl,
    }]] },
    finishOrder: {
      inline_keyboard: [
        [{ text: 'Оформити замовлення', callback_data: '/comleate' }],
      ]  
    },
    waitlistdialogue: {
      inline_keyboard: [[
        { text: 'ТАК', callback_data: '/addwaitlist' },
        { text: 'НІ', callback_data: '/start' }
      ],]  
    }

};

export { phrases, keyboards }