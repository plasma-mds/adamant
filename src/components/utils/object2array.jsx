const resolveRef = (ref, rootSchema) => {
    if (!ref || typeof ref !== "string" || !ref.startsWith("#/")) {
        return null;
    }
    const parts = ref.substring(2).split("/");
    let current = rootSchema;
    for (const part of parts) {
        if (current === undefined || current === null) return null;
        current = current[part];
    }
    return current;
};

// convert json schema properties to an iterable array
const object2array = (propert, rootSchema) => {
    if (rootSchema !== undefined) {
        window.activeSchema = rootSchema;
    }
    const activeSchema = rootSchema || window.activeSchema;

    let someArray = [];
    if (!propert) return someArray;

    Object.keys(propert).forEach((item) => {
        var tempVariable = {};
        var tempVariable2 = propert[item];

        // Resolve ref if it exists and we have activeSchema
        if (tempVariable2 && tempVariable2["$ref"] !== undefined && activeSchema !== undefined) {
            const resolved = resolveRef(tempVariable2["$ref"], activeSchema);
            if (resolved) {
                // Sibling properties override resolved target properties (important for Draft 2020-12 sibling refs)
                tempVariable2 = { ...resolved, ...tempVariable2 };
            }
        }

        tempVariable["fieldKey"] = item;
        if (tempVariable2) {
            Object.keys(tempVariable2).forEach((item_) => {
                // make enum indexable by changing the key to "enumerate"
                if (item_ === "enum") {
                    tempVariable["enumerate"] = tempVariable2[item_];
                }
                if (item_ === "default") {
                    tempVariable["defaultValue"] = tempVariable2[item_];
                }
                tempVariable[item_] = tempVariable2[item_];
                if (item_ === "properties") {
                    // recursive on action to access nested properties
                    tempVariable[item_] = object2array(tempVariable2[item_], activeSchema);
                }
            });
        }
        // Resolve $refs inside anyOf/oneOf/allOf sub-schemas into plain schema objects.
        ['anyOf', 'oneOf', 'allOf'].forEach(compositeKey => {
            if (Array.isArray(tempVariable[compositeKey])) {
                tempVariable[compositeKey] = tempVariable[compositeKey].map(subSchema => {
                    if (subSchema && subSchema['$ref'] && activeSchema) {
                        const resolved = resolveRef(subSchema['$ref'], activeSchema);
                        if (resolved) {
                            return { ...resolved, ...subSchema };
                        }
                    }
                    return subSchema;
                });
            }
        });

        someArray.push(tempVariable);
    });

    return someArray;
};

export default object2array;