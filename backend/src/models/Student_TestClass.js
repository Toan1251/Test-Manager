const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const Student_TestClass = sequelize.define('Students_TestClass', {
        StudentId: {
            type: DataTypes.UUID,
            references: {
                model: 'Students',
                key: 'id'
            }
        },
        TestClassId: {
            type: DataTypes.UUID,
            references: {
                model: 'TestClasses',
                key: 'id'
            }
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