const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const Student = sequelize.define('Student' ,{
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        mssv: { //MSSV for mssv info on file reading
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false
        },
        fullname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dateOfBirth: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        schoolYear: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        major: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    })

    return Student
}