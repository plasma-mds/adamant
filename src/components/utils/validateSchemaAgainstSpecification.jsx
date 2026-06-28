import Ajv from "ajv";
import Ajv04 from "ajv-draft-04";
import deleteKeySchema from "./deleteKeySchema";
import { DIALECTS } from "./validateAgainstSchema";

const DRAFT_04_FAMILY = [
    "http://json-schema.org/draft-05/schema#",
    "http://json-schema.org/draft-06/schema#",
];

const compileSchema = (ajv, localSchema, spec, validMessage = "schema is valid") => {
    try {
        ajv.compile(localSchema);
        return [true, validMessage];
    } catch (error) {
        let errorMessage = error.toString();
        errorMessage = errorMessage.replace("Error: strict mode: unknown keyword", `This specification (${spec}) does not support keyword`);
        return [false, errorMessage];
    }
};

const validateSchemaAgainstSpecification = (schema, spec) => {
    let localSchema = JSON.parse(JSON.stringify(schema));
    const schemaVersion = localSchema["$schema"];

    if (schemaVersion === undefined) {
        if (localSchema["id"] !== undefined) {
            localSchema = deleteKeySchema(localSchema, "id");
        }
        return compileSchema(new Ajv({ allErrors: true }), localSchema, spec, "schema does not have schema specification");
    }

    if (DRAFT_04_FAMILY.includes(schemaVersion)) {
        localSchema["$schema"] = "http://json-schema.org/draft-04/schema#";
    }

    const dialect = DIALECTS.find(d => localSchema["$schema"].includes(d.match));

    if (dialect) {
        localSchema["$schema"] = dialect.schemaUri;
        if (dialect.AjvClass === Ajv04 && localSchema["$id"] !== undefined) {
            localSchema["id"] = localSchema["$id"];
            delete localSchema["$id"];
        }
    }

    const AjvClass = dialect ? dialect.AjvClass : Ajv;
    const ajv = new AjvClass({ allErrors: true, ...(dialect && dialect.options) });
    return compileSchema(ajv, localSchema, spec);
};

export default validateSchemaAgainstSpecification;
