import { readGoogle, writeGoogle } from './crud.js';
import { dataBot, ranges } from './values.js';
import bot from "./app.js";

const checkStatus = (rowNumber, chat_id) => {
    setTimeout(async () => {
        const response = await readGoogle(ranges.statusCell(rowNumber));
        const data = response[0];
        if (data === 'reserve') {
            bot.sendMessage(chat_id, 'Ви забронювали ділянку, завершіть замовлення. Незабаром ділянка стане доступною для покупки іншим користувачам');
            setTimeout(async () => {
                const response = await readGoogle(ranges.statusCell(rowNumber));
                const data = response[0];
                if (data === 'reserve') {
                    bot.sendMessage(chat_id, 'Ділянка яку ви бронювали доступна для покупки');
                    writeGoogle(ranges.statusCell(rowNumber), [['new']]);
                    setTimeout(async () => {
                        const response = await readGoogle(ranges.statusCell(rowNumber));
                        const data = response[0];
                        if (data === 'new') {
                            bot.sendMessage(chat_id, 'Ділянка якою ви цікавились ще не продана');
                        } return false;
                    }, dataBot.lastChanceFirst);
                } return false;
            }, dataBot.secondReminder);
        } return false;
    }, dataBot.firstReminder);
} 

export { checkStatus };