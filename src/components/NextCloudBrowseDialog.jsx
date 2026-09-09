import React, { useEffect, useState } from "react";
import $ from "jquery";
import Divider from '@material-ui/core/Divider';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from "@material-ui/core/Button";
import { IconButton, List, ListItem, ListItemIcon, ListItemText, Breadcrumbs, Link } from "@material-ui/core";
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import DescriptionIcon from '@material-ui/icons/Description';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import { toast } from "react-toastify";

// mode: "pick-file" lets the user select a .json file, "pick-folder" lets the user select a destination folder.
const NextCloudBrowseDialog = ({ open, setOpen, ncUrl, ncUsername, ncAppPassword, mode, onSelectFile, onSelectFolder, title }) => {
    const [currentPath, setCurrentPath] = useState("");
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadDirectory = (path) => {
        setLoading(true);
        $.ajax({
            type: "POST",
            url: "/api/nextcloud/list",
            data: { ncUrl, ncUsername, ncAppPassword, path },
            success: function (status) {
                setLoading(false);
                if (status["status"] !== 200) {
                    toast.error(status["message"] || "Unable to list this NextCloud folder.", { toastId: "ncListError" });
                    return;
                }
                setCurrentPath(path);
                setEntries(status["entries"]);
            },
            error: function () {
                setLoading(false);
                toast.error("Unable to list this NextCloud folder.", { toastId: "ncListError" });
            },
        });
    };

    useEffect(() => {
        if (open) {
            loadDirectory("");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleEntryClick = (entry) => {
        const newPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
        if (entry.isFolder) {
            loadDirectory(newPath);
        } else if (mode === "pick-file" && entry.name.toLowerCase().endsWith(".json")) {
            onSelectFile(newPath);
            setOpen(false);
        }
    };

    const breadcrumbSegments = currentPath ? currentPath.split("/") : [];

    return (
        <Dialog onClose={() => setOpen(false)} maxWidth="sm" fullWidth={true} open={open}>
            <DialogTitle>
                <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                    <div style={{ fontSize: "22px", width: "100%" }}>
                        {title || (mode === "pick-file" ? "Browse Schema (NextCloud)" : "Choose a destination folder")}
                    </div>
                    <IconButton onClick={() => setOpen(false)}><CloseIcon color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Breadcrumbs style={{ padding: "10px 0" }}>
                    <Link component="button" onClick={() => loadDirectory("")}>Home</Link>
                    {breadcrumbSegments.map((segment, index) => (
                        <Link
                            key={index}
                            component="button"
                            onClick={() => loadDirectory(breadcrumbSegments.slice(0, index + 1).join("/"))}
                        >
                            {segment}
                        </Link>
                    ))}
                </Breadcrumbs>
                <Divider />
                <List style={{ minHeight: "300px" }}>
                    {loading && <ListItem>Loading...</ListItem>}
                    {!loading && entries.length === 0 && <ListItem>This folder is empty.</ListItem>}
                    {!loading && entries.map((entry, index) => {
                        const selectable = entry.isFolder || (mode === "pick-file" && entry.name.toLowerCase().endsWith(".json"));
                        return (
                            <ListItem
                                button
                                key={index}
                                disabled={!selectable}
                                onClick={() => handleEntryClick(entry)}
                            >
                                <ListItemIcon>
                                    {entry.isFolder ? <FolderIcon /> : entry.name.toLowerCase().endsWith(".json") ? <DescriptionIcon /> : <InsertDriveFileIcon />}
                                </ListItemIcon>
                                <ListItemText primary={entry.name} />
                            </ListItem>
                        );
                    })}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
                {mode === "pick-folder" && (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => { onSelectFolder(currentPath); setOpen(false); }}
                    >
                        Select this folder
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default NextCloudBrowseDialog;
