import { Model, DataTypes } from "sequelize";
import { sequelize } from './sequelize.js';
import { logger } from '../logger/index.js';


class Lot extends Model {}
Lot.init({
    area: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    revenue: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cadastral_number: {
        type: DataTypes.STRING,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    region: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tenant: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lease_term: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        logger.info(`Created user with id: ${res.id}`);
    } catch (err) {
        logger.error(`Impossible to create lot: ${err}`);
    }
    return res;
};

const createNewUserByChatId = async (chat_id) => {
    let res;
    try {
        res = await User.create({ chat_id });
        res = res.dataValues;
        logger.info(`Created user with id: ${res.id}`);
    } catch (err) {
        logger.error(`Impossible to create lot: ${err}`);
    }
    return res;
};

const updateUserByChatId = async (chat_id, updateParams) => {
    const res = await User.update({ ...updateParams } , { where: { chat_id } });
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

const updateChatStatusByChatId = async (chat_id, chatStatus) => {
    const res = await User.update({ chatStatus } , { where: { chat_id } });
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


const findUserById = async (id) => {
    const res = await User.findAll({ where: { id: id } });
    if (res.length > 0) return res.map(el => el.dataValues);
    return;
};

const findUsersByStatus = async (isAuthenticated) => {
    const res = await User.findAll({ where: { isAuthenticated } });
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
};   