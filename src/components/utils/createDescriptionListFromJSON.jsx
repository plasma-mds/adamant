import nicelySort from "./nicelySort";
import preProcessB4DescList from "./preProcessB4DescList";
import getTableCandidates from "./getTableCandidates";
import table2DescListTable from "./table2DescListTable";
import createDescriptionList from "./createDescriptionList";
import createDescriptionListWithoutStyling from "./createDescriptionListWithoutStyling";


const createDescriptionListFromJSON = (cleanedJson, convertedSchema, convertedProperties, schema, footnote, styling) => {

    let preProcessed = preProcessB4DescList(cleanedJson, cleanedJson, schema, []);
    //console.log(preProcessed);
    let nicelySorted = nicelySort(preProcessed);
    // now check if there is array that contains object if there is then create a html table for this array
    let tables = getTableCandidates(convertedProperties, []);
    let descListTables = [];
    if (tables.length !== 0) {
        tables.forEach((table) =>
            descListTables.push(table2DescListTable(table))
        );
    }
    let descList;
    if (styling) {
        descList = `<dl>\n${createDescriptionList(
            nicelySorted
        )}</dl>\n`;
    }
    else {
        descList = `<dl>\n${createDescriptionListWithoutStyling(
            nicelySorted
        )}</dl>\n`;
    }
    let descListHeading = `<h1><strong>${convertedSchema["title"]}</strong></h1>\n`;
    descListHeading += descList;
    // now insert desc list tables if applicable/available
    if (descListTables.length !== 0) {
        descListTables.forEach((item) => {
            descListHeading += item;
        });
    }
    descListHeading += footnote

    return descListHeading;
}


export default createDescriptionListFromJSON;