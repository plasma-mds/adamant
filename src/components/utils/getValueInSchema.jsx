// get json value in schema given path
const getValueInSchema = (json, path) => {
    if (path === undefined) {
        return json["properties"]
    }
    let jsonData = JSON.parse(JSON.stringify(json))
    path = path.split('.')
    if (path[0] === "") {
        return undefined;
    }
    let tempValue = jsonData["properties"]
    for (let i = 0; i < path.length; i++) {
        if (tempValue["type"] === "object") {
            tempValue = tempValue["properties"][path[i]]
        } else {
            tempValue = tempValue[path[i]]
        }
    }
    return tempValue
};

export default getValueInSchema;