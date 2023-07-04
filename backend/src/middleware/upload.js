const multer = require('multer');
const fs = require('fs');
const path = require('path');

const time = () => {
    return Math.floor(new Date().getTime() / 1000)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public')
    },
    filename: (req, file, cb) => {
        let filename = time() + "_" + file.originalname
        cb(null, filename)
    }
})

const multerUpload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if(!file.originalname.match(/\.(xlsx|XLSX|csv|CSV)/)){
            req.fileValidationError = 'Only xlsx or csv is accepted';
            return cb(new Error('Only xlsx or csv is accepted'), false)
        }
        cb(null, true)
    }
})

module.exports = multerUpload