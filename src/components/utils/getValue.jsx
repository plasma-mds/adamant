// get json value given path
const getValue = (json, path) => {
    if (path === undefined) {
        return json["properties"]
    }
    let jsonData = JSON.parse(JSON.stringify(json))
    path = path.split('.')
    let tempValue = jsonData
    for (let i = 0; i < path.length; i++) {
        tempValue = tempValue[path[i]]
        if (tempValue === undefined){
            return tempValue
        }
    }
    return tempValue
};

export default getValue;