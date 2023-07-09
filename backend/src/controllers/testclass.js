const Op = require('sequelize').Op
const { xlsxToJSON, checkValidData, generateCode } = require('../utils/utils')
const { StudyClass, Lecture, Subject, Student, User, TestRoom, TestClass, Student_TestClass } = require('../models/models')
const { getTestRoomInstance } = require('./testroom')
const getStudyClassInstance = require('./studyclass').getInstance
const { getStudentInstance } = require('./user')

const getInstance = async(id = 0, options = {}) => {
    let instance = await TestClass.findByPk(id, {...options })
    if (!instance) instance = await TestClass.findOne({
        where: { code: id },
        ...options
    })
    if (!instance) return undefined;
    else return instance
}

const createTestClass = async(req, res, next) => {
    //Date will be convert to be JSON in frontend before send on request
    //find testroom 
    //make sure testroom is available in date,examTime, and subExamTime
    //testClassInfo = {code, date, examTime, limitTime}
    try {
        const { testroomId, testClassInfo, studentIds, StudyClassId } = req.body;
        // console.log(req.body)
        const testroom = await getTestRoomInstance(testroomId);
        if (!testroom) res.status(404).send({ message: 'No test room found' });
        else {
            //check codition
            const isOverlap = await testroom.getTestClasses({
                where: {
                    [Op.and]: [{
                            date: {
                                [Op.eq]: testClassInfo.date
                            }
                        },
                        {
                            examTime: {
                                [Op.eq]: testClassInfo.examTime
                            }
                        }
                    ]
                }
            })

            if (isOverlap.length) return res.status(400).send({ message: 'Test Class is overlapping' })
            const studyClass = await getStudyClassInstance(StudyClassId);
            if (!studyClass) return res.status(404).send({ message: 'Study Class not found' })

            //create test class
            const newTestClass = await testroom.createTestClass({
                ...testClassInfo,
                code: testClassInfo.code || generateCode(1e5, 1e6),
                StudyClassId: studyClass.id
            });

            //Add student to test class and sub test
            const maxSubTestClass = Math.floor(60 / testClassInfo.limitTime)
            const max = testroom.maximum;
            if (studentIds.length > max * maxSubTestClass) return res.status(400).send({ message: 'Too many students in one test class' })

            const students = await Promise.all(studentIds.map(async(id) => {
                try {
                    const student = await getStudentInstance(id);
                    if (!student) return undefined;
                    else return student
                } catch (err) {
                    return undefined;
                }
            }))
            const studentList = students.filter(s => s != undefined)

            //maximum > students
            if (max > studentList.length) await newTestClass.addStudents(studentList)
                //multiple sub test class
            else {
                for (let i = 0; i < maxSubTestClass; i++) {
                    const sub = students.slice(i * max, i * max + max);
                    await newTestClass.addStudents(sub, { through: { subTestClass: `${newTestClass.examTime}.${i+1}` } })
                }
            }

            const testClass = await getInstance(newTestClass.id, { include: { all: true, nested: true } })
            return res.status(200).send(testClass)
        }
    } catch (err) {
        next(err)
    }

}

const getTestClass = async(req, res, next) => {
    try {
        const testClass = await getInstance(req.params.id, { include: { all: true } })
        if (!testClass) return res.status(404).send({ message: 'not found test class' })
        else return res.status(200).send(testClass)
    } catch (err) {
        next(err)
    }
}

const updateTestClass = async(req, res, next) => {
    try {
        const testClass = await getInstance(req.params.id)
        if (!testClass) return res.status(404).send({ message: 'not found test class' })

        const update = Object.assign(testClass, req.body)
        await update.save();

        res.status(200).send(update)
    } catch (err) {
        next(err)
    }

}

const deleteTestClass = async(req, res, next) => {
    try {
        const testClass = await getInstance(req.params.id)
        if (!testClass) return res.status(404).send({ message: 'not found test class' })

        await testClass.destroy();
        res.status(200).send({ message: 'test class has been deleted successfully' })
    } catch (err) {
        next(err)
    }
}

//Can find Test class by Code, study class code, subject code, subject name
//semester is required
const findTestClass = async(req, res, next) => {
    try {
        const { q, semester } = req.query;
        const query = q ? q : '';

        //find by test class code
        const byCode = await TestClass.findAll({
            where: {
                code: {
                    [Op.substring]: query
                }
            },
            include: {
                model: StudyClass,
                where: {
                    semester: semester
                }
            }
        })

        const findByCode = await Promise.all(byCode.map(async(tc) => {
            try {
                const testClass = await TestClass.findByPk(tc.id);
                if (!testClass) return undefined;
                else return testClass
            } catch (err) {
                return undefined;
            }
        }))

        //find by study class code
        const studyClasses = await StudyClass.findAll({
            where: {
                [Op.and]: [{
                        code: {
                            [Op.substring]: query
                        }
                    },
                    { semester: semester }
                ]

            },
        })

        //find by Subject code and name
        const subjects = await Subject.findAll({
            where: {
                [Op.or]: [{
                        code: {
                            [Op.substring]: query
                        }
                    },
                    {
                        name: {
                            [Op.substring]: query
                        }
                    },
                ]
            },
            include: [StudyClass]
        })

        subjects.forEach((subject) => {
            studyClasses.push(...subject.StudyClasses)
        })

        const findByStudyClass = await Promise.all(studyClasses.map(async(sc) => {
            try {
                const studyclass = await StudyClass.findByPk(sc.id);
                if (!studyclass) return undefined;
                else return await studyclass.getTestClasses();
            } catch (err) {
                return undefined
            }
        }))

        const testClasses = [findByCode, findByStudyClass].flat(3)
        res.status(200).send(testClasses)
    } catch (err) {
        next(err)
    }
}


// ---> continue here
const addStudentToTestClass = async(req, res, next) => {

}

const addProctorToTestClass = async(req, res, next) => {

}

const autoCreateTestClass = async(req, res, next) => {

}

const addStudentToTestClassByFile = async(req, res, next) => {

}

const bulkCreateTestClass = async(req, res, next) => {

}

module.exports = {
    createTestClass,
    getTestClass,
    updateTestClass,
    deleteTestClass,
    findTestClass,
    addStudentToTestClass,
    addProctorToTestClass,
    autoCreateTestClass,
    addStudentToTestClassByFile,
    bulkCreateTestClass
}