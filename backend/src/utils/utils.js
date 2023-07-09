const xlsx = require('xlsx')

const getColumnAddress = (index) => {
    const A = 'A'.charCodeAt(0);
    const firstCharIdx = Math.floor(index / 26) - 1;
    const secondCharIdx = index - firstCharIdx * 26 - 26
    const firstChar = firstCharIdx >= 0 ? String.fromCharCode(firstCharIdx + A) : '';
    const secondChar = String.fromCharCode(secondCharIdx + A);
    return `${firstChar}${secondChar}`
}

//header is a list of key of JSON object when converting
const xlsxToJSON = (filepath, header) => {
    const workbook = xlsx.readFile(filepath, { cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    header.forEach((head, index) => {
        //Limit at 26 column, maybefix later
        const col = getColumnAddress(index)
        worksheet[`${col}1`].w = header[index]
    })

    const data = xlsx.utils.sheet_to_json(worksheet, { UTC: true })

    return data
}

//data: list object receive when calling xlsxToJSON
//header: key of object
//types: a list to check if data is unvalid
const checkValidData = (data, header, types) => {
    const sample = data[0];
    header.forEach((head, index) => {
        if (typeof sample[head] !== typeof types[index]) return false
    })
    return true;
}

//Using for auto generate Code when create
const generateCode = (min = 1e8, max = 1e9, options = { isNumber: true, isString: false }) => {
    let code = Math.floor(Math.random() * (max - min) + min);
    if (isNumber && !isString) {
        return code
    } else {
        let characters = 'QWERTYUIOPASDFGHJKLZXCVBNM'
        let prefix = characters.charAt(Math.floor(Math.random() * characters.length))
        prefix += characters.charAt(Math.floor(Math.random() * characters.length))
        return prefix + code.toString()
    }
}

const getInstance = async(model, options = {}) => {
    const include = options.include ? options.include : [];
    const where = options.where ? options.where : {}
    const instance = await model.findOne({ where: where, include: include })
    return instance
}

//using this to convert listObject to Sheet and send to User
const toSheet = (data, filename, header) => {

}



module.exports = {
    xlsxToJSON,
    checkValidData,
    generateCode,
    getInstance
}