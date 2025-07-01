import { Button } from "@mui/material"
import FormRenderer from "./FormRenderer"
import object2array from "./utils/object2array"
import { useState, useEffect } from "react"

const EditExperiment = ({ retrievedJSONSchema, retrievedJSONData, experimentData }) =>{
    const [schemaSpecification, setSchemaSpecification] = useState("");
    const [editMode, setEditMode] = useState(false);
    const [convertedSchema, setConvertedSchema] = useState()

    useEffect(()=>{
        console.log("ori schema:",retrievedJSONSchema)
        if (retrievedJSONSchema !== undefined) {
        let data = JSON.parse(JSON.stringify(retrievedJSONSchema))
        data["properties"] = object2array(
            retrievedJSONSchema["properties"]
        );
        console.log("convertedSChema:", data)
        setConvertedSchema(data)
        }
    }, [retrievedJSONSchema])



    return (<>
        <div style={{padding:"10px"}} dangerouslySetInnerHTML={{ __html: experimentData['body'] }}></div>
        {convertedSchema !== undefined ?
        <div style={{ padding: "10px" }}>
            <FormRenderer
                revertAllChanges={null}
                schema={convertedSchema}
                setSchemaSpecification={setSchemaSpecification}
                originalSchema={retrievedJSONSchema}
                edit={editMode}
            />
        </div>: null}
        </>
    )
}

export default EditExperiment