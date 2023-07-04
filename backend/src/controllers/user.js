const {User, Student, Lecture} = require('../models/models')

const getUser = async (req, res, next) => {
    try{
        const user = await User.findByPk(req.params.id, {include: [Student, Lecture]});
        if(!user) res.status(404).send({message: 'User not found'});
        res.status(200).send(user)
    }catch(err){
        next(err)
    }
}

module.exports = {
    getUser
}