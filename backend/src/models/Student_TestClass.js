const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const Student_TestClass = sequelize.define('Students_TestClass', {
        subTestClass: {
            type: DataTypes.STRING
        },
        isSubmitted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        note: {
            type: DataTypes.TEXT
        }
    })

    return Student_TestClass
}