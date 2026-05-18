
const getTableCandidates = (convProp, container) => {

    convProp.forEach(element => {
        if (element["type"] === "object") {
            getTableCandidates(element["properties"], container)
        } else if (element["type"] === "array") {
            if (typeof (element["value"][0]) === "object") {
                container.push({
                    "fieldKey": element["fieldKey"],
                    "title": element["title"],
                    "schemaProperties": element["items"]["properties"],
                    "$id": element["$id"],
                    "id": element["id"],
                    "value": element["value"]
                })
            }
        }
    });

    return container;
}

export default getTableCandidates;