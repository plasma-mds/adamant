// convert json schema properties to an iterable array
const object2array = (propert) => {
    let someArray = [];
    Object.keys(propert).forEach((item) => {
        var tempVariable = {};
        var tempVariable2;
        tempVariable2 = propert[item];
        tempVariable["fieldKey"] = item;
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
                tempVariable[item_] = object2array(tempVariable2[item_]);
            }
        });
        someArray.push(tempVariable);
    });

    return someArray;
};

export default object2array;