const fillValueWithEmptyString = (jsonObjProp) => {

    jsonObjProp.forEach(element => {
        if (element["type"] === "object") {
            fillValueWithEmptyString(element["properties"])
        } else {
            if (element["value"] === undefined) {
                element["value"] = ""
            }
        }
    });


}

export default fillValueWithEmptyString;