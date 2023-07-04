const {xlsxToJSON} = require('../utils/utils')
const {TestRoom, TestClass} = require('../models/models')
const Op = require('sequelize').Op

const createTestRoom = async(req, res, next) => {
    try{
        const {number, building, maximum, isComputerSupported} = req.body
        const newTestRoom = await TestRoom.create({
            number: number.toLowerCase(),
            building: building.toLowerCase(),
            maximum,
            isComputerSupported
        })
        res.status(200).send(newTestRoom)
    }catch(err){
        next(err)
    }
}

const getTestRoom = async(req, res, next) => {
    try{
        let tr = await TestRoom.findByPk(req.params.id);
        if (!tr){
            const number = req.params.id.toLowerCase()
            tr = await TestRoom.findOne({
                where: {number: number}
            })
        }
        if(!tr) res.status(404).send({message: 'Room not found'})
        
        // Getting Every TestClass on this Testroom
        const tcls = await tr.getTestClasses()
        res.status(200).send({
            ...tr.toJSON(),
            testClasses: tcls
        })

    }catch(err){
        next(err)
    }
}

const updateTestRoom = async(req, res, next) => {
    try{
        let tr = await TestRoom.findByPk(req.params.id);
        if (!tr){
            const number = req.params.id.toLowerCase()
            tr = await TestRoom.findOne({
                where: {number: number}
            })
        }
        if(!tr) res.status(404).send({message: 'Room not found'});

        const {building, maximum, isComputerSupported} = req.body
        tr.building = building ? building : tr.building
        tr.maximum = maximum ? maximum : tr.maximum
        tr.isComputerSupported = isComputerSupported ? isComputerSupported : tr.isComputerSupported

        await tr.save();
        res.status(200).send(tr)
    }catch(err){
        next(err)
    }
}

const deleteTestRoom = async (req, res, next) => {
    try{
        let tr = await TestRoom.findByPk(req.params.id);
        if (!tr){
            const number = req.params.id.toLowerCase()
            tr = await TestRoom.findOne({
                where: {number: number}
            })
        }
        if(!tr) res.status(404).send({message: 'Room not found'});
        else {
            await tr.destroy()
            res.status(200).send({message: 'this room was deleted'})
        }
    }catch(err){
        next(err)
    }
}

const getTestRoomByQuery = async (req, res, next) => {
    try{
        const {q, computer} = req.query
        const trs = await TestRoom.findAll({ where: {
                [Op.and]:[
                    {number: {[Op.substring]: q.toLowerCase()}},
                    {isComputerSupported: computer ? true : false}
                ]
            }
        })
        res.status(200).send({TestRooms: trs})
    }catch(err){
        next(err)
    }
}

const bulkCreateTestRooms = async(req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have number,building,maximum,isComputerSupported column ordered
    
    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})
    const header = ['number', 'building', 'maximum', 'isComputerSupported'];
    try{
        const data = xlsxToJSON(req.file.path, header);

        const testRooms = await Promise.all(data.map(async(element) => {
            try{
                const newTestRoom = await TestRoom.create({
                    number: element.number.toLowerCase(),
                    building: element.building.toLowerCase(),
                    maximum: element.maximum,
                    isComputerSupported: element.isComputerSupported
                })

                return newTestRoom
            }catch(err){
                return
            }
        }))

        const newTestRooms = testRooms.filter(tr => tr !== undefined);
        res.status(200).send({
            message: 'upload success',
            success: newTestRooms.length,
            failure: testRooms.length - newTestRooms.length
        })
    }catch(err){
        next(err)
    }
}

module.exports = {
    createTestRoom,
    getTestRoom,
    updateTestRoom,
    deleteTestRoom,
    getTestRoomByQuery,
    bulkCreateTestRooms
}