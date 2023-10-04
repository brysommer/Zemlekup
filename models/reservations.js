import { Model, DataTypes } from "sequelize";
import { sequelize } from './sequelize.js';
import { logger } from '../logger/index.js';


class Reserv extends Model {}
Reserv.init({
    waitlist_ids: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    reservist_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    lotNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }  
}, {
    freezeTableName: false,
    timestamps: true,
    modelName: 'reservs',
    sequelize
});

const createNewReserv = async (lotNumber) => {
    let res;
    try {
        res = await Reserv.create({ lotNumber });
        res = res.dataValues;
        logger.info(`Created reserv with id: ${res.id}`);
    } catch (err) {
        logger.error(`Impossible to create reserv: ${err}`);
    }
    return res;
};


const updateReservist_idByLotNumber = async (reservist_id, lotNumber) => {
    const res = await Reserv.update({ reservist_id } , { where: { lotNumber } });
    if (res[0]) {
        const data = await findReservByLotNumber(lotNumber);
        if (data) {
            logger.info(`Reserv for lotNumber:#${data.lotNumber} updated`);
            return data;
        }
        logger.info(`Reserv ${lotNumber} updated, but can't read result data`);
    } 
    return undefined;
};

const updateWaitlist_idsByLotNumber = async (waitlist_ids, lotNumber) => {
    const res = await Reserv.update( { waitlist_ids }, { where: { lotNumber } });
    if (res[0]) {
        const data = await findReservByLotNumber(lotNumber);
        if (data) {
            logger.info(`Reserv for lotNumber:#${data.lotNumber} updated`);
            return data;
        }
        logger.info(`Reserv ${lotNumber} updated, but can't read result data`);
    } 
    return undefined;
};

const findReservByLotNumber = async (lotNumber) => {
    const res = await Reserv.findOne({ where: { lotNumber } });
    if (res) return res.dataValues;
    return res;
};

export {
    Reserv,
    createNewReserv,
    updateReservist_idByLotNumber,
    findReservByLotNumber,
    updateWaitlist_idsByLotNumber
};   