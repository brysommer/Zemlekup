import { readGoogle, writeGoogle } from './crud.js';
import { dataBot } from './values.js';
import bot from "./app.js";

const checkStatus = (rowNumber, chat_id) => {
    const statusRange = `${dataBot.googleSheetName}!${dataBot.statusColumn}${rowNumber}`;
    setTimeout(async () => {
        const response = await readGoogle(statusRange);
        const data = response[0];
        if (data === 'reserve') {
            bot.sendMessage(chat_id, 'Ви забронювали ділянку, завершіть замовлення. Незабаром ділянка стане доступною для покупки іншим користувачам');
            setTimeout(async () => {
                const response = await readGoogle(statusRange);
                const data = response[0];
                if (data === 'reserve') {
                    bot.sendMessage(chat_id, 'Ділянка яку ви бронювали доступна для покупки');
                    writeGoogle(statusRange, [['new']]);
                    setTimeout(async () => {
                        const response = await readGoogle(statusRange);
                        const data = response[0];
                        if (data === 'new') {
                            bot.sendMessage(chat_id, 'Ділянка якою ви цікавились ще не продана');
                        } return false;
                    }, 15000);
                } return false;
            }, 15000);
        } return false;
    }, 15000);
} 

export { checkStatus };