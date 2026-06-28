// convert iterable array to json schema properties
import renameKey from "./renameKey";

// fields that hold UI/runtime state and are not valid schema keywords
const REMOVED_KEYS = ["value", "prevValue"];

const array2objectAnyOf = (propert) => {
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
            if (REMOVED_KEYS.includes(item)) {
                delete someObject[tempKey][item];
            }
        });
    });
    return someObject;
};

export default array2objectAnyOf;
