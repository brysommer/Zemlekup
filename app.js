import TelegramBot from 'node-telegram-bot-api';
import { anketaListiner } from './anketa.js';
import { dataBot } from './values.js';
import { postingLots } from './postingLot.js';

const bot = new TelegramBot(dataBot.telegramBotToken, { polling: true });
export default bot;

anketaListiner();
postingLots();