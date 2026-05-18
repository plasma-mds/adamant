import set from "set-value";

/*
Function to add or remove "required" flag for a specific field
*/


// get json value given path
const getValue = (json, path) => {
    let jsonData = JSON.parse(JSON.stringify(json))
    path = path.split('.')
    let tempValue = jsonData
    for (let i = 0; i < path.length; i++) {
        tempValue = tempValue[path[i]]
    }
    return tempValue
}

const removeValue = (arr, value) => {
    const index = arr.indexOf(value);
    if (index > -1) { // only splice array when item is found
        arr.splice(index, 1); // 2nd parameter means remove one item only
    }
    return arr
}

const updateRequired = ({ selectedType, path, requiredChecked, field_key, old_field_key, convertedSchema }) => {

    /*if (selectedType === "object") {
        requiredChecked = false
    }*/

    let newPath = path.split('.')
    newPath.pop()
    newPath.pop()
    newPath = newPath.join('.')
    const immediateValue = getValue(convertedSchema, newPath)
    if (immediateValue !== undefined) {
        // check if there is required array
        if (immediateValue["required"] !== undefined) {
            let requiredArray = immediateValue["required"]
            if (requiredChecked) {
                // remove old value
                requiredArray = removeValue(requiredArray, old_field_key)
                // add new value
                requiredArray.push(field_key)
                set(convertedSchema, newPath + ".required", requiredArray)
            } else {
                // check if the field id exists
                if (requiredArray.includes(field_key)) {
                    requiredArray = requiredArray.filter(item => item !== field_key)
                    set(convertedSchema, newPath + ".required", requiredArray)

                    if (requiredArray.length === 0) {
                        delete immediateValue["required"]
                        set(convertedSchema, newPath, immediateValue)
                    }
                }
            }
        } else {
            if (requiredChecked) {
                let requiredArray = [`${field_key}`]
                set(convertedSchema, newPath + ".required", requiredArray)
            }
        }
    } else {
        // check if there is required array
        if (convertedSchema["required"] !== undefined) {
            let requiredArray = convertedSchema["required"]
            if (requiredChecked) {
                // remove old value
                requiredArray = removeValue(requiredArray, old_field_key)
                // add new value
                requiredArray.push(field_key)
                // finally push it into the schema
                convertedSchema["required"] = requiredArray
            } else {
                //alert("4")
                // check if the field id exists
                if (requiredArray.includes(field_key)) {
                    requiredArray = requiredArray.filter(item => item !== field_key)
                    convertedSchema["required"] = requiredArray
                    if (requiredArray.length === 0) {
                        delete convertedSchema["required"]
                    }
                }
            }
        } else {
            if (requiredChecked) {
                let requiredArray = [`${field_key}`]
                convertedSchema["required"] = requiredArray
            }
        }

    }

    return convertedSchema;
}

export default updateRequired;