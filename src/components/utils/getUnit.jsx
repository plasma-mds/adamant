const getUnit = (field_label) => {

    if (field_label === undefined) {
        return ""
    }

    let addorn = field_label.match(/[^[\]]+(?=])/g)
    if (addorn === null) {
        return ""
    } else {
        return addorn
    }
}

export default getUnit;