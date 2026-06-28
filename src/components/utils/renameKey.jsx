// rename a key on an object in place, keeping its value
const renameKey = (obj, oldKey, newKey) => {
    obj[newKey] = obj[oldKey];
    delete obj[oldKey];
};

export default renameKey;
