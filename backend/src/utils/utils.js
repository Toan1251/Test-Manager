const xlsx = require('xlsx')

const getColumnAddress = (index) => {
    const A = 'A'.charCodeAt(0);
    const firstCharIdx = Math.floor(index/26) - 1;
    const secondCharIdx = index - firstCharIdx*26 -26
    const firstChar = firstCharIdx >= 0 ? String.fromCharCode(firstCharIdx+A) : '';
    const secondChar = String.fromCharCode(secondCharIdx+A);
    return `${firstChar}${secondChar}`
}

//header is a list of key of JSON object when converting
const xlsxToJSON = (filepath, header) => {
    const workbook = xlsx.readFile(filepath, {cellDates: true})
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    header.forEach((head, index) => {
    //Limit at 26 column, maybefix later
        const col = getColumnAddress(index)
        worksheet[`${col}1`].w = header[index]
    })

    const data = xlsx.utils.sheet_to_json(worksheet, {UTC: true})

    return data
}

//using this to convert listObject to Sheet and send to User
const toSheet = (data, filename, header) => {

}

//Make Async Function Synchronous
// const wrapAsync = (asyncFunction) => {
//     return () => {
//         asyncFunction
//     }
// }

module.exports = {
    xlsxToJSON
}

