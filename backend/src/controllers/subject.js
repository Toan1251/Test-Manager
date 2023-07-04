const {xlsxToJSON} = require('../utils/utils')
const Subject = require('../models/models').Subject
const Op = require('sequelize').Op

const getSubject = async (req, res, next) => {
    try{
        let subject = await Subject.findByPk(req.params.id);
        if(!subject){
            subject = await Subject.findOne({
                where: {code: req.params.id}
            })
        }
        if(!subject) res.status(404).send({message: 'not found'});
        
        res.status(200).send(subject)
    }catch(err){
        next(err)
    }
}

const createSubject = async (req, res, next) => {
    try{
        const {code, name, institute} = req.body;
        const newSubject = await Subject.create({
            code,
            name,
            institute
        })

        res.status(200).send(newSubject)
    }catch(err){
        next(err)
    }
}

const updateSubject = async (req, res, next) => {
    try{
        let subject = await Subject.findByPk(req.params.id);
        if(!subject){
            subject = await Subject.findOne({
                where: {code: req.params.id}
            })
        }
        if(!subject) res.status(404).send({message: 'not found'});

        const {name, institute} = req.body;
        subject.name = name ? name : subject.name;
        subject.institute = institute ? institute : subject.institute;
        await subject.save();

        res.status(200).send(subject)
    }catch(err){
        next(err)
    }
}

const deleteSubject = async (req, res, next) => {
    try{
        let subject = await Subject.findByPk(req.params.id);
        if(!subject){
            subject = await Subject.findOne({
                where: {code: req.params.id}
            })
        }
        if(!subject) res.status(404).send({message: 'not found'});
        else {
            await subject.destroy();
            res.status(200).send({message: 'delete subject success'});
        }

    }catch(err){
        next(err)
    }
}

const getSubjectsByQuery = async (req, res, next) => {
    try{
        const {q} = req.query;
        const Subjects = await Subject.findAll({where: {
            [Op.or]: [
                {code: {[Op.substring]: q}},
                {name: {[Op.substring]: q}},
            ]
        }})

        res.status(200).send({Subjects})
    }catch(err){
        next(err)
    }
}

const bulkCreateSubjects = async (req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have code,name,institute column ordered
    
    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})
    const header = ['code', 'name', 'institute']
    try{
        const data = xlsxToJSON(req.file.path, header)

        const Subjects = await Promise.all(data.map(async(element) => {
            try{
                const newSubject = await Subject.create({
                    code: element.code,
                    name: element.name,
                    institute: element.institute
                })
                return newSubject
            }catch(err){
                return 
            }
        }))

        const newSubjects = Subjects.filter(sj => sj !== undefined)
        res.status(200).send({
            message: 'upload success',
            success: newSubjects.length,
            failed: data.length - newSubjects.length
        })
    }catch(err){

    }
}


module.exports = {
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
    getSubjectsByQuery,
    bulkCreateSubjects
}