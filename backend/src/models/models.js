const Sequelize = require("sequelize").Sequelize;
const DB = require("../config/config").DB

const sequelize = new Sequelize(DB.DB_NAME, DB.DB_USER, DB.DB_PASSWORD, {
    host: DB.DB_HOST,
    dialect: DB.dialect,
    logging: false
});

const connection = async() => {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

connection()

// Require Models
const Lecture = require('./Lectures')(sequelize);
const User = require('./Users')(sequelize);
const Student = require('./Students')(sequelize);
const StudyClass = require('./StudyClasses')(sequelize);
const Subject = require('./Subjects')(sequelize);
const TestClass = require('./TestClasses')(sequelize);
const TestRoom = require('./TestRooms')(sequelize);
const Student_TestClass = require('./Student_TestClass')(sequelize)

// Make Association
User.hasOne(Student);
Student.belongsTo(User);

User.hasOne(Lecture);
Lecture.belongsTo(User);

Subject.hasMany(StudyClass);
StudyClass.belongsTo(Subject);

Lecture.hasMany(StudyClass);
StudyClass.belongsTo(Lecture);

Student.belongsToMany(StudyClass, { through: 'Students_StudyClasses' });
StudyClass.belongsToMany(Student, { through: 'Students_StudyClasses' });

StudyClass.hasMany(TestClass);
TestClass.belongsTo(StudyClass);

TestRoom.hasMany(TestClass);
TestClass.belongsTo(TestRoom);

Lecture.belongsToMany(TestClass, { through: 'Lectures_TestClasses' });
TestClass.belongsToMany(Lecture, { through: 'Lectures_TestClasses' });

Student.belongsToMany(TestClass, { through: Student_TestClass });
TestClass.belongsToMany(Student, { through: Student_TestClass });


// sync to database
sequelize.sync({ force: false })

module.exports = {
    Sequelize,
    sequelize,
    Lecture,
    User,
    Student,
    StudyClass,
    TestClass,
    Subject,
    TestRoom
};