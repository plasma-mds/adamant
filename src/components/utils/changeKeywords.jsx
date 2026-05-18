const changeKeywords = (convertedSchema, oldKey, desiredNewKey) => {
    if (typeof convertedSchema === 'object' && !Array.isArray(convertedSchema) && convertedSchema !== null) {
        Object.keys(convertedSchema).forEach(keyword => {
            if (keyword === oldKey) {
                let tempValue = convertedSchema[keyword]
                delete convertedSchema[keyword]
                convertedSchema[desiredNewKey] = tempValue
            } else {
                // to maintain the order
                let tempValue = convertedSchema[keyword]
                delete convertedSchema[keyword]
                convertedSchema[keyword] = tempValue
                //
            }
            if (typeof convertedSchema[keyword] === 'object' && !Array.isArray(convertedSchema[keyword]) && convertedSchema[keyword] !== null) {
                changeKeywords(convertedSchema[keyword], oldKey, desiredNewKey)
            }
            else if (Array.isArray(convertedSchema[keyword]) && convertedSchema[keyword] !== null) {
                convertedSchema[keyword].forEach(item => {
                    changeKeywords(item, oldKey, desiredNewKey)
                })
            }
        })
    }
    else if (Array.isArray(convertedSchema) && convertedSchema !== null) {
        convertedSchema.forEach(item => {
            changeKeywords(item, oldKey, desiredNewKey)
        })
    }
}

export default changeKeywords