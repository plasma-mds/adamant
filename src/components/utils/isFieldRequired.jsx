// check if a field key is listed in a schema's "required" array
const isFieldRequired = (field_required, field_key) =>
    Array.isArray(field_required) && field_required.includes(field_key);

export default isFieldRequired;
