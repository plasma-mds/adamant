import getValue from "./getValue";
import set from "set-value";

// delete key and value given path
const deleteKey = (json, path) => {
    let jsonData = JSON.parse(JSON.stringify(json))
    let newPath = path.split('.')
    newPath.pop()
    newPath = newPath.join('.')
    const elementValue = getValue(jsonData, newPath);

    if (Array.isArray(elementValue)) {
        let deleteIndex = path.split('.')
        deleteIndex = deleteIndex.at(-1)

        elementValue.splice(parseInt(deleteIndex), 1)

        set(jsonData, newPath, elementValue)

        return jsonData;
    } else {
        let deleteIndex = path.split('.')
        deleteIndex = deleteIndex.at(-1)

        delete elementValue[deleteIndex]

        set(jsonData, newPath, elementValue)

        return jsonData;
    }

};

export default deleteKey;