import React from 'react';
import StringType from "./elements/StringType";
import NumberType from "./elements/NumberType";
import ObjectType from './elements/ObjectType';
import IntegerType from './elements/IntegerType';
import BooleanType from './elements/BooleanType';
import ArrayType from './elements/ArrayType';
import NullType from './elements/NullType';
import AnyOfKeyword from './elements/AnyOfKeyword';
import FileUpload from './elements/FileUpload';

// Resolves the anyOf/oneOf "nullable field" pattern to its non-null sub-schema, or null if it doesn't match.
const resolveNullable = (schemas) => {
    if (!Array.isArray(schemas) || schemas.length < 2) return null;
    const nonNull = schemas.filter(s => s && s.type !== 'null');
    const hasNull = schemas.some(s => s && s.type === 'null');
    if (!hasNull || nonNull.length !== 1) return null;
    const merged = { ...nonNull[0] };
    // object2array renames enum→enumerate at the property level only; anyOf sub-schemas need it here too.
    if (merged.enum !== undefined && merged.enumerate === undefined) {
        merged.enumerate = merged.enum;
    }
    return merged;
};

const ElementRenderer = ({ withinObject, dataInputItems, setDataInputItems, withinArray, path, pathSchema, pathFormData, elementRequired, fieldkey, fieldIndex, edit, field }) => {

    // Resolve nullable anyOf/oneOf before destructuring so the switch sees the real type.
    let resolvedField = field ?? {};
    const compositeSchemas = resolvedField.anyOf || resolvedField.oneOf;
    if (compositeSchemas && !resolvedField.type) {
        const nullableResolved = resolveNullable(compositeSchemas);
        if (nullableResolved) {
            resolvedField = { ...resolvedField, ...nullableResolved, anyOf: undefined, oneOf: undefined };
        }
    }

    const {
        minItems, maxItems, uniqueItems,
        minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf,
        minLength, maxLength, pattern, format,
        type, $id, id, title, contentEncoding, description,
        properties, required, enumerate, items, prefixItems,
        defaultValue, value, anyOf, oneOf,
        adamant_field_error, adamant_error_description
    } = resolvedField;

    // Shared props for the AnyOfKeyword component (used for non-nullable composite schemas)
    const anyOfProps = {
        adamant_field_error,
        adamant_error_description,
        pathFormData: pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey,
        withinArray,
        withinObject,
        path: path + "." + fieldIndex,
        field_index: fieldIndex,
        field_key: fieldkey,
        field_uri: $id !== undefined ? $id : id,
        field_label: title,
        field_description: description,
        field_required: elementRequired,
        edit,
    };

    switch (type) {
        case 'string':
            if (contentEncoding !== undefined) {
                return (<FileUpload
                    adamant_field_error={adamant_field_error}
                    adamant_error_description={adamant_error_description}
                    contentEncoding={contentEncoding}
                    value={value}
                    withinArray={withinArray}
                    withinObject={withinObject}
                    dataInputItems={dataInputItems}
                    setDataInputItems={setDataInputItems}
                    path={path + "." + fieldIndex}
                    pathSchema={pathSchema + "." + fieldkey}
                    pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                    field_key={fieldkey}
                    field_index={fieldIndex}
                    field_label={title}
                    field_uri={$id !== undefined ? $id : id}
                    field_description={description}
                    field_required={elementRequired}
                    defaultValue={defaultValue}
                    edit={edit}
                />)
            } else {
                return (<StringType
                    adamant_field_error={adamant_field_error}
                    adamant_error_description={adamant_error_description}
                    value={value}
                    withinArray={withinArray}
                    withinObject={withinObject}
                    dataInputItems={dataInputItems}
                    setDataInputItems={setDataInputItems}
                    path={path + "." + fieldIndex}
                    pathSchema={pathSchema + "." + fieldkey}
                    pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                    field_key={fieldkey}
                    field_index={fieldIndex}
                    field_label={title}
                    field_uri={$id !== undefined ? $id : id}
                    field_description={description}
                    field_required={elementRequired}
                    field_enumerate={enumerate}
                    defaultValue={defaultValue}
                    edit={edit}
                    minLength={minLength}
                    maxLength={maxLength}
                    pattern={pattern}
                    format={format}
                />)
            }
        case 'number':
            return (<NumberType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                minimum={minimum}
                maximum={maximum}
                exclusiveMinimum={exclusiveMinimum}
                exclusiveMaximum={exclusiveMaximum}
                multipleOf={multipleOf}
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id !== undefined ? $id : id}
                field_index={fieldIndex}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                field_enumerate={enumerate}
                defaultValue={defaultValue}
                edit={edit}
            />)
        case 'integer':
            return (<IntegerType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                minimum={minimum}
                maximum={maximum}
                exclusiveMinimum={exclusiveMinimum}
                exclusiveMaximum={exclusiveMaximum}
                multipleOf={multipleOf}
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id !== undefined ? $id : id}
                field_index={fieldIndex}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                field_enumerate={enumerate}
                defaultValue={defaultValue}
                edit={edit}
            />)
        case 'boolean':
            return (<BooleanType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id !== undefined ? $id : id}
                field_index={fieldIndex}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                defaultValue={defaultValue}
                edit={edit}
            />)
        case 'array':
            return (<ArrayType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                value={value}
                maxItems={maxItems}
                minItems={minItems}
                uniqueItems={uniqueItems}
                oDataInputItems={dataInputItems}
                oSetDataInputItems={setDataInputItems}
                withinArray={withinArray}
                withinObject={withinObject}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_index={fieldIndex}
                field_uri={$id !== undefined ? $id : id}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                field_items={items}
                field_prefixItems={prefixItems}
                edit={edit}
            />)
        case 'object':
            if (anyOf || oneOf) {
                return <AnyOfKeyword {...anyOfProps} anyOf_list={anyOf || oneOf} />;
            }
            return (<ObjectType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                withinArray={withinArray}
                withinObject={withinObject}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id !== undefined ? $id : id}
                field_label={title}
                field_description={description}
                field_required={required}
                object_is_required={elementRequired}
                field_properties={properties}
                edit={edit}
            />)
        case 'null':
            return (<NullType
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id !== undefined ? $id : id}
                field_index={fieldIndex}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                edit={edit}
            />)
        case undefined:
            if (anyOf || oneOf) {
                return <AnyOfKeyword {...anyOfProps} anyOf_list={anyOf || oneOf} />;
            }
            return null;
        default:
            return null;
    }
}

export default ElementRenderer;
