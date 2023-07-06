const Op = require('sequelize').Op
const { xlsxToJSON, checkValidData } = require('../utils/utils')
const { StudyClass, Lecture, Subject, Student, User } = require('../models/models')

const createStudyClass = async(req, res, next) => {
    try {
        const { subjectId, lectureId, code, semester } = req.body
        const subject = await Subject.findByPk(subjectId);
        if (!subject) res.status(404).send({ message: "subject isn't exist" });
        const lecture = await Lecture.findByPk(lectureId);
        if (!lecture) res.status(404).send({ message: "lecture isn't exist" });

        const newStudyClass = await subject.createStudyClass({
            code,
            semester,
            LectureId: lecture.id
        })

        const returnData = await StudyClass.findByPk(newStudyClass.id, { include: [Subject, Lecture] })

        res.status(200).send(returnData)
    } catch (err) {
        next(err);
    }
}

const getStudyClass = async(req, res, next) => {
    try {
        let sc = await StudyClass.findByPk(req.params.id, { include: [Subject, Lecture] });
        if (!sc) sc = await StudyClass.findOne({ where: { code: req.params.id }, include: [Subject, Lecture] })
        if (!sc) res.status(404).send({ message: 'Study Class not found' })

        res.status(200).send(sc);
    } catch (err) {
        next(err)
    }
}

const updateStudyClass = async(req, res, next) => {
    try {
        let sc = await StudyClass.findByPk(req.params.id);
        if (!sc) sc = await StudyClass.findOne({ where: { code: req.params.id } })
        if (!sc) res.status(404).send({ message: 'Study Class not found' })

        const { lectureId, semester } = req.body
        sc.LectureId = lectureId ? lectureId : sc.LectureId;
        sc.semester = semester ? semester : sc.semester;

        const update = await StudyClass.findByPk(sc.id, { include: [Subject, Lecture] })
        res.status(200).send(update)
    } catch (err) {
        next(err)
    }
}

const deleteStudyClass = async(req, res, next) => {
    try {
        let sc = await StudyClass.findByPk(req.params.id);
        if (!sc) sc = await StudyClass.findOne({ where: { code: req.params.id } })
        if (!sc) res.status(404).send({ message: 'Study Class not found' })

        await sc.destroy();
        res.status(200).send({ message: 'Study Class was deleted successfully' })
    } catch (err) {
        next(err)
    }
}

const findStudyClasses = async(req, res, next) => {
    try {
        const { code, semester } = req.query
        const scls = await StudyClass.findAll({
            where: {
                [Op.and]: [{
                        code: {
                            [Op.substring]: code ? code.toLowerCase() : ''
                        }
                    },
                    { semester: semester }
                ]
            },
            include: [Lecture, Subject]
        })
        res.status(200).send(scls)
    } catch (err) {
        next(err)
    }
}

const addStudentToStudyClass = async(req, res, next) => {
    try {
        let sc = await StudyClass.findByPk(req.params.id);
        if (!sc) sc = await StudyClass.findOne({ where: { code: req.params.id } })
        if (!sc) res.status(404).send({ message: 'Study Class not found' })

        const { studentIds } = req.body;
        const students = await Promise.all(studentIds.map(async(id) => {
            try {
                let std = await Student.findByPk(id);
                if (!std) std = await Student.findOne({ where: { mssv: id } })
                return std
            } catch (err) {
                return undefined;
            }
        }))

        const add = students.filter(s => s !== undefined)
        await sc.addStudents(add);
        const stdList = await sc.getStudents();
        res.status(200).send({
            studyclass: sc,
            student_number: stdList.length,
            students: stdList
        })

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
        let sc = await StudyClass.findByPk(req.params.id);
        if (!sc) sc = await StudyClass.findOne({ where: { code: req.params.id } })
        if (!sc) res.status(404).send({ message: 'Study Class not found' })

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
    addStudentToStudyClassByFile
}