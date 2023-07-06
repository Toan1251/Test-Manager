const { User, Student, Lecture } = require('../models/models')
const { xlsxToJSON, checkValidData } = require('../utils/utils')
const bcrypt = require('bcrypt')

const logIn = (req, res) => {
    res.status(200).send(req.user);
}

const logOut = (req, res) => {
    req.logOut();
}


const register = async(req, res, next) => {
    const { email, password, permissionLevel, info } = req.body
    try {
        const user = await User.findOne({ where: { email: email } })
        if (user) throw new Error("this email is already registered")
        else {
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password, salt)

            const newUser = await User.create({
                email,
                password: hashPassword,
                permissionLevel
            });
            let newPerson
            if (permissionLevel === 0) {
                newPerson = await newUser.createStudent({
                    ...info
                })
            } else {
                newPerson = await newUser.createLecture({
                    ...info
                })
            }
            const userInfo = await User.findByPk(newUser.id, { include: [Student, Lecture] })
            res.status(201).send(userInfo)
        }
    } catch (err) {
        next(err)
    }
}

const bulkRegisterStudents = async(req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have email,password,mssv,fullname,dateOfBirth,schoolyear,major column ordered
    //dateOfbirth must have format MM/DD/YYYY

    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})

    const header = ['email', 'password', 'mssv', 'fullname', 'dateOfBirth', 'schoolYear', 'major']
    try {
        const data = xlsxToJSON(req.file.path, header)
        if (!checkValidData(data, header, ['email', 'pw', 20183640, 'name', new Date(), 63, 'soict'])) res.status(400).send({
                message: 'incorrect format in data'
            })
            // Loop to create User and Student
        const Students = await Promise.all(data.map(async(element) => {
            try {
                const salt = await bcrypt.genSalt(10)
                const hashPassword = await bcrypt.hash(element.password, salt)
                const newUser = await User.create({
                    email: element.email,
                    password: hashPassword,
                    permissionLevel: 0
                })

                const newStudent = await Student.create({
                    ...element,
                    UserId: newUser.id
                })
                return newStudent
            } catch (err) {
                return 0;
            }
        }))

        const newStudents = Students.filter(student => student !== 0)
        res.status(200).send({
            message: 'upload success',
            success: newStudents.length,
            failed: data.length - newStudents.length,
            newStudents
        })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    logIn,
    logOut,
    register,
    bulkRegisterStudents
}