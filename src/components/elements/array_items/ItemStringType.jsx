import React, { useContext, useState } from 'react'
import TextField from "@material-ui/core/TextField"
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from "@material-ui/icons/Delete";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import { IconButton } from '@material-ui/core';
import { Tooltip } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { FormContext } from '../../../FormContext';


const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const ItemStringType = ({ oDataInputItems, oSetDataInputItems, arrayFieldKey, withinObject, value, pathFormData, dataInputItems, setDataInputItems, path, edit, index, field_key, handleDeleteArrayItem, field_items, isTupleItem }) => {
    const classes = useStyles();
    const { handleConvertedDataInput } = useContext(FormContext)
    //const [fieldValue, setFieldValue] = useState(value === undefined ? undefined : value[index])
    const [fieldValue, setFieldValue] = useState(dataInputItems[index])


    // handle input field on blur
    const handleOnBlur = (event, index) => {
        if (withinObject !== undefined & withinObject === true) {
            let arr = dataInputItems;
            let arr2 = oDataInputItems
            let items = Array.from(arr);
            let items2 = Array.from(arr2);

            let prevIndex = parseInt(path.split(".").pop())
            items[index] = event.target.value;
            items2[prevIndex][arrayFieldKey] = items
            console.log(items2)
            oSetDataInputItems(items2);

            setFieldValue(event.target.value)

            let newPath = path.split(".")
            newPath.pop()
            newPath = newPath.join(".")

            // conv. schema data
            handleConvertedDataInput(items2, newPath + ".value", "array")

        } else {
            let arr = dataInputItems;
            const items = Array.from(arr);
            items[index] = event.target.value;
            setDataInputItems(items);
            setFieldValue(event.target.value)

            // conv. schema data
            handleConvertedDataInput(items, path + ".value", "array")
        }

    }


    return (
        <>
            {index !== undefined ? <div style={{ padding: "5px" }}>
                <Typography className={classes.heading}>{index + 1}.</Typography>
            </div> : null}
            <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                <TextField size='small' onBlur={(event) => handleOnBlur(event, index)} id={field_key} fullWidth={true} className={classes.heading} variant="outlined" defaultValue={fieldValue} label={field_items && field_items.title ? field_items.title : undefined} />
                {edit ? (isTupleItem ?
                    <Tooltip placement="top" title="Tuple positions are fixed by the schema. To modify this position's type or label, use the pen icon in the tuple heading.">
                        <span style={{ marginLeft: "5px", marginTop: "5px", display: "inline-flex", alignItems: "center", color: "rgba(0, 0, 0, 0.38)", cursor: "default", height: "45px" }}>
                            <InfoOutlinedIcon fontSize="small" />
                        </span>
                    </Tooltip>
                    : <IconButton onClick={() => handleDeleteArrayItem(index)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}><DeleteIcon fontSize="small" color="secondary" /></IconButton>
                ) : null}
            </div>

        </>
    )

};

export default ItemStringType;