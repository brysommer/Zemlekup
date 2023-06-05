import TelegramBot from 'node-telegram-bot-api';
import { anketaListiner } from './anketa.js';
import { dataBot } from './values.js';
import { postingLots, autoPosting } from './postingLot.js';

const bot = new TelegramBot(dataBot.telegramBotToken, { polling: true });
const admin = new TelegramBot(dataBot.adminBot, { polling: true });
export { bot, admin };

anketaListiner();
postingLots();
setInterval(() => {
    autoPosting();
  }, dataBot.autopostingTimer);