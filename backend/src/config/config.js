require('dotenv').config();

module.exports = {
    PORT: process.env.PORT,
    DB: {
        DB_NAME: process.env.DB_NAME,
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_PASSWORD: process.env.DB_PASSWORD,
        dialect: process.env.DB_DIALECT,
    },
    SESSION_SECRET: process.env.SESSION_SECRET
}
