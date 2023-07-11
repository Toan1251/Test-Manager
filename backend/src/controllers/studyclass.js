const Op = require('sequelize').Op
const { xlsxToJSON, checkValidData, generateCode } = require('../utils/utils')
const { StudyClass, Lecture, Subject, Student, User } = require('../models/models')
const { getSubjectInstance } = require('./subject')
const { getStudentInstance } = require('./user')

const getInstance = async(id, options = {}) => {
    try {
        let instance = await StudyClass.findByPk(id, {...options });
        if (!instance) instance = await StudyClass.findOne({
            where: { code: id },
            ...options
        })
        if (!instance) return undefined;
        else return instance
    } catch (err) {
        return undefined
    }
}

const createStudyClass = async(req, res, next) => {
    try {
        const { subjectId, lectureId, code, semester, studentIds } = req.body
        const subject = await getSubjectInstance(subjectId);
        if (!subject) return res.status(404).send({ message: "subject isn't exist" });
        const lecture = await Lecture.findByPk(lectureId);
        if (!lecture) return res.status(404).send({ message: "lecture isn't exist" });

        const newStudyClass = await subject.createStudyClass({
            code: code || generateCode(1e5, 1e6),
            semester,
            LectureId: lecture.id
        })

        const students = await Student.findAll({
            where: {
                [Op.or]: [{
                        mssv: {
                            [Op.or]: studentIds
                        }
                    },
                    {
                        id: {
                            [Op.or]: studentIds
                        }
                    }
                ]
            }
        })

        await newStudyClass.addStudents(students)
        const returnData = await StudyClass.findByPk(newStudyClass.id, { include: [Subject, Lecture, Student] })
        return res.status(200).send(returnData)
    } catch (err) {
        next(err);
    }
}

const getStudyClass = async(req, res, next) => {
    try {
        const studyclass = await getInstance(req.params.id, { include: { all: true } })
        if (!studyclass) res.status(404).send({ message: 'Study Class not found' })
        else res.status(200).send(studyclass);
    } catch (err) {
        next(err)
    }
}

const updateStudyClass = async(req, res, next) => {
    try {
        const studyclass = await getInstance(req.params.id)
        if (!studyclass) res.status(404).send({ message: 'Study Class not found' })

        const update = Object.assign(studyclass, req.body)
        await update.save()
        const studyClass = await StudyClass.findByPk(update.id, { include: [Subject, Lecture] })
        return res.status(200).send(studyClass)
    } catch (err) {
        next(err)
    }
}

const deleteStudyClass = async(req, res, next) => {
    try {
        const studyclass = await getInstance(req.params.id)
        if (!studyclass) res.status(404).send({ message: 'Study Class not found' })
        else {
            await studyclass.destroy();
            res.status(200).send({ message: 'Study Class was deleted successfully' })
        }
    } catch (err) {
        next(err)
    }
}

//Adding find by Subject Code and Subject name
const findStudyClasses = async(req, res, next) => {
    try {
        const { q, semester } = req.query
        const scls = await StudyClass.findAll({
            where: {
                [Op.and]: [{
                        code: {
                            [Op.substring]: q ? q.toLowerCase() : ''
                        }
                    },
                    { semester: semester }
                ]
            },
            include: [Subject, Lecture]
        })
        return res.status(200).send(scls)
    } catch (err) {
        next(err)
    }
}

const addStudentToStudyClass = async(req, res, next) => {
    try {
        const sc = await getInstance(req.params.id)
        if (!sc) return res.status(404).send({ message: 'Study Class not found' })

        const { studentIds } = req.body;
        const students = await Student.findAll({
            where: {
                [Op.or]: [{
                        mssv: {
                            [Op.or]: studentIds
                        }
                    },
                    {
                        id: {
                            [Op.or]: studentIds
                        }
                    }
                ]
            }
        })

        await sc.addStudents(students);
        const studyClass = await StudyClass.findByPk(sc.id, { include: [Subject, Student, Lecture] });
        res.status(200).send(studyClass)

    } catch (err) {
        next(err)
    }
}

const bulkCreateStudyClass = async(req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have subject code, Lecture user email, code, semester column ordered

    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})
    const header = ['subjectCode', 'lectureEmail', 'code', 'semester']
    try {
        const data = xlsxToJSON(req.file.path, header);
        if (!checkValidData(data, header, ['sj-code', 'email', 'sc-code', 20221])) res.status(400).send({
            message: 'incorrect format data'
        })

        const studyClass = await Promise.all(data.map(async(element) => {
            try {
                const subject = await Subject.findOne({ where: { code: element.subjectCode } });
                const user = await User.findOne({ where: { email: element.lectureEmail } });
                const lecture = await user.getLecture();

                const newStudyClass = await subject.createStudyClass({
                    ...element,
                    LectureId: lecture.id,
                })

                return newStudyClass
            } catch (err) {
                return undefined;
            }
        }))

        const newStudyClasses = studyClass.filter(cl => cl !== undefined);

        res.status(200).send({
            message: 'upload success',
            success: newStudyClasses.length,
            failed: studyClass.length - newStudyClasses.length,
            newStudyClasses
        })
    } catch (err) {
        next(err)
    }
}

const addStudentToStudyClassByFile = async(req, res, next) => {
    //User must have permissionlevel >= 1 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have name, dateofbirth, mssv, email column ordered

    // if(req.user.permissionLevel < 1) res.statuc(403).send({message: 'not allowed'})
    const header = ['fullname', 'dateOfBirth', 'mssv', 'email']
    try {
        const sc = await getInstance(req.params.id)
        if (!sc) return res.status(404).send({ message: 'Study Class not found' })

        const data = xlsxToJSON(req.file.path, header);
        if (!checkValidData(data, header, ['name', new Date(), 20183640, 'email'])) {
            res.status(400).send({ message: 'incorrect format data' })
        }

        const students = await Promise.all(data.map(async(element) => {
            try {
                const student = await Student.findOne({ where: { mssv: element.mssv } });
                return student
            } catch (err) {
                return undefined;
            }
        }))

        const add = students.filter(s => s !== undefined)
        await sc.addStudents(add);
        const stdList = await sc.getStudents();
        res.status(200).send({
            message: 'upload success',
            success: add.length,
            failed: students.length - add.length,
            student_number: stdList.length,
            students: stdList
        })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    createStudyClass,
    getStudyClass,
    updateStudyClass,
    deleteStudyClass,
    findStudyClasses,
    bulkCreateStudyClass,
    addStudentToStudyClass,
    addStudentToStudyClassByFile,
    getInstance
}