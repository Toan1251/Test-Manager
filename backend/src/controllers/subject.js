const { xlsxToJSON, checkValidData, generateCode } = require('../utils/utils')
const { Subject, StudyClass } = require('../models/models')
const Op = require('sequelize').Op

const getSubjectInstance = async(id, options = {}) => {
    try {
        let instance = await Subject.findByPk(id, {...options })
        if (!instance) instance = await Subject.findOne({
            where: { code: id },
            ...options
        })

        if (!instance) return undefined;
        else return instance
    } catch (err) {
        return undefined
    }
}

const getSubject = async(req, res, next) => {
    try {
        const subject = await getSubjectInstance(req.params.id, { include: [StudyClass] })
        if (!subject) res.status(404).send({ message: 'not found' });

        res.status(200).send(subject)
    } catch (err) {
        next(err)
    }
}

const createSubject = async(req, res, next) => {
    try {
        const { code, name, institute } = req.body;
        const newSubject = await Subject.create({
            code: code || generateCode(1e3, 1e4, { isString: true }),
            name,
            institute
        })

        res.status(200).send(newSubject)
    } catch (err) {
        next(err)
    }
}

const updateSubject = async(req, res, next) => {
    try {
        const subject = await getSubjectInstance(req.params.id)
        if (!subject) res.status(404).send({ message: 'not found' });

        const updateSubject = Object.assign(subject, req.body)
        await updateSubject.save()

        res.status(200).send(updateSubject)
    } catch (err) {
        next(err)
    }
}

const deleteSubject = async(req, res, next) => {
    try {
        const subject = await getSubjectInstance(req.params.id)
        if (!subject) res.status(404).send({ message: 'not found' });
        else {
            await subject.destroy();
            res.status(200).send({ message: 'delete subject success' });
        }

    } catch (err) {
        next(err)
    }
}

const getSubjectsByQuery = async(req, res, next) => {
    try {
        const { q } = req.query;
        const Subjects = await Subject.findAll({
            where: {
                [Op.or]: [{
                        code: {
                            [Op.substring]: q
                        }
                    },
                    {
                        name: {
                            [Op.substring]: q
                        }
                    },
                ]
            }
        })

        res.status(200).send(Subjects)
    } catch (err) {
        next(err)
    }
}

const bulkCreateSubjects = async(req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have code,name,institute column ordered

    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})
    const header = ['code', 'name', 'institute']
    try {
        const data = xlsxToJSON(req.file.path, header)
        if (!checkValidData(data, header, ['IT2000', 'name', 'institute'])) res.status(400).send({
            message: 'incorect format data'
        })

        const Subjects = await Promise.all(data.map(async(element) => {
            try {
                const newSubject = await Subject.create({
                    ...element
                })
                return newSubject
            } catch (err) {
                return undefined
            }
        }))

        const newSubjects = Subjects.filter(sj => sj !== undefined)
        res.status(200).send({
            message: 'upload success',
            success: newSubjects.length,
            failed: data.length - newSubjects.length,
            newSubjects
        })
    } catch (err) {
        next(err)
    }
}


module.exports = {
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByQuery,
    bulkCreateSubjects,
    getSubjectInstance
}