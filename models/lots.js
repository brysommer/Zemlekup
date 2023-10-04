import { Model, DataTypes } from "sequelize";
import { sequelize } from './sequelize.js';
import { logger } from '../logger/index.js';


class Lot extends Model {}
Lot.init({
    area: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    revenue: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    cadastral_number: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'not specified'
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'not specified'
    },
    region: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'not specified'
    },
    tenant: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'not specified',
        
    },
    lease_term: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
    },
    lot_status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'new'
    },
    message_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    user_name: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: ''
    },
    contact: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lotNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
    }  

}, {
    freezeTableName: false,
    timestamps: true,
    modelName: 'lots',
    sequelize
});

const createNewLot = async (lotData) => {
    let res;
    try {
        res = await Lot.create(lotData);
        res = res.dataValues;
        logger.info(`Created lot with id: ${res.id}`);
    } catch (err) {
        logger.error(`Impossible to create lot: ${err}`);
    }
    return res;
};

const updateStatusByLotNumber = async (lotNumber, status) => {
    const res = await Lot.update({ lot_status: status } , { where: { lotNumber } });
    if (res[0]) {
        const data = await findLotBylotNumber(lotNumber);
        if (data) {
            logger.info(`Lot# ${data.lotNumber} status updated. New status: ${data.lot_status}`);
            return data;
        }
        logger.info(`Lot#  ${lotNumber} updated, but can't read result data`);
    } 
    return undefined;
};

const updateLotIDByLotNumber = async (lotNumber, user_id) => {
    const res = await Lot.update({ user_id } , { where: { lotNumber } });
    if (res[0]) {
        const data = await findLotBylotNumber(lotNumber);
        if (data) {
            logger.info(`Lot# ${data.chat_id} user_id updated.`);
            return data;
        }
        logger.info(`Lot#  ${lotNumber} updated, but can't read result data`);
    } 
    return undefined;
};

const updateRecentMessageByChatId = async (chat_id, recentMessage) => {
    const res = await User.update({ recentMessage } , { where: { chat_id } });
    if (res[0]) {
        const data = await findUserByChatId(chat_id);
        if (data) {
            logger.info(`User ${data.chat_id} updated`);
            return data;
        }
        logger.info(`User ${chat_id} updated, but can't read result data`);
    } 
    return undefined;
};

const userLogin = async (chat_id) => {
    const res = await User.update({ isAuthenticated: true }, { where: { chat_id } });
    if (res) logger.info(`User ${chat_id} logging in`);
    return res[0] ? chat_id : undefined;
};

const userLogout = async (chat_id) => {
    const res = await User.update({ isAuthenticated: false }, { where: { chat_id } });
    if (res) logger.info(`User ${chat_id} logging out`);
    return res[0] ? chat_id : undefined;
};

const userIsBanUpdate = async (chat_id, banStatus) => {
    const res = await User.update({ isBan: banStatus }, { where: { chat_id } });
    if (res) logger.info(`User ${chat_id} isBan updated. User data ${res[0]}`);
    return res[0] ? chat_id : undefined;
};


const findLotBylotNumber = async (lotNumber) => {
    const res = await Lot.findOne({ where: { lotNumber } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findLotsByStatus = async (status) => {
    const res = await Lot.findAll({ where: { lot_status: status } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findLotsByStatusAndState = async (status, state) => {
    const res = await Lot.findAll({ where: { lot_status: status, state } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findLotsByStatusAndRegion = async (status, region) => {
    const res = await Lot.findAll({ where: { lot_status: status, region } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findALLUsers = async () => {
    const res = await User.findAll({ where: {  } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findUserByChatId = async (chat_id) => {
    const res = await User.findOne({ where: { chat_id: chat_id } });
    if (res) return res.dataValues;
    return res;
};

const deleteUserByChatId = async (chat_id) => {
    const res = await User.destroy({ where: { chat_id } });
    if (res) logger.info(`Deleted status: ${res}. Chat id ${chat_id}`);
    return res ? true : false;
};

export {
    Lot,
    createNewLot,
    updateStatusByLotNumber,
    findLotBylotNumber,
    findLotsByStatus,
    updateLotIDByLotNumber,
    findLotsByStatusAndState,
    findLotsByStatusAndRegion
};   