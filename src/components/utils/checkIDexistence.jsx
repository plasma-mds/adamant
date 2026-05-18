// check if id already exists in a schema

const checkIDexistence = (schema, id, result) => {
    //alert(id)
    Object.keys(schema).forEach(key=>{
        if (typeof schema[key] !== "object"){
            //alert(id+" | "+schema[key])
            if (key === "id" || key === "$id") {
                if (schema[key] === id){
                    result = true
                }
            }
        }
        else if (typeof schema[key] === "object" ) {
            result = checkIDexistence(schema[key], id, result)
        }
    })

    if (result) {
        return true
    } else {
        return false
    }

}

export default checkIDexistence