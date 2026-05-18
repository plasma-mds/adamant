import React, { useContext, useState } from 'react'
import TextField from "@material-ui/core/TextField"
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from "@material-ui/icons/Delete";
import { IconButton } from '@material-ui/core';
import { Typography } from '@material-ui/core';
import { FormContext } from '../../../FormContext';
import getUnit from '../../utils/getUnit';
import { MathComponent } from 'mathjax-react'
import { InputAdornment } from '@material-ui/core';


const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));



const ItemNumberType = ({ oDataInputItems, oSetDataInputItems, arrayFieldKey, withinObject, value, pathFormData, dataInputItems, setDataInputItems, path, field_label, edit, index, field_key, handleDeleteArrayItem }) => {
    const classes = useStyles();
    //const [inputValue, setInputValue] = useState(value === undefined ? "" : value[index] === undefined ? "" : value[index]);
    const { handleConvertedDataInput } = useContext(FormContext);
    const [inputValue, setInputValue] = useState(dataInputItems[index])

    let unit = getUnit(field_label)
    if (unit[0] === '%') {
        unit = "\\" + unit
    }


    // handle input on change for number a.k.a signed float
    const handleInputOnChange = (event) => {
        let inputValueVar = inputValue
        inputValueVar = inputValueVar.toString()
        if (((inputValueVar.split('.').length - 1) > 1) & (event.target.value.at(-1) === '.')) {
            let value = inputValueVar
            setInputValue(value.replace(/ /g, ''))
        } else {
            let value = event.target.value.replace(/(?!^-)[^0-9.]/g, "").replace(/(\..*)\./g, '$1')
            setInputValue(value.replace(/ /g, ''))
        }
    }

    // handle input on blur for signed integer
    const handleInputOnBlur = () => {
        if (withinObject !== undefined & withinObject === true) {
            let value = inputValue;
            value = parseFloat(value)
            if (!isNaN(value)) {

                let arr = dataInputItems;
                let arr2 = oDataInputItems
                let items = Array.from(arr);
                let items2 = Array.from(arr2);

                let prevIndex = parseInt(path.split(".").pop())
                items[index] = value;
                items2[prevIndex][arrayFieldKey] = items
                oSetDataInputItems(items2);

                setInputValue(value)

                let newPath = path.split(".")
                newPath.pop()
                newPath = newPath.join(".")

                // conv. schema data
                handleConvertedDataInput(items2, newPath + ".value", "array")
            }

        } else {
            let value = inputValue;
            value = parseFloat(value)
            if (!isNaN(value)) {
                setInputValue(value)

                // store it to input data array
                let arr = dataInputItems;
                const items = Array.from(arr);
                items[index] = value;
                setDataInputItems(items);

                // conv. schema data
                handleConvertedDataInput(items, path + ".value", "array")
            }
        }
    }

    return (
        <>
            {index !== undefined ? <div style={{ padding: "5px" }}>
                <Typography className={classes.heading}>{index + 1}.</Typography>
            </div> : null}
            <div style={{ paddingTop: "10px", paddingBottom: "10px", display: 'inline-flex', width: '100%' }}>
                <TextField size='small' onBlur={() => handleInputOnBlur()} onChange={e => handleInputOnChange(e)} value={inputValue} fullWidth={true} className={classes.heading} id={field_key} variant="outlined" InputProps={{
                    endAdornment: <InputAdornment position="start">{<MathComponent tex={String.raw`\\${unit}`} />}</InputAdornment>,
                }} />
                {edit ? <>
                    <IconButton onClick={() => handleDeleteArrayItem(index)} style={{ marginLeft: "5px", marginTop: "5px", height: "45px" }}><DeleteIcon fontSize="small" color="secondary" /></IconButton></> : null}
            </div>

        </>
    )
};

export default ItemNumberType;
