// convert iterable array to json schema properties
import renameKey from "./renameKey";

// fields that hold UI/runtime state and are not valid schema keywords
const REMOVED_KEYS = ["value", "prevValue", "adamant_field_error", "adamant_error_description"];

const array2object = (propert) => {
    var someObject = {};
    propert.forEach((item) => {
        const tempKey = item["fieldKey"];
        delete item["fieldKey"];
        const tempElements = item;
        someObject[tempKey] = tempElements;
        Object.keys(tempElements).forEach((item) => {
            if (item === "enumerate") {
                renameKey(someObject[tempKey], "enumerate", "enum");
            }
            if (item === "defaultValue") {
                renameKey(someObject[tempKey], "defaultValue", "default");
            }
            if (item === "properties") {
                // some recursion
                someObject[tempKey]["properties"] = array2object(
                    someObject[tempKey]["properties"]
                );
            }
            if (REMOVED_KEYS.includes(item)) {
                delete someObject[tempKey][item];
            }
        });
    });
    return someObject;
};

export default array2object;
