const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const StudyClass = sequelize.define('StudyClass', {
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
        semester: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
    })

    return StudyClass
}