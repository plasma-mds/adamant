// convert iterable array to json schema properties
const array2objectAnyOf = (propert) => {
    var someObject = {};
    propert.forEach((item) => {
        const tempKey = item["fieldKey"];
        delete item["fieldKey"];
        const tempElements = item;
        someObject[tempKey] = tempElements;
        Object.keys(tempElements).forEach((item) => {
            // change "enumerate" to "enum"
            if (item === "enumerate") {
                const enumContent = JSON.parse(
                    JSON.stringify(someObject[tempKey]["enumerate"])
                );
                delete someObject[tempKey]["enumerate"];
                someObject[tempKey]["enum"] = enumContent;
            }
            if (item === "defaultValue") {
                const enumContent = JSON.parse(
                    JSON.stringify(someObject[tempKey]["defaultValue"])
                );
                delete someObject[tempKey]["defaultValue"];
                someObject[tempKey]["default"] = enumContent;
            }
            if (item === "properties") {
                if (someObject[tempKey]["anyOf"] !== undefined) {
                    delete someObject[tempKey]["properties"]
                    delete someObject[tempKey]["type"]
                } else {
                    // some recursion
                    someObject[tempKey]["properties"] = array2objectAnyOf(
                        someObject[tempKey]["properties"]
                    );
                }
            }
            if (item === "value") {
                delete someObject[tempKey]["value"]
            }
            if (item === "prevValue") {
                delete someObject[tempKey][item]
            }
        });
    });
    return someObject;
};

export default array2objectAnyOf;