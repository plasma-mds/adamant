import getValueInSchema from "./getValueInSchema";

const getPathURIsAndLabels = (object, path) => {

    let pathArr = path.split(".")
    let newPath = []
    let uris = []
    let labels = []
    for (let i = 0; i < pathArr.length; i++) {
        newPath.push(pathArr[i])

        let thePath = JSON.parse(JSON.stringify(newPath));
        thePath = thePath.join(".")
        let value = getValueInSchema(object, thePath)
        if (typeof (value) === "object") {
            if (value["$id"] !== undefined) {
                uris.push(value["$id"])
            }
            else if (value["id"] !== undefined) {
                uris.push(value["id"])
            }
            else {
                uris.push("")
            }
            if (value["title"] !== undefined) {
                labels.push(value["title"])
            } else {
                labels.push("")
            }
        } else {
            uris.push("")
            labels.push("")
        }
    }

    return [uris, labels];

}

export default getPathURIsAndLabels;