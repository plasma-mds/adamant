// curently only works with flat json structure
import listMimeTypes from "../../assets/mime-types-extensions.json"

const table2DescListTable = (table) => {

    // create table definition (?)
    //let descListTable = `<div>${table["title"]}</div>\n`
    let descListTable = `<div style="background-color: #ffffff; border: 0px;">`
    descListTable += `<a style="color:#000000;"><strong>${table["title"]}</strong></a>`
    descListTable += "</div>\n"

    descListTable += "<div>\n"
    descListTable += `<table style="border-collapse: collapse;" border="1">\n`
    descListTable += `<tbody>\n`

    // now create the table header
    let keyTitleMapper = []
    descListTable += `<tr>\n`
    descListTable += `<td style="text-align: left;"><strong>No.</strong></td>\n`
    Object.keys(table["schemaProperties"]).forEach((element, index) => {
        //keyTitleMapper.push({ [element]: table["schemaProperties"][element]["title"] })
        keyTitleMapper.push(element)
        descListTable += `<td style="text-align: center;"><strong>${table["schemaProperties"][element]["title"]}</strong></td>\n`
    })
    descListTable += `</tr>\n`

    // now the table contents
    table["value"].forEach((element, index) => {
        descListTable += `<tr>\n`
        descListTable += `<td style="text-align: center;">${index + 1}</td>\n`
        keyTitleMapper.forEach(item => {
            // check if value is of data url base64
            if (table["value"][index][item] === undefined) {
                descListTable += `<td style="text-align: left;">n/a</td>\n`
            } else {
                if (typeof table["value"][index][item] === "string"){
                    if (table["value"][index][item].startsWith("data:") & table["value"][index][item].includes("base64")) {
                        //console.log(table["fieldKey"] + "-" + (index + 1))
                        let extension = table["value"][index][item].split(";")[0].replace("data:", "")
                        extension = Object.keys(listMimeTypes).find(key => listMimeTypes[key] === extension)
                        let fileName = table["fieldKey"] + "-" + (index + 1) + extension
                        console.log(fileName)
                        descListTable += `<td style="text-align: left;">See attachment (${fileName})</td>\n`
                    }
                    else if (table["value"][index][item].trim() === "") {
                        descListTable += `<td style="text-align: left;">n/a</td>\n`
                    }
                    else {
                        descListTable += `<td style="text-align: left;">${table["value"][index][item].trim()}</td>\n`
                    }
                }
                else {
                    descListTable += `<td style="text-align: left;">${table["value"][index][item]}</td>\n`
                }
            }
        })
        descListTable += `</tr>\n`
    });

    descListTable += "</tbody>\n"
    descListTable += `</table>\n`
    descListTable += `</div>\n`
    descListTable += `<div>&nbsp;</div>\n`


    return descListTable
}


export default table2DescListTable;