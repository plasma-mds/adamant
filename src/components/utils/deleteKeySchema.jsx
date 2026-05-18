import getValue from "./getValue";
import set from "set-value";

// delete key and value given path
const deleteKeySchema = (json, path) => {
    let jsonData = JSON.parse(JSON.stringify(json));
    let pathArray = path.split('.');

    if (pathArray.length === 1) {
        delete jsonData[pathArray[0]];
    } else {
        let tobeDeleted = pathArray.pop();
        pathArray = pathArray.join(".");
        let value = getValue(jsonData, pathArray);
        delete value[tobeDeleted]
        set(jsonData, pathArray, value);
    }

    return jsonData;


};

export default deleteKeySchema;