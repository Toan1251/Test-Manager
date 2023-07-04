const DataTypes = require("sequelize").DataTypes;

module.exports = (sequelize) => {
    const Subject = sequelize.define('Subject', {
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
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        institute: {
            type: DataTypes.STRING,
        },
    })

    return Subject
}