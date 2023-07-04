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
            type: DataTypes.INTEGER,  //1: 6h45-9h, 2:9h15 - 11h30, ...
            allowNull: false,
        },
        subExamTime: {
            type: DataTypes.INTEGER, // Sub exam time when exam will be split because limitTime is short
        },
        limitTime: {
            type: DataTypes.INTEGER,  // Minute
            allowNull: false,
        }
    })

    return TestClass
}