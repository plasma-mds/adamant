import Ajv from "ajv";
import Ajv04 from "ajv-draft-04";
import deleteKeySchema from "./deleteKeySchema";

const validateSchemaAgainstSpecification = (schema, spec) => {
    if (schema["$schema"] !== undefined) {
        if (["http://json-schema.org/draft-04/schema#", "http://json-schema.org/draft-05/schema#", "http://json-schema.org/draft-06/schema#"].includes(schema["$schema"])) {
            console.log(`${spec.replace("http://json-schema.org/", "").replace("/schema#", "")} is detected`)
            console.log("Using Ajv for draft 04")
            schema["$schema"] = "http://json-schema.org/draft-04/schema#"
            if (schema["$id"] !== undefined) {
                schema["id"] = schema["$id"]
                delete schema["$id"]
            }
            const ajv = new Ajv04({ schemaId: "id", allErrors: true });
            try {
                ajv.compile(schema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                //console.log(error)
                return [false, errorMessage]
            }
        }
        else {
            console.log("draft-07 or above is detected")
            console.log("Using latest Ajv")
            const ajv = new Ajv({ allErrors: true });
            /*schema = deleteKeySchema(schema, "$schema")
            if (schema["id"] !== undefined) {
                schema = deleteKeySchema(schema, "id")
            }*/
            try {
                ajv.compile(schema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                //console.log(error)
                return [false, errorMessage]
            }
        }
    }
    else {
        console.log("'$schema' is not found. Latest spec is used.")
        const ajv = new Ajv({ allErrors: true });
        if (schema["$schema"] !== undefined) {
            schema = deleteKeySchema(schema, "$schema")
        }
        if (schema["id"] !== undefined) {
            schema = deleteKeySchema(schema, "id")
        }
        ajv.compile(schema);
        return [true, "schema does not have schema specification"]
    }
}

export default validateSchemaAgainstSpecification;