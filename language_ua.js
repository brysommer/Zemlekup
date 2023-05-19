const phrases = {
    greetings: 'Привіт, якщо ви хочете зробити замовлення, натисніть кнопку "Зробити замовлення".',
    contactRequest: 'Нам потрібні ваші контактні дані. Отримати з контактних даних телеграм?',
    dataConfirmation: (customerName, customerPhone) => {
        return `Ваш номер телефону: ${customerPhone}. Ваше імя ${customerName}. Дані вірні?`;
    },
    thanksForOrder: (customerName) => {
        return `Замовлення успішно оформлено. Дякую ${customerName}`;
    },
    aleadySold: 'Є замовлення від іншого користувача',
    noContacts: 'Будь ласка представтеся перед тим як зробити замовлення',
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
};

export { phrases, keyboards }