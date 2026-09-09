// recursively search a plain (nested) form-data object for the first value under a key
// matching targetKey case-insensitively, wherever it appears
const findFieldValueByKey = (data, targetKey) => {
    if (data === null || typeof data !== "object") {
        return undefined;
    }
    if (Array.isArray(data)) {
        for (const item of data) {
            const found = findFieldValueByKey(item, targetKey);
            if (found !== undefined) {
                return found;
            }
        }
        return undefined;
    }
    for (const key of Object.keys(data)) {
        if (key.toLowerCase() === targetKey.toLowerCase()) {
            return data[key];
        }
    }
    for (const key of Object.keys(data)) {
        const found = findFieldValueByKey(data[key], targetKey);
        if (found !== undefined) {
            return found;
        }
    }
    return undefined;
};

export default findFieldValueByKey;
