import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from "@material-ui/core/Button";
import Typography from '@mui/material/Typography';
import CalendarToday from "@material-ui/icons/CalendarToday";
import AttachmentIcon from "@material-ui/icons/Attachment";
import { Divider } from '@material-ui/core';
import AdamantIcon from '../assets/adamant-new-logo.ico'
import { Tooltip } from "@material-ui/core";

const RenderExperimentCard = ({ experiments, readExperimentELabFTW }) => {
    console.log(experiments)

    let colorList = {
        "Success": "#07BC0C",
        "Running": "turquoise",
        "Fail": "red",
        "Need to be redone": "gray"
    }

    const handleEditExperiment = (experimentID) => {
        readExperimentELabFTW(experimentID)
    }

    if (experiments.length === 0) {
        return null
    } else {
        return (
            <>
            <div style={{paddingLeft:"10px"}}>
                    <h3>{experiments.length} experiments retrieved: </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", width: "100%", padding:"10px" }}>
            {Object.keys(experiments).map((index) => {
                return (<>
                    <Card style={{ marginBottom: "5px", marginRight: "2px", marginLeft: "2px", width: "32.8%", height:"100%", overflowY:"auto"}}>
                        <div style={{display:"flex"}}>
                            <div style={{ padding: "4px", backgroundColor: `#${experiments[index]["status_color"]}`, height: "auto", overflowY: "auto" }}></div>
                            <div style={{width:"100%", height:"100%"}}>
                                <CardContent>
                                    <Typography gutterBottom variant="auto" component="div">
                                        <strong>{experiments[index]["title"]}</strong>
                                        {experiments[index]['tags'] !== null && experiments[index]['tags'].includes('Adamant') ? 
                                        <Tooltip placement="top" title="Experiment created with Adamant">
                                        <img
                                            style={{
                                                marginTop: "-20px",
                                                marginBottom: "-5px",
                                                height: "20px",
                                                borderRadius: "5px",
                                            }}
                                            alt="header"
                                            src={AdamantIcon}
                                        />
                                            </Tooltip> : null}
                                    </Typography>
                                <div style={{paddingBottom:"5px"}}><Divider /> </div>
                                <Typography variant="body2" color="text.secondary" style={{ display: "flex", flexDirection: "row", flexWrap: "wrap"}}>
                                    <div><font color={"#"+experiments[index]["status_color"]}><strong>{experiments[index]["status_title"]}</strong></font></div>
                                    <div style={{paddingLeft:"3px", paddingRight:"3px"}}></div>
                                    <div style={{display:"flex"}}><CalendarToday style={{height:"20px"}}/> {experiments[index]["date"]}</div>
                                    <div style={{ paddingLeft: "3px", paddingRight: "3px" }}></div>
                                    {experiments[index]["has_attachment"] === 1 ? <AttachmentIcon style={{height:"20px"}}/> : null}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <div style={{display:"flex", justifyContent:"right", width:"100%"}}>
                                    <Button size="small" color='primary' onClick={() => handleEditExperiment(experiments[index]["id"])}>Edit</Button>
                                    {/*<Button size="small" color='secondary'>Remove</Button>*/}
                                    </div>
                                </CardActions>
                            </div>
                        </div>
                        </Card>

                </>)
            })}
            </div>
            </>
        )
    }

}

export default RenderExperimentCard;