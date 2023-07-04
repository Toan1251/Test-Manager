const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const Lecture = sequelize.define('Lecture' ,{
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        fullname: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        dateOfBirth: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        institute: {
            type: DataTypes.STRING,
        },
        major: {
            type: DataTypes.STRING,
            allowNull: false,
        }
    })

    return Lecture
}