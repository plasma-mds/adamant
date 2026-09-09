// validate form data against its schema using the Ajv package

//
// TO DO: since AJV does not really check the nested schemas easily, we must then implement a recursion to check every object type that has subschemas
//      : for both formData and schema

import Ajv from "ajv";
import Ajv04 from "ajv-draft-04";
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import deleteKeySchema from "./deleteKeySchema";
import getValueInSchemaFullPath from "./getValueInSchemaFullPath";

const makeAjv = (AjvClass, options) => {
    const ajv = new AjvClass({ allErrors: true, ...options });
    addFormats(ajv);
    return ajv;
};

// Dialects in priority order: the first whose `match` substring is found in
// $schema is used both to normalize $schema and to pick the Ajv class.
export const DIALECTS = [
    { match: "2020-12", schemaUri: "https://json-schema.org/draft/2020-12/schema", AjvClass: Ajv2020 },
    { match: "2019-09", schemaUri: "https://json-schema.org/draft/2019-09/schema", AjvClass: Ajv2019 },
    { match: "draft-07", schemaUri: "http://json-schema.org/draft-07/schema#", AjvClass: Ajv },
    { match: "draft-04", schemaUri: "http://json-schema.org/draft-04/schema#", AjvClass: Ajv04, options: { schemaId: "id" } },
];

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

        let field = getValueInSchemaFullPath(schema, path)
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

        const schemaVersion = localSchema["$schema"];
        const dialect = schemaVersion && DIALECTS.find(d => schemaVersion.includes(d.match));

        let ajv;
        if (dialect) {
            localSchema["$schema"] = dialect.schemaUri;
            ajv = makeAjv(dialect.AjvClass, dialect.options);
        } else if (schemaVersion !== undefined || localSchema["schema"] !== undefined) {
            ajv = makeAjv(Ajv);
        } else {
            if (localSchema["id"] !== undefined) {
                localSchema = deleteKeySchema(localSchema, "id")
            }
            ajv = makeAjv(Ajv);
        }

        const validate = ajv.compile(localSchema);
        const valid = validate(formData)
        const messages = createBetterValidationMessages(validate, schema)
        return [valid, messages];
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
                    message: `Schema compilation failed: ${errorMessage}. This usually means the schema uses keywords unsupported by the selected specification version (dialect).`
                }
            ]
        ];
    }
}

export default validateAgainstSchema;