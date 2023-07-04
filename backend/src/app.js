const express = require('express');
const cors = require('cors');
const session = require('express-session');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const Store = require('connect-session-sequelize')(session.Store);
const sequelize = require('./models/models').sequelize;
const passport = require('passport');
const router = require('./routers/routers');

//Config
const app = express();
app.use(morgan("dev"));
app.use(cors({
    origin: '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    credentials: true
}));

//Session initization
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
    secret: require('./config/config').SESSION_SECRET,
    cookie: { maxAge: 3600 * 1000, secure: false },
    resave: false,
    saveUninitialized: false,
    store: new Store({ db: sequelize })
}))

app.use('/static', express.static(path.join(__dirname, 'public')))

//Passport initization
app.use(passport.initialize());
app.use(passport.session());
require('./middleware/passport')

//API
app.use('/api', router)

//Errorhandle
app.use(require('./middleware/errorhandle'))
//Listen
const port = require('./config/config').PORT || 3000
const server = app.listen(port, () => {
    console.log('server is running on ' + port)
})
server.setTimeout(3600 * 1000)

