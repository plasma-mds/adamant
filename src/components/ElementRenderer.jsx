import React from 'react';
import StringType from "./elements/StringType";
import NumberType from "./elements/NumberType";
import ObjectType from './elements/ObjectType';
import IntegerType from './elements/IntegerType';
import BooleanType from './elements/BooleanType';
import ArrayType from './elements/ArrayType';
import AnyOfKeywordPlaceHolder from './elements/AnyOfKeywordPlaceHolder';
import FileUpload from './elements/FileUpload';


const ElementRenderer = ({withinObject, dataInputItems, setDataInputItems, withinArray, path, pathSchema, pathFormData, elementRequired, fieldkey, fieldIndex, edit, field: { minItems, maxItems, uniqueItems, minimum, maximum, minLength, maxLength, type, $id, id, title, contentEncoding, description, properties, required, enumerate, items, defaultValue, value, anyOf, adamant_field_error, adamant_error_description } }) => {

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
                />)
            }
        case 'number':
            return (<NumberType
                adamant_field_error={adamant_field_error}
                adamant_error_description={adamant_error_description}
                minimum={minimum}
                maximum={maximum}
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
            if (fieldkey === "resource") {
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
                    edit={edit}
                />)
            }
            else {
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
                    edit={edit}
                />)
            }
        case 'object':
            if (anyOf !== undefined) {
                return (
                    <AnyOfKeywordPlaceHolder
                        adamant_field_error={adamant_field_error}
                        adamant_error_description={adamant_error_description}
                        pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                        withinArray={withinArray}
                        withinObject={withinObject}
                        dataInputItems={dataInputItems}
                        setDataInputItems={setDataInputItems}
                        path={path + "." + fieldIndex}
                        field_index={fieldIndex}
                        field_key={fieldkey}
                        field_uri={$id !== undefined ? $id : id}
                        field_label={title}
                        field_description={description}
                        field_required={elementRequired}
                        anyOf_list={anyOf}
                        edit={edit}
                    />
                )
            } else {
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
            }
        case undefined:
            if (anyOf) {
                return (
                    <AnyOfKeywordPlaceHolder
                        adamant_field_error={adamant_field_error}
                        adamant_error_description={adamant_error_description}
                        pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                        withinArray={withinArray}
                        withinObject={withinObject}
                        path={path + "." + fieldIndex}
                        field_index={fieldIndex}
                        field_key={fieldkey}
                        field_uri={$id !== undefined ? $id : id}
                        field_label={title}
                        field_description={description}
                        field_required={elementRequired}
                        anyOf_list={anyOf}
                        edit={edit}
                    />
                )
            } else {
                return null
            }

        default:
            return null;
    }


}

export default ElementRenderer;
