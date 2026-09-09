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
import { toast } from "react-toastify";

// mirrors eLabFTW's own Category -> Item -> Uploads structure instead of a flat file list
const ELabFTWBrowseDialog = ({ open, setOpen, eLabURL, token, onSelectFile, title = "Browse Schema (eLabFTW)" }) => {
    const [nav, setNav] = useState({ level: "categories" });
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

    // "All items" and "Uncategorized" don't depend on the categories list itself, so they
    // stay available even if fetching real categories fails (permissions, API differences, etc.)
    const pseudoCategories = [
        { id: "all", title: "All items" },
        { id: "null", title: "Uncategorized" },
    ];

    const loadCategories = () => {
        setLoading(true);
        $.ajax({
            type: "POST",
            url: "/api/elab/categories_list",
            data: { eLabURL, eLabToken: token },
            success: function (status) {
                setLoading(false);
                if (status["status"] !== 200) {
                    toast.error(status["message"] || "Unable to list categories from eLabFTW.", { toastId: "elabCategoriesError" });
                    setEntries(pseudoCategories);
                    return;
                }
                setEntries([...pseudoCategories, ...status["categories"]]);
            },
            error: function () {
                setLoading(false);
                toast.error("Unable to list categories from eLabFTW.", { toastId: "elabCategoriesError" });
                setEntries(pseudoCategories);
            },
        });
    };

    const loadItems = (categoryId) => {
        setLoading(true);
        $.ajax({
            type: "POST",
            url: "/api/elab/items_list",
            data: categoryId === "all" ? { eLabURL, eLabToken: token } : { eLabURL, eLabToken: token, categoryId },
            success: function (status) {
                setLoading(false);
                if (status["status"] !== 200) {
                    toast.error(status["message"] || "Unable to list items from eLabFTW.", { toastId: "elabItemsError" });
                    setEntries([]);
                    return;
                }
                setEntries(status["items"]);
            },
            error: function () {
                setLoading(false);
                toast.error("Unable to list items from eLabFTW.", { toastId: "elabItemsError" });
                setEntries([]);
            },
        });
    };

    const loadUploads = (itemId) => {
        setLoading(true);
        $.ajax({
            type: "POST",
            url: "/api/elab/item_uploads",
            data: { eLabURL, eLabToken: token, itemId },
            success: function (status) {
                setLoading(false);
                if (status["status"] !== 200) {
                    toast.error(status["message"] || "Unable to list schemas from this eLabFTW item.", { toastId: "elabUploadsError" });
                    setEntries([]);
                    return;
                }
                setEntries(status["entries"]);
            },
            error: function () {
                setLoading(false);
                toast.error("Unable to list schemas from this eLabFTW item.", { toastId: "elabUploadsError" });
                setEntries([]);
            },
        });
    };

    useEffect(() => {
        if (open) {
            setNav({ level: "categories" });
            loadCategories();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const goToCategories = () => {
        setNav({ level: "categories" });
        loadCategories();
    };

    const goToItems = (categoryId, categoryTitle) => {
        setNav({ level: "items", categoryId, categoryTitle });
        loadItems(categoryId);
    };

    const goToUploads = (itemId, itemTitle) => {
        setNav((prev) => ({ ...prev, level: "uploads", itemId, itemTitle }));
        loadUploads(itemId);
    };

    const handleEntryClick = (entry) => {
        if (nav.level === "categories") {
            goToItems(entry.id, entry.title);
        } else if (nav.level === "items") {
            goToUploads(entry.id, entry.title);
        } else if (nav.level === "uploads") {
            onSelectFile({ ...entry, itemId: nav.itemId });
            setOpen(false);
        }
    };

    const categoryDotColor = (entry) => {
        if (!entry.color) return "#ccc";
        return entry.color.startsWith("#") ? entry.color : `#${entry.color}`;
    };

    const emptyMessage = {
        categories: "No categories found.",
        items: "No items in this category.",
        uploads: "No JSON schema files found in this item.",
    }[nav.level];

    return (
        <Dialog onClose={() => setOpen(false)} maxWidth="sm" fullWidth={true} open={open}>
            <DialogTitle>
                <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                    <div style={{ fontSize: "22px", width: "100%" }}>
                        {title}
                    </div>
                    <IconButton onClick={() => setOpen(false)}><CloseIcon color="secondary" /></IconButton>
                </div>
            </DialogTitle>
            <Divider />
            <DialogContent>
                <Breadcrumbs style={{ padding: "10px 0" }}>
                    <Link component="button" onClick={goToCategories}>Categories</Link>
                    {(nav.level === "items" || nav.level === "uploads") && (
                        <Link component="button" onClick={() => goToItems(nav.categoryId, nav.categoryTitle)}>
                            {nav.categoryTitle}
                        </Link>
                    )}
                    {nav.level === "uploads" && <span>{nav.itemTitle}</span>}
                </Breadcrumbs>
                <Divider />
                <List style={{ minHeight: "300px" }}>
                    {loading && <ListItem>Loading...</ListItem>}
                    {!loading && entries.length === 0 && <ListItem>{emptyMessage}</ListItem>}
                    {!loading && entries.map((entry, index) => (
                        <ListItem
                            button
                            key={index}
                            onClick={() => handleEntryClick(entry)}
                        >
                            <ListItemIcon>
                                {nav.level === "categories" && entry.id !== "all" && entry.id !== "null" ? (
                                    <span
                                        style={{
                                            width: "12px",
                                            height: "12px",
                                            borderRadius: "50%",
                                            backgroundColor: categoryDotColor(entry),
                                            display: "inline-block",
                                        }}
                                    />
                                ) : nav.level === "uploads" ? (
                                    <DescriptionIcon />
                                ) : (
                                    <FolderIcon />
                                )}
                            </ListItemIcon>
                            <ListItemText primary={entry.title || entry.name} />
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ELabFTWBrowseDialog;
