import React from 'react';
import ItemIntegerType from './array_items/ItemIntegerType';
import ItemNumberType from './array_items/ItemNumberType';
import ItemStringType from "./array_items/ItemStringType";
import ItemObjectType from "./array_items/ItemObjectType";


const ArrayItemRenderer = ({ oSetDataInputItems, oDataInputItems, arrayFieldKey, withinObject, value, pathSchema, pathFormData, dataInputItems, setDataInputItems, field_label, field_items, path, type, edit, fieldIndex, fieldkey, enumerate, handleDeleteArrayItem, properties, isResource }) => {
    switch (type) {
        case 'string':
            return (<ItemStringType
                field_label={field_label}
                value={value}
                withinObject={withinObject}
                arrayFieldKey={arrayFieldKey}
                oSetDataInputItems={oSetDataInputItems}
                oDataInputItems={oDataInputItems}
                setDataInputItems={setDataInputItems}
                pathFormData={pathFormData}
                pathSchema={pathSchema + ".value"}
                dataInputItems={dataInputItems}
                path={path}
                index={fieldIndex}
                field_key={fieldkey}
                handleDeleteArrayItem={handleDeleteArrayItem}
                edit={edit}
                field_type={type}
            />)
        case 'number':
            return (<ItemNumberType
                field_label={field_label}
                value={value}
                path={path}
                pathFormData={pathFormData}
                pathSchema={pathSchema + ".value"}
                withinObject={withinObject}
                arrayFieldKey={arrayFieldKey}
                oSetDataInputItems={oSetDataInputItems}
                oDataInputItems={oDataInputItems}
                setDataInputItems={setDataInputItems}
                dataInputItems={dataInputItems}
                index={fieldIndex}
                field_key={fieldkey}
                handleDeleteArrayItem={handleDeleteArrayItem}
                edit={edit}
                field_type={type}
            />)
        case 'integer':
            return (<ItemIntegerType
                field_label={field_label}
                value={value}
                path={path}
                pathFormData={pathFormData}
                withinObject={withinObject}
                arrayFieldKey={arrayFieldKey}
                oSetDataInputItems={oSetDataInputItems}
                oDataInputItems={oDataInputItems}
                pathSchema={pathSchema + ".value"}
                setDataInputItems={setDataInputItems}
                dataInputItems={dataInputItems}
                index={fieldIndex}
                field_key={fieldkey}
                handleDeleteArrayItem={handleDeleteArrayItem}
                edit={edit}
                field_type={type}
            />)
        case 'object':
            return (<ItemObjectType
                field_label={field_label}
                value={value}
                setDataInputItems={setDataInputItems}
                dataInputItems={dataInputItems}
                pathFormData={pathFormData}
                pathSchema={pathSchema + ".value"}
                path={path}
                index={fieldIndex}
                field_key={fieldkey}
                handleDeleteArrayItem={handleDeleteArrayItem}
                edit={edit}
                field_type={type}
                field_items={field_items}
                isResource = {isResource}
            />)

        default:
            return null;
    }


}

export default ArrayItemRenderer;
