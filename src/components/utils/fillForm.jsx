const fillForm = (schemaProp, data) => {
    schemaProp.forEach(element => {
        if (element["type"] === "object") {
            // early exist
            if (data === undefined) {
                return
            } //
            fillForm(element["properties"], data[element["fieldKey"]])
        } else {
            // early exist
            if (data === undefined) {
                return
            } //
            if (data[element["fieldKey"]] !== undefined) {
                const type = element["type"]

                element["value"] = data[element["fieldKey"]]

                // validate input data before filling
                switch (type) {
                    case 'number':
                        if (typeof (data[element["fieldKey"]]) === "number") {
                            return element["prevValue"] = data[element["fieldKey"]]
                        } else {
                            return null
                        };
                    case 'integer':
                        if (Number.isInteger(data[element["fieldKey"]])) {
                            return element["prevValue"] = data[element["fieldKey"]]
                        } else {
                            return null
                        };
                    case 'boolean':
                        if (typeof (data[element["fieldKey"]]) === "boolean") {
                            return element["prevValue"] = data[element["fieldKey"]]
                        } else {
                            return null
                        };
                    case 'array':
                        if (Array.isArray(data[element["fieldKey"]])) {
                            return element["prevValue"] = data[element["fieldKey"]]
                        } else {
                            return null
                        };
                    case 'string':
                        return (element["prevValue"] = JSON.parse(JSON.stringify(data[element["fieldKey"]])).toString());
                    default:
                        return null;
                }
            }
        }
    })
}

export default fillForm;