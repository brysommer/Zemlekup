import { 
    findReservByLotNumber,
    updateWaitlist_idsByLotNumber,
    updateReservist_idByLotNumber
} from './models/reservations.js';

const addUserToWaitingList = async (selectedLot, chatId) => {
    const reservData = await findReservByLotNumber(selectedLot);
    const waitlist = reservData.waitlist_ids;
    waitlist.push(chatId);
    const newWaitlist = await updateWaitlist_idsByLotNumber(waitlist, selectedLot);
    return waitlist.lenght;
};

const moveWaitlistOneStepInFront = async (selectedLot) => {
    const reservData = await findReservByLotNumber(selectedLot);
    const nextUser = reservData.waitlist_ids[0];
    const updatedReserv = await updateReservist_idByLotNumber(nextUser, selectedLot);
    bot.sendMessage(nextUser, `Ваша черга на покупку лоту, можете купити лот що вас цікавив`);
    const newWaitlist = reservData.waitlist_ids.shift();
    const updatedWaitlist = await updateWaitlist_idsByLotNumber(newWaitlist, selectedLot);
    newWaitlist.forEach(el => {
        try {
            bot.sendMessage(el, `Черга підійшла на одного користувача вперід. Ви #${ [index] + 1 } в черзі`);
        } catch (error) {
            logger.warn(`User: ${el}, Havn't received waitlist notification. Reason: ${error}`)
         }
    });
    logger.info(`${newWaitlist.length} користувачів отримали нагадування про те що черга підійшла ближче`);
    return updatedReserv.reservist_id;
};

const sendSoldToWaitingIDs = async (selectedLot) => {
    const reservData = await findReservByLotNumber(selectedLot);
    const usersChatId = reservData?.waitlist_ids;
    const groupSize = 25;
    for (let i = 0; i < usersChatId.length; i += groupSize) {
        const chatIdsGroup = usersChatId.slice(i, i + groupSize);
        chatIdsGroup.forEach(el => {
            try {
                bot.sendMessage(el, `Лот за яким ви стали в чергу проданий. Пощастить наступного разу`);
            } catch (error) {
                logger.warn(`User: ${el}, Havn't received waitlist notification. Reason: ${error}`)
            }
        });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    logger.info(`${usersChatId.length} користувачів отримали нагадування про новий завершення черги`);
}

export {
    addUserToWaitingList,
    moveWaitlistOneStepInFront,
    sendSoldToWaitingIDs
}