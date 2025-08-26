const express = require('express');
const app = express();
const bodyParser = require('body-parser');
// const { sequelize } = require('../config/db')
const cors = require('cors');
const userRoute = require('./userController');
const sequelize = require('../config/db');

const dotenv = require('dotenv');
dotenv.config();

const Sequelize = require('sequelize');
const { Op } = Sequelize;


app.use(cors());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(userRoute);

const port = process.env.PORT || 5000;

(async () => {
    try {
        await sequelize.sync({ force: false }); // creates table if not exists
        console.log('✅ Database synced');
    } catch (err) {
        console.error('❌ Error syncing database:', err);
    }
})();

app.listen(port, async () => {
    console.log(`Listening on port ${port}..`)
});
