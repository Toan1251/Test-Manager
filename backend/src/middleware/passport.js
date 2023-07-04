const passport = require('passport');
const User = require('../models/models').User
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser(async(id, done) => {
    try{
        const user = await User.findByPk(id);
        return done(null, user);
    }catch(err){
        done(err)
    }
})

passport.use(new LocalStrategy(async(username, password, done) => {
    try{
        const user = await User.findOne({where: {email: username}});
        if(!user) return done(null,false, {message: 'user is invalid'});
        const isMatch = await bcrypt.compare(password, user.password)
        if(isMatch) return done(null, user, {message: 'authenticated success'});
        return done(null, user, {message: 'password is unvalid'});
    }catch(err){
        done(err);
    }
}))