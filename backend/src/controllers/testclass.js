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

const isOverlap = async(instance, date, examTime) => {
    const testClasses = await instance.getTestClasses({
        where: {
            [Op.and]: [{
                    date: {
                        [Op.eq]: date
                    }
                },
                {
                    examTime: {
                        [Op.eq]: examTime
                    }
                }
            ]
        }
    })

    return !testClasses.length == 0
}

const createTestClass = async(req, res, next) => {
    //Date will be convert to be JSON in frontend before send on request
    //find testroom 
    //make sure testroom is available in date,examTime, and subExamTime
    //testClassInfo = {code, date, examTime, limitTime}
    try {
        const { testroomId, testClassInfo, studentIds, StudyClassId } = req.body;

        //Get Test room
        const testroom = await getTestRoomInstance(testroomId);
        if (!testroom) return res.status(404).send({ message: 'No test room found' });

        // Check if test room is already have test class in same time
        const isTestRoomNotFree = await isOverlap(testroom, testClassInfo.date, testClassInfo.examTime)
        if (isTestRoomNotFree) return res.status(400).send({ message: 'Test Class is overlapping' })

        //Get study class to create test class
        const studyClass = await getStudyClassInstance(StudyClassId);
        if (!studyClass) return res.status(404).send({ message: 'Study Class not found' })

        //Check if students list is over size of test room
        const maxSubTestClass = Math.floor(60 / testClassInfo.limitTime)
        const max = testroom.maximum;
        if (studentIds.length > max * maxSubTestClass) return res.status(400).send({ message: 'Too many students in one test class' })

        //Get student list, make sure student is in studyclass we need create test class
        const students = await Student.findAll({
            where: {
                mssv: {
                    [Op.or]: [...studentIds, 0]
                }
            }
        })

        //Check if any student have another testclass in same time
        const isNotHasOverlapTest = await Promise.all(students.map(async(student) => {
            const overlap = await isOverlap(student, testClassInfo.date, testClassInfo.examTime)
            return !overlap
        }))
        if (isNotHasOverlapTest.includes(false)) return res.status(400).send({ message: 'One or more students have Overlap Test time' })

        //create test class
        const newTestClass = await testroom.createTestClass({
            ...testClassInfo,
            code: testClassInfo.code || generateCode(1e5, 1e6),
            StudyClassId: studyClass.id
        });

        //maximum >= students: => no need to create sub test class
        if (max >= students.length) await newTestClass.addStudents(students)
        else { //multiple sub test class for student
            for (let i = 0; i < maxSubTestClass; i++) {
                const sub = students.slice(i * max, i * max + max);
                await newTestClass.addStudents(sub, { through: { subTestClass: `${newTestClass.examTime}.${i+1}` } })
            }
        }

        const testClass = await getInstance(newTestClass.id, { include: [StudyClass, Student] })
        return res.status(200).send(testClass)
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
        const { date, examTime, limitTime, TestRoomId } = req.body

        let testroom = await testClass.getTestRoom()

        if (TestRoomId) { // Need Change Test Room
            testroom = await getTestRoomInstance(TestRoomId)
            if (!testroom) return res.status(404).send({ message: 'No test room found' });
        }

        const isTestRoomNotFree = await isOverlap(testroom, date || testClass.date, examTime || testClass.examTime)
        if (isTestRoomNotFree) return res.status(400).send({ message: 'Test Class is overlapping' })

        if (TestRoomId) { //Check if new Test Room is enought for student
            const maxSubTestClass = Math.floor(60 / (limitTime || testClass.limitTime))
            const max = testroom.maximum;
            const countStudent = await testClass.countStudents()
            if (countStudent > max * maxSubTestClass) return res.status(400).send({ message: 'Too many students in this test class' })

            const students = await testClass.getStudents();
            ////Check if any student have another testclass in same time
            if (date || examTime) {
                const isNotHasOverlapTest = await Promise.all(students.map(async(student) => {
                    const overlap = await isOverlap(student, date, examTime)
                    return !overlap
                }))
                if (isNotHasOverlapTest.includes(false)) return res.status(400).send({ message: 'One or more students have Overlap Test time' })
            }

            if (max < countStudent) {
                for (let i = 0; i < maxSubTestClass; i++) {
                    const sub = students.slice(i * max, i * max + max);
                    await testClass.setStudents(sub, { through: { subTestClass: `${examTime || testClass.examTime}.${i+1}` } })
                }
            } else {
                await testClass.setStudents(students, { through: { subTestClass: null } })
            }
        }

        const update = Object.assign(testClass, req.body)
        await update.save();
        return res.status(200).send(update)
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
        const query = q || '!!!'

        //find by test class code
        const byCode = await TestClass.findAll({
            where: {
                code: {
                    [Op.substring]: q || ''
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

        const testClasses = new Set([findByCode, findByStudyClass].flat(3))
        res.status(200).send(testClasses)
    } catch (err) {
        next(err)
    }
}

const addStudentToTestClass = async(req, res, next) => {
    try {
        //find test class to add student
        const testClass = await getInstance(req.params.id);
        if (!testClass) return res.status(404).send({ message: "Can't find test class" })

        //Check if students list is over size of test room
        const { studentIds } = req.body
        const testroom = await testClass.getTestRoom();
        const maxSubTestClass = Math.floor(60 / (testClass.limitTime))
        const max = testroom.maximum;
        const countStudent = await testClass.countStudents() + studentIds.length
        if (countStudent > max * maxSubTestClass) return res.status(400).send({ message: 'Too many students in this test class' })

        const oldStudent = await testClass.getStudents();
        const newStudentIds = studentIds.filter((id) => {
            const find = oldStudent.find(student => student.id == id || student.mssv == id)
            if (find) return false
            else return true
        })
        const newStudent = await Student.findAll({
            where: {
                [Op.or]: [{
                        mssv: {
                            [Op.or]: newStudentIds
                        }
                    },
                    {
                        id: {
                            [Op.or]: newStudentIds
                        }
                    },
                ]
            }
        })
        if (newStudent.length == 0) {
            const updateTestClass = await TestClass.findByPk(testClass.id, { include: [Student] })
            return res.status(200).send(updateTestClass)
        }

        //Check if any student have another testclass in same time
        const isNotHasOverlapTest = await Promise.all(newStudent.map(async(student) => {
            const overlap = await isOverlap(student, testClass.date, testClass.examTime)
            return !overlap
        }))
        if (isNotHasOverlapTest.includes(false)) return res.status(400).send({ message: 'One or more students have Overlap Test time' })

        //make sure to auto create sub test class on if condition is true
        const students = [...oldStudent, ...newStudent]

        if (max < students.length) {
            for (let i = 0; i < maxSubTestClass; i++) {
                const sub = students.slice(i * max, i * max + max);
                await testClass.setStudents(sub, { through: { subTestClass: `${examTime || testClass.examTime}.${i+1}` } })
            }
        } else {
            await testClass.setStudents(students, { through: { subTestClass: null } })
        }

        const updateTestClass = await TestClass.findByPk(testClass.id, { include: [Student] })
        return res.status(200).send(updateTestClass)
    } catch (err) {
        next(err)
    }
}

const setProctorToTestClass = async(req, res, next) => {
    try {
        const testClass = await getInstance(req.params.id);
        if (!testClass) return res.status(404).send({ message: "Can't find test class" });
        const { proctorIds } = req.body
        if (proctorIds.length > 2) return res.status(400).send({ message: "Too much proctor" })

        //Make sure to lecture don't have any test class at same time
        const proctors = await Lecture.findAll({
            where: {
                id: {
                    [Op.or]: [...proctorIds, null]
                }
            }
        })
        if (proctors.length == 0) return res.status(400).send({ message: "Can't find any Lecture" })

        const isNotHasOverlapTest = await Promise.all(proctors.map(async(proctor) => {
            const overlap = await isOverlap(proctor, testClass.date, testClass.examTime)
            return !overlap
        }))
        if (isNotHasOverlapTest.includes(false)) return res.status(400).send({ message: 'One or more Proctors have Overlap Test time' })

        //set the lecture to be proctor
        await testClass.setLectures(proctors)
        const update = await TestClass.findByPk(testClass.id, {
            include: {
                model: Lecture,
                as: 'Proctors'
            }
        })
        return res.status(200).send(update)
    } catch (err) {
        next(err)
    }
}

//-> not test
const addStudentsToTestClassByFile = async(req, res, next) => {
    try {
        //User must have permissionlevel >= 1 to using this method
        //read file to convert file to JSON key/value pair
        //excel file must have fullname, mssv column ordered
        // if(req.user.permissionLevel >= 1) res.statuc(403).send({message: 'not allowed'})

        //find test class to add student
        const testClass = await getInstance(req.params.id);
        if (!testClass) return res.status(404).send({ message: "Can't find test class" })
        const header = ['fullname', 'mssv']
        const data = xlsxToJSON(req.file.path, header)
        if (!checkValidData(data, header, ['name', 20182000])) res.status(400).send({
            message: 'incorrect format data'
        })

        //Get all Student
        const oldStudents = await testClass.getStudents()
        const studentIds = data.map((student) => { return student.mssv })
        const newStudentIds = studentIds.filter((id) => {
            const find = oldStudents.find(student => student.id == id || student.mssv == id)
            if (find) return false
            else return true
        })
        const newStudents = await Student.findAll({
            where: {
                mssv: {
                    [Op.or]: newStudentIds
                }
            }
        })

        if (newStudents.length == 0) {
            const updateTestClass = await TestClass.findByPk(testClass.id, { include: [Student] })
            return res.status(200).send({
                message: 'Upload success',
                success: 0,
                failed: studentIds.length,
                testClass: updateTestClass
            })
        }

        //Check if any student have another testclass in same time
        const isNotHasOverlapTest = await Promise.all(newStudents.map(async(student) => {
            const overlap = await isOverlap(student, testClass.date, testClass.examTime)
            return !overlap
        }))
        if (isNotHasOverlapTest.includes(false)) return res.status(400).send({ message: 'One or more students have Overlap Test time' })

        //make sure to auto create sub test class on if condition is true
        const students = [...oldStudents, ...newStudents]

        if (max < students.length) {
            for (let i = 0; i < maxSubTestClass; i++) {
                const sub = students.slice(i * max, i * max + max);
                await testClass.setStudents(sub, { through: { subTestClass: `${examTime || testClass.examTime}.${i+1}` } })
            }
        } else {
            await testClass.setStudents(students, { through: { subTestClass: null } })
        }

        const updateTestClass = await TestClass.findByPk(testClass.id, { include: [Student] })
        return res.status(200).send({
            message: 'Upload success',
            success: newStudents.length,
            failed: studentIds.length - newStudents.length,
            testClass: updateTestClass
        })

    } catch (err) {
        next(err)
    }
}

//-> not test
const addStudentsToTestClassesByFile = async(req, res, next) => {
    //User must have permissionlevel >= 1 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have subject code, Lecture user email, code, semester column ordered
    // if(req.user.permissionLevel >= 1) res.statuc(403).send({message: 'not allowed'})
    try {
        const header = ['fullname', 'mssv', 'code']
        const data = xlsxToJSON(req.file.path, header)
        if (!checkValidData(data, header, ['name', 20182000, 177013])) return res.status(400).send({ message: 'incorrect format data' })

        //Mapping data to get a set of test class code
        const testClassCode = new Set(data.map((element) => { return element.code }))

        //Using code to find test class
        const testClasses = await TestClass.findAll({
            where: {
                code: {
                    [Op.or]: testClassCode
                }
            }
        })

        //for each test class, filter data to get a student list
        const updateTestClasses = await Promise.all(testClasses.map(async(testClass) => {
            try {
                const studentIds = data.filter((element) => testClass.code == element.code).map((element) => { return element.mssv })
                const oldStudent = await testClass.getStudents();
                const newStudentIds = studentIds.filter((id) => {
                    const find = oldStudent.find(student => student.id == id || student.mssv == id)
                    if (find) return false
                    else return true
                })

                const newStudent = await Student.findAll({
                    where: {
                        mssv: {
                            [Op.or]: newStudentIds
                        }
                    }
                })

                if (newStudent.length == 0) throw new Error('Not find any new students')
                const isNotHasOverlapTest = await Promise.all(newStudent.map(async(student) => {
                    const overlap = await isOverlap(student, testClass.date, testClass.examTime)
                    return !overlap
                }))
                if (isNotHasOverlapTest.includes(false)) throw new Error(`One or more students have Overlap Test time on class number ${testClass.code}`)

                const students = [...oldStudent, ...newStudent]
                if (max < students.length) {
                    for (let i = 0; i < maxSubTestClass; i++) {
                        const sub = students.slice(i * max, i * max + max);
                        await testClass.setStudents(sub, { through: { subTestClass: `${examTime || testClass.examTime}.${i+1}` } })
                    }
                } else {
                    await testClass.setStudents(students, { through: { subTestClass: null } })
                }
                const updateTestClass = await TestClass.findByPk(testClass.id, { include: [Student] })
                return updateTestClass
            } catch (err) {
                console.log(err)
                return undefined
            }
        }))

        const updateSuccess = updateTestClasses.filter(tc => tc != undefined)
        return res.status(200).send({
            message: 'Upload Success',
            update: updateSuccess
        })

    } catch (err) {
        next(err)
    }
}


module.exports = {
    createTestClass,
    getTestClass,
    updateTestClass,
    deleteTestClass,
    findTestClass,
    addStudentToTestClass,
    setProctorToTestClass,
    addStudentsToTestClassByFile,
    addStudentsToTestClassesByFile,
}