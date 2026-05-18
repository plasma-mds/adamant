const checkObjectExistance = (arr, path) => {
    let loc = false
    arr.forEach((element, index) => {
        if (element["path"] === path) {
            loc = index
        }
    })
    return loc;
}

const nicelySort = (arr) => {
    let sortedArr = []
    arr.forEach(element => {
        // check if an object with element["path"] already exists
        let loc = checkObjectExistance(sortedArr, element["path"])

        if (loc !== false) {
            let fieldArr = sortedArr[loc]["fields"]
            fieldArr.push({ key: element["key"], label: element["label"], value: element["value"], $id: element["$id"] })
        } else {
            // if not then create a new object
            let newObj = {}
            newObj["path"] = element["path"]
            newObj["pathURIs"] = element["pathURIs"]
            newObj["pathLabels"] = element["pathLabels"]
            newObj["fields"] = [{ key: element["key"], label: element["label"], value: element["value"], $id: element["$id"] }]
            //console.log(newObj)
            sortedArr.push(newObj)
        }
    });


    return sortedArr;
}

export default nicelySort;