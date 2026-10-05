// first scalar value of a schema field whose key or title matches name (case-insensitive),
// searching nested properties too. Works on the converted schema's property array, where each
// entry carries its fieldKey, title, value, and (for objects) nested properties.
const findFieldValueByNameOrTitle = (properties, name) => {
    if (!Array.isArray(properties)) {
        return undefined;
    }
    const target = name.toLowerCase();
    for (const prop of properties) {
        const isMatch = [prop.fieldKey, prop.title].some(
            (candidate) => typeof candidate === "string" && candidate.toLowerCase() === target
        );
        if (isMatch && prop.value !== undefined && typeof prop.value !== "object") {
            return prop.value;
        }
        const nested = findFieldValueByNameOrTitle(prop.properties, name);
        if (nested !== undefined) {
            return nested;
        }
    }
    return undefined;
};

export default findFieldValueByNameOrTitle;
