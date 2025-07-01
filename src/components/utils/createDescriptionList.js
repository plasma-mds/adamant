import listMimeTypes from "../../assets/mime-types-extensions.json"

const createDescriptionList = (data) => {
    let descList = "";
    const emptyString = (element) => element === "";

    data.forEach(element => {
        if (element["path"] === "") {
            //descList += "<dl>\n";
            element["fields"].forEach(item => {
                if (item["$id"] !== undefined) {
                    descList += `<dt><span style="color: #ffffff;"><a style="color: #ffffff;" title=${item["$id"]} href=${item["$id"]}>${item["label"]}</a></span></dt>\n`
                    descList += `<dd>${item["value"]}</dd>\n`
                } else {
                    descList += `<dt>${item["label"]}</dt>\n`
                    if (typeof (item["value"]) === "string") {
                        if (item["value"].startsWith("data:") & item["value"].includes("base64")) {
                            let extension = item["value"].split(";")[0].replace("data:", "")
                            extension = Object.keys(listMimeTypes).find(key => listMimeTypes[key] === extension)
                            let fileName = item["key"] + extension
                            descList += `<dd>See attachment (${fileName})</dd>\n`
                        }
                        else {
                            descList += `<dd>${item["value"]}</dd>\n`
                        }
                    }
                    else {
                        descList += `<dd>${item["value"]}</dd>\n`
                    }
                }
            })
            //descList += "</dl>\n"
        } else {
            let pathArr = element["path"].split(".");
            //let titleDiv = `<div style="background-color: #ffffff; border: 0px; height: 10px;"></div>\n`
            let titleDiv = `</dl>`
            titleDiv += `<div style="background-color: #ffffff; border: 0px;">`
            pathArr.forEach((item, index) => {
                if (element["pathURIs"] !== undefined & !element["pathURIs"].some(emptyString)) {
                    if (item !== "") {
                        if (index === (pathArr.length - 1)) {
                            titleDiv += `<a style="color:#29AEB9;" title=${element["pathURIs"][index]} href=${element["pathURIs"][index]}><strong>${element["pathLabels"][index]}</strong></a>`

                        } else {
                            titleDiv += `<a style="color:#29AEB9;" title=${element["pathURIs"][index]} href=${element["pathURIs"][index]}>${element["pathLabels"][index]}</a><a style="color: #29aeb9;">/</a>`
                        }
                    } else {
                        if (index === (pathArr.length - 1)) {
                            titleDiv += `<a style="color:#000000;"><strong>${element["pathLabels"][index]}</strong></a>`

                        } else {
                            titleDiv += `<a style="color:#000000;">${element["pathLabels"][index]}/</a>`
                        }
                    }
                } else {
                    if (index === (pathArr.length - 1)) {
                        titleDiv += `<a style="color:#000000;"><strong>${element["pathLabels"][index]}</strong></a>`

                    } else {
                        titleDiv += `<a style="color:#000000;">${element["pathLabels"][index]}/</a>`
                    }
                }
            })
            titleDiv += "</div>\n"
            titleDiv += "<dl>"

            descList += titleDiv
            //descList += "<dl>\n";
            element["fields"].forEach(item => {
                if (item["$id"] !== undefined) {
                    descList += `<dt><span style="color: #ffffff;"><a style="color: #ffffff;" title=${item["$id"]} href=${item["$id"]}>${item["label"]}</a></span></dt>\n`
                    if (typeof (item["value"]) === "string") {
                        if (item["value"].startsWith("data:") & item["value"].includes("base64")) {
                            let extension = item["value"].split(";")[0].replace("data:", "")
                            extension = Object.keys(listMimeTypes).find(key => listMimeTypes[key] === extension)
                            let fileName = item["key"] + extension
                            descList += `<dd>See attachment (${fileName})</dd>\n`
                        }
                        else {
                            descList += `<dd>${item["value"]}</dd>\n`
                        }
                    }
                    else {
                        descList += `<dd>${item["value"]}</dd>\n`
                    }
                }
                else if (item["$id"] === undefined & item["id"] !== undefined) {
                    descList += `<dt><span style="color: #ffffff;"><a style="color: #ffffff;" title=${item["id"]} href=${item["id"]}>${item["label"]}</a></span></dt>\n`
                    if (typeof (item["value"]) === "string") {
                        if (item["value"].startsWith("data:") & item["value"].includes("base64")) {
                            let extension = item["value"].split(";")[0].replace("data:", "")
                            extension = Object.keys(listMimeTypes).find(key => listMimeTypes[key] === extension)
                            let fileName = item["key"] + extension
                            descList += `<dd>See attachment (${fileName})</dd>\n`
                        }
                        else {
                            descList += `<dd>${item["value"]}</dd>\n`
                        }
                    }
                    else {
                        descList += `<dd>${item["value"]}</dd>\n`
                    }
                }

                else {
                    descList += `<dt>${item["label"]}</dt>\n`
                    if (typeof (item["value"]) === "string") {
                        if (item["value"].startsWith("data:") & item["value"].includes("base64")) {
                            let extension = item["value"].split(";")[0].replace("data:", "")
                            extension = Object.keys(listMimeTypes).find(key => listMimeTypes[key] === extension)
                            let fileName = item["key"] + extension
                            descList += `<dd>See attachment (${fileName})</dd>\n`
                        }
                        else {
                            descList += `<dd>${item["value"]}</dd>\n`
                        }
                    }
                    else {
                        descList += `<dd>${item["value"]}</dd>\n`
                    }
                }
            })
            //descList += "</dl>\n"

        }

    });


    return descList;
}

export default createDescriptionList;