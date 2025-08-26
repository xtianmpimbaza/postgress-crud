'use strict';

const {DataTypes} = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
    _id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: DataTypes.BIGINT
    },
    UserName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    DateOfBirth: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    Hobbies: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    Role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    ProfilePic: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    sequelize,
    modelName: 'User',
    tableName: 'tblusers',
    timestamps: false,
});

module.exports = User;
