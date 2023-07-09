const { xlsxToJSON, checkValidData } = require('../utils/utils')
const { TestRoom, TestClass } = require('../models/models')
const Op = require('sequelize').Op

const getTestRoomInstance = async(id, options = {}) => {
    let instance = await TestRoom.findByPk(id, {...options });
    if (!instance) {
        const number = id.toLowerCase()
        instance = await TestRoom.findOne({
            where: { number: number },
            ...options
        })
    }
    if (!instance) return undefined
    else return instance
}

const createTestRoom = async(req, res, next) => {
    try {
        const { number, building, maximum, isComputerSupported } = req.body
        const newTestRoom = await TestRoom.create({
            number: number.toLowerCase(),
            building: building.toLowerCase(),
            maximum,
            isComputerSupported
        })
        res.status(200).send(newTestRoom)
    } catch (err) {
        next(err)
    }
}

const getTestRoom = async(req, res, next) => {
    try {
        const testroom = await getTestRoomInstance(req.params.id, { include: [TestClass] })
        if (!testroom) res.status(404).send({ message: 'Room not found' })
        else res.status(200).send(testroom)

    } catch (err) {
        next(err)
    }
}

const updateTestRoom = async(req, res, next) => {
    try {
        const tr = await getTestRoomInstance(req.params.id, { include: [TestClass] })
        if (!tr) res.status(404).send({ message: 'Room not found' });

        const testroom = Object.assign(tr, req.body)
        await testroom.save();
        res.status(200).send(testroom)
    } catch (err) {
        next(err)
    }
}

const deleteTestRoom = async(req, res, next) => {
    try {
        const tr = await getTestRoomInstance(req.params.id, { include: [TestClass] })
        if (!tr) res.status(404).send({ message: 'Room not found' });
        else {
            await tr.destroy()
            res.status(200).send({ message: 'this room was deleted' })
        }
    } catch (err) {
        next(err)
    }
}

const getTestRoomByQuery = async(req, res, next) => {
    try {
        const { q, computer } = req.query
        const trs = await TestRoom.findAll({
            where: {
                [Op.and]: [{
                        number: {
                            [Op.substring]: q || ''
                        }
                    },
                    { isComputerSupported: computer ? true : false }
                ]
            }
        })
        res.status(200).send({ TestRooms: trs })
    } catch (err) {
        next(err)
    }
}

const bulkCreateTestRooms = async(req, res, next) => {
    //User must have permissionlevel = 2 to using this method
    //read file to convert file to JSON key/value pair
    //excel file must have number,building,maximum,isComputerSupported column ordered

    // if(req.user.permissionLevel != 2) res.statuc(403).send({message: 'not allowed'})
    const header = ['number', 'building', 'maximum', 'isComputerSupported'];
    try {
        const data = xlsxToJSON(req.file.path, header);
        if (!checkValidData(data, header, ['b1-404', 'C2', 40, true])) res.status(400).send({
            message: 'incorrect format data'
        })

        const testRooms = await Promise.all(data.map(async(element) => {
            try {
                const newTestRoom = await TestRoom.create({
                    number: element.number.toLowerCase(),
                    building: element.building.toLowerCase(),
                    maximum: element.maximum,
                    isComputerSupported: element.isComputerSupported
                })

                return newTestRoom
            } catch (err) {
                return
            }
        }))

        const newTestRooms = testRooms.filter(tr => tr !== undefined);
        res.status(200).send({
            message: 'upload success',
            success: newTestRooms.length,
            failure: testRooms.length - newTestRooms.length,
            newTestRooms
        })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    createTestRoom,
    getTestRoom,
    updateTestRoom,
    deleteTestRoom,
    getTestRoomByQuery,
    bulkCreateTestRooms,
    getTestRoomInstance
}