import React from 'react';
import StringType from "./elements/StringType";
import NumberType from "./elements/NumberType";
import ObjectType from './elements/ObjectType';
import IntegerType from './elements/IntegerType';
import BooleanType from './elements/BooleanType';
import ArrayType from './elements/ArrayType';
import AnyOfKeyword from './elements/AnyOfKeyword';


const ElementRenderer = ({ withinObject, dataInputItems, setDataInputItems, withinArray, path, pathSchema, pathFormData, elementRequired, fieldkey, fieldIndex, edit, field: { type, $id, title, description, properties, required, enumerate, items, defaultValue, value, anyOf } }) => {

    switch (type) {
        case 'string':
            return (<StringType
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
                field_uri={$id}
                field_description={description}
                field_required={elementRequired}
                field_enumerate={enumerate}
                defaultValue={defaultValue}
                edit={edit}
            />)
        case 'number':
            return (<NumberType
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id}
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
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id}
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
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                dataInputItems={dataInputItems}
                setDataInputItems={setDataInputItems}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id}
                field_index={fieldIndex}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                defaultValue={defaultValue}
                edit={edit}
            />)
        case 'array':
            return (<ArrayType
                value={value}
                withinArray={withinArray}
                withinObject={withinObject}
                path={path + "." + fieldIndex}
                pathSchema={pathSchema + "." + fieldkey}
                pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                field_key={fieldkey}
                field_uri={$id}
                field_label={title}
                field_description={description}
                field_required={elementRequired}
                field_items={items}
                edit={edit}
            />)
        case 'object':
            if (anyOf !== undefined) {
                return (
                    <AnyOfKeyword
                        pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                        withinArray={withinArray}
                        withinObject={withinObject}
                        dataInputItems={dataInputItems}
                        setDataInputItems={setDataInputItems}
                        path={path + "." + fieldIndex}
                        field_index={fieldIndex}
                        field_key={fieldkey}
                        field_uri={$id}
                        field_label={title}
                        field_description={description}
                        field_required={elementRequired}
                        anyOf_list={anyOf}
                        edit={edit}
                    />
                )
            } else {
                return (<ObjectType
                    withinArray={withinArray}
                    withinObject={withinObject}
                    path={path + "." + fieldIndex}
                    pathSchema={pathSchema + "." + fieldkey}
                    pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                    field_key={fieldkey}
                    field_uri={$id}
                    field_label={title}
                    field_description={description}
                    field_required={required}
                    field_properties={properties}
                    edit={edit}
                />)
            }
        case undefined:
            if (anyOf) {
                return (
                    <AnyOfKeyword
                        pathFormData={pathFormData !== undefined ? pathFormData + "." + fieldkey : fieldkey}
                        withinArray={withinArray}
                        withinObject={withinObject}
                        path={path + "." + fieldIndex}
                        field_index={fieldIndex}
                        field_key={fieldkey}
                        field_uri={$id}
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
