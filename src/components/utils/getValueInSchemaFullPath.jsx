// get json value in schema given the full path
const getValueInSchemaFullPath = (json, path) => {
    let jsonData = JSON.parse(JSON.stringify(json))
    path = path.split('.')
    if (path[0] === "") {
        return undefined;
    }
    let tempValue = jsonData
    for (let i = 0; i < path.length; i++) {
        tempValue = tempValue[path[i]]
    }
    return tempValue
};

export default getValueInSchemaFullPath;