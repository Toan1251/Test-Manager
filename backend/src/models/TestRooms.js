const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const TestRoom = sequelize.define("TestRoom", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        number: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        building: {
            type: DataTypes.STRING,
            allowNull: false
        },
        maximum: {  //Maximum student in a room
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 35
        },
        isComputerSupported: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
        }
    })

    return TestRoom
}