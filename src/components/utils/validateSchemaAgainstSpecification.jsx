import Ajv from "ajv";
import Ajv04 from "ajv-draft-04";
import Ajv2019 from "ajv/dist/2019";
import Ajv2020 from "ajv/dist/2020";
import deleteKeySchema from "./deleteKeySchema";

const validateSchemaAgainstSpecification = (schema, spec) => {
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
            console.log("draft 2020-12 is detected")
            console.log("Using Ajv2020")
            const ajv = new Ajv2020({ allErrors: true, strict: false });
            try {
                ajv.compile(localSchema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                return [false, errorMessage]
            }
        }
        else if (localSchema["$schema"].includes("2019-09")) {
            console.log("draft 2019-09 is detected")
            console.log("Using Ajv2019")
            const ajv = new Ajv2019({ allErrors: true, strict: false });
            try {
                ajv.compile(localSchema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                return [false, errorMessage]
            }
        }
        else if (["http://json-schema.org/draft-04/schema#", "http://json-schema.org/draft-05/schema#", "http://json-schema.org/draft-06/schema#"].includes(localSchema["$schema"])) {
            console.log(`${spec.replace("http://json-schema.org/", "").replace("/schema#", "")} is detected`)
            console.log("Using Ajv for draft 04")
            localSchema["$schema"] = "http://json-schema.org/draft-04/schema#"
            if (localSchema["$id"] !== undefined) {
                localSchema["id"] = localSchema["$id"]
                delete localSchema["$id"]
            }
            const ajv = new Ajv04({ schemaId: "id", allErrors: true });
            try {
                ajv.compile(localSchema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                return [false, errorMessage]
            }
        }
        else {
            console.log("draft-07 or above is detected")
            console.log("Using latest Ajv")
            const ajv = new Ajv({ allErrors: true });
            try {
                ajv.compile(localSchema);
                return [true, "schema is valid"]
            }
            catch (error) {
                let errorMessage = error.toString()
                errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`)
                return [false, errorMessage]
            }
        }
    }
    else {
        console.log("'$schema' is not found. Latest spec is used.")
        const ajv = new Ajv({ allErrors: true });
        if (localSchema["$schema"] !== undefined) {
            localSchema = deleteKeySchema(localSchema, "$schema")
        }
        if (localSchema["id"] !== undefined) {
            localSchema = deleteKeySchema(localSchema, "id")
        }
        ajv.compile(localSchema);
        return [true, "schema does not have schema specification"]
    }
}

export default validateSchemaAgainstSpecification;