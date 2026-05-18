const convertedSchemaPropertiesSort = (convertedSchemaProperties) => {

    let newSchemaProperties = []
    for (let i=0;i<convertedSchemaProperties.length;i++){
        // better ordering
        let emptyObject = {}
        let emptyArray = []
        Object.keys(convertedSchemaProperties[i]).forEach(keyword=>{
            emptyArray.push(keyword)
        })
        if (emptyArray.includes("$schema")) {
             emptyObject["$schema"] = convertedSchemaProperties[i]["$schema"]
             emptyArray = emptyArray.filter(function(f) {return f !== "$schema"})
        }
        if (emptyArray.includes("$id")) {
            emptyObject["$id"] = convertedSchemaProperties[i]["$id"]
            emptyArray = emptyArray.filter(function(f) {return f !== "$id"})
        }
        if (emptyArray.includes("id")) {
            emptyObject["id"] = convertedSchemaProperties[i]["id"]
            emptyArray = emptyArray.filter(function(f) {return f !== "id"})
        }
        if (emptyArray.includes("title")) {
            emptyObject["title"] = convertedSchemaProperties[i]["title"]
            emptyArray = emptyArray.filter(function(f) {return f !== "title"})
        }
        if (emptyArray.includes("description")) {
            emptyObject["description"] = convertedSchemaProperties[i]["description"]
            emptyArray = emptyArray.filter(function(f) {return f !== "description"})
        }
        if (emptyArray.includes("type")) {
            emptyObject["type"] = convertedSchemaProperties[i]["type"]
            emptyArray = emptyArray.filter(function(f) {return f !== "type"})
        }
        if (emptyArray.includes("properties")){
            let sorted = convertedSchemaPropertiesSort(convertedSchemaProperties[i]["properties"])
            emptyObject["properties"] = sorted
            emptyArray = emptyArray.filter(function(f) {return f !== "properties"})
        }
        if (emptyArray.includes("required")){
            emptyObject["required"] = convertedSchemaProperties[i]["required"]
            emptyArray = emptyArray.filter(function(f) {return f !== "required"})
        }

        if (emptyArray.length !== 0) {
            for (let i = 0; i<emptyArray.length; i++){
                emptyObject[emptyArray[i]] = convertedSchemaProperties[i][emptyArray[i]]
            }
        }
        newSchemaProperties.push(emptyObject)
    }
    
    return newSchemaProperties;
};

export default convertedSchemaPropertiesSort;