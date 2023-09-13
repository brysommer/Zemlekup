import { User, createNewUser } from '../models/users.js';
import { Lot } from '../models/lots.js';
import { Reserv } from '../models/reservations.js'
import { logger } from '../logger/index.js';


const DEBUG = false;

const main = async () => {
    try {
        const syncState = await Promise.all([
            User.sync(),
            Lot.sync(),
            Reserv.sync(),
        ]);
        
        
        if (DEBUG && syncState) {
            const pseudoRandom = () => Math.floor(Math.random() * 10000);
            const userData = {
                chat_id: pseudoRandom(),
                firstname: 'migration_record',
                contact: pseudoRandom().toString(),
                chatStatus: '',
            };

            logger.info('Log created by migration procedure');
            createNewUser(userData);
        }

    } catch (err) {
        // eslint-disable-next-line no-console
        console.log(err);
    }
};

main();
