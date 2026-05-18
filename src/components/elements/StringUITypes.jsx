import React, { useCallback, useContext, useEffect, useState } from 'react'
import TextField from "@material-ui/core/TextField"
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from "@material-ui/lab/Autocomplete";
import { Button } from '@material-ui/core';
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const useStyles = makeStyles((theme) => ({
    root: {
        width: 'auto',
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        fontWeight: theme.typography.fontWeightRegular,
    },
}));

const style = {
    paddingTop: "10px",
    paddingBottom: "10px",
}

const StringUITypes = ({ }) => {
    const [multiChips, setMultiChips] = useState([])
    const [widgetType, setWidgetType] = useState('Text')
    const [value, setValue] = useState('Text')
    const [inputList, setInputList] = useState('')


    const handleRadioChange = (event) => {
        setValue(event.target.value);
    }

    const handleOnChangeListField = (event) => {
        setInputList(event.target.value);
    }

    return (
        <div>
            <RadioGroup row aria-label="widgetType" name="row-radio-buttons-group" value={value}
                onChange={handleRadioChange}>
                <FormControlLabel value="Text" control={<Radio />} label="Text" />
                <FormControlLabel value="Long Text" control={<Radio />} label="Long Text" />
                <FormControlLabel value="List" control={<Radio />} label="List" />
                <FormControlLabel value="Autocomplete" control={<Radio disabled />} label="Autocomplete" />
                <FormControlLabel value="Tag-like" control={<Radio disabled />} label="Tag-like" />
            </RadioGroup>
        </div>

    )
};

export default StringUITypes;