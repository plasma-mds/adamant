// validate form data against its schema using the Ajv package

//
// TO DO: since AJV does not really check the nested schemas easily, we must then implement a recursion to check every object type that has subschemas
//      : for both formData and schema

import Ajv from "ajv";
import Ajv04 from "ajv-draft-04";
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";
import deleteKeySchema from "./deleteKeySchema";
import getValueInSchemaFullPath from "./getValueInSchemaFullPath";

const messageLookUpTable = (field_label, field_type, keyword, message) => {
    switch (keyword) {
        case 'required':
            return `${field_type === "object" ? `One or more fields in '${field_label}' container must be filled.` : `'${field_label}' field must be filled (required)`}`
        default:
            if (keyword === "uniqueItems") {
                message = message.split("")
                let newMessage = []
                message.forEach(s => {
                    if (!Number.isNaN(parseInt(s))) {
                        newMessage.push(parseInt(s) + 1)
                    } else {
                        newMessage.push(s)
                    }
                })
                newMessage = newMessage.join("")
                return (`Input for '${field_label}' field ` + newMessage.replace("##", "no."))
            } else {
                return (`Input for '${field_label}' field ` + message)
            }
    }
}

const createBetterValidationMessages = (validate, schema) => {
    let errors = validate.errors
    if (errors === null) {
        return []
    }
    let messages = []

    errors.forEach(error => {
        // get real path
        let path = error.schemaPath
        path = path.substring(2)
        path = path.split("/")
        path.pop()
        if (error.keyword === "required") {
            path.push("properties")
            path.push(error.params.missingProperty)
        }
        path = path.join(".")
        console.log(path)

        let field = getValueInSchemaFullPath(schema, path)
        console.log(field)
        if (!field) {
            messages.push({ "path": path, "field_label": "Schema", "message": error.message })
            return
        }
        let field_label = field["title"]
        let field_type = field["type"]

        let errorMessage = messageLookUpTable(field_label, field_type, error.keyword, error.message)
        messages.push(
            { "path": path, "field_label": field_label, "message": errorMessage }
        )

    })

    return messages
}

const validateAgainstSchema = (formData, schema) => {
    try {
        let localSchema = JSON.parse(JSON.stringify(schema));
        if (localSchema["$schema"] !== undefined) {
            if (localSchema["$schema"].includes("2020-12")) {
                localSchema["$schema"] = "https://json-schema.org/draft/2020-12/schema";
            } else if (localSchema["$schema"].includes("2019-09")) {
                localSchema["$schema"] = "https://json-schema.org/draft/2019-09/schema";
            } else if (localSchema["$schema"].includes("draft-07")) {
                localSchema["$schema"] = "http://json-schema.org/draft-07/schema#";
            } else if (localSchema["$schema"].includes("draft-04")) {
                localSchema["$schema"] = "http://json-schema.org/draft-04/schema#";
            }
        }

        if (localSchema["$schema"] !== undefined) {
            if (localSchema["$schema"].includes("2020-12")) {
                console.log("draft-2020-12 is detected")
                const ajv = new Ajv2020({ allErrors: true, strict: false });

                const validate = ajv.compile(localSchema);
                const valid = validate(formData)

                let messages = createBetterValidationMessages(validate, schema)
                return [valid, messages];
            } else if (localSchema["$schema"].includes("2019-09")) {
                console.log("draft-2019-09 is detected")
                const ajv = new Ajv2019({ allErrors: true, strict: false });

                const validate = ajv.compile(localSchema);
                const valid = validate(formData)

                let messages = createBetterValidationMessages(validate, schema)
                return [valid, messages];
            } else if (localSchema["$schema"].includes("draft-04")) {
                console.log("draft-04 is detected")
                const ajv = new Ajv04({ schemaId: "id", allErrors: true });

                const validate = ajv.compile(localSchema);
                const valid = validate(formData)

                let messages = createBetterValidationMessages(validate, schema)
                return [valid, messages];
            } else {
                const ajv = new Ajv({ allErrors: true, strict: false });

                const validate = ajv.compile(localSchema);
                const valid = validate(formData)

                let messages = createBetterValidationMessages(validate, schema)
                return [valid, messages];
            }
        } else if (localSchema["schema"] !== undefined) {
            const ajv = new Ajv({ allErrors: true });
            const validate = ajv.compile(localSchema);
            const valid = validate(formData)

            let messages = createBetterValidationMessages(validate, schema)
            return [valid, messages];
        } else {
            const ajv = new Ajv({ allErrors: true });
            if (localSchema["$schema"] !== undefined) {
                localSchema = deleteKeySchema(localSchema, "$schema")
            }
            if (localSchema["id"] !== undefined) {
                localSchema = deleteKeySchema(localSchema, "id")
            }


            const validate = ajv.compile(localSchema);
            const valid = validate(formData)

            let messages = createBetterValidationMessages(validate, schema)
            return [valid, messages];
        }
    } catch (error) {
        console.error("Schema compilation error:", error);
        let errorMessage = error.toString();
        errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", "This specification version does not support keyword");
        return [
            false,
            [
                {
                    path: "schema",
                    field_label: "Schema Specification",
                    message: `Schema compilation failed: ${errorMessage}. This usually happens when the selected schema specification version (dialect) does not support keywords present in the schema (e.g. 'prefixItems' in draft-07, or 'dependentRequired' in draft-07).`
                }
            ]
        ];
    }
}

export default validateAgainstSchema;