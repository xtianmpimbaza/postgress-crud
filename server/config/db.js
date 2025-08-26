
const { Sequelize } = require('sequelize');

const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;
const username = process.env.DB_USER || 'postgres';
const host = process.env.DB_HOST || 'localhost';
const database = process.env.DB_NAME || 'smartdb';
const password = process.env.DB_PASS || 'root';
const port = process.env.DB_PORT || 5431;


// Create a new Sequelize instance
const sequelize = new Sequelize(database, username, password, {
    host: host,   // or your DB host
    dialect: 'postgres', // specify postgres
    logging: false       // disable logging (optional)
});

// Test the connection
(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connection has been established successfully.');
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
})();

module.exports = sequelize;
