const { User, Student, Lecture } = require('../models/models')

const getStudentInstance = async(id, options = {}) => {
    try {
        let instance = await Student.findByPk(id, {...options });
        if (!instance) instance = await Student.findOne({
            where: { mssv: id },
            ...options
        })
        if (!instance) return undefined;
        else return instance
    } catch (err) {
        return undefined
    }
}

const getUser = async(req, res, next) => {
    try {
        const user = await User.findByPk(req.params.id, { include: [Student, Lecture] });
        if (!user) res.status(404).send({ message: 'User not found' });
        res.status(200).send(user)
    } catch (err) {
        next(err)
    }
}

const getStudent = async(req, res, next) => {
    try {
        const student = await getStudentInstance(req.params.id, { include: { all: true } })
        if (!student) res.status(404).send({ message: 'Student not found' })
        res.status(200).send(student);
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getUser,
    getStudent,
    getStudentInstance
}