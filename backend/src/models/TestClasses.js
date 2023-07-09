const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const TestClass = sequelize.define('TestClass', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        examTime: {
            type: DataTypes.INTEGER, //1: 7h-8h, 2:8h10-9h10
            allowNull: false,
        },
        limitTime: {
            type: DataTypes.INTEGER, // Minute
            allowNull: false,
        }
    })

    return TestClass
}