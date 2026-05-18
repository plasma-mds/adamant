import getPaths from "./getPaths";
import getPathURIsAndLabels from "./getPathURIsAndLabels";

/**
 * Get rid of the last two items of each path in pathArr
 * @param {*} pathArr 
 * @returns processedArr
 */
const pathPreProcess = (pathArr) => {
    let processedArr = []
    pathArr.forEach((item) => {
        item = item.split(".");
        item.pop();
        item.pop();
        item = item.join(".");
        processedArr.push(item)
    })

    return processedArr
}

const preProcessB4DescList = (content, originalContent, originalSchema, arr) => {

    Object.keys(content).forEach((item) => {
        if (content[item]["label"] === undefined) {
            preProcessB4DescList(content[item], originalContent, originalSchema, arr)
        }
        else {
            if (content[item]["value"] !== undefined) {
                /*
                 a function to get a path of a given a key:attribute pair
                */
                let path_key = getPaths(originalContent, content[item]["key"])
                path_key = pathPreProcess(path_key)
                let path_label = getPaths(originalContent, content[item]["label"])
                path_label = pathPreProcess(path_label)
                let path = path_key.filter(value => path_label.includes(value));
                let URIsAndLabels = getPathURIsAndLabels(originalSchema, path[0])

                arr.push({
                    "path": path[0],
                    "pathURIs": URIsAndLabels[0],
                    "pathLabels": URIsAndLabels[1],
                    "key": content[item]["key"],
                    "label": content[item]["label"],
                    "value": content[item]["value"],
                    "$id": content[item]["$id"]
                })
            }
        }
    })

    return arr;
};

export default preProcessB4DescList;