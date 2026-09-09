// strip non-printable/control characters and characters invalid in filenames on
// Windows/macOS/Linux, so the result is a safe filename on most platforms
const sanitizeFilename = (name) => {
    if (name === undefined || name === null) {
        return "";
    }
    return String(name)
        // eslint-disable-next-line no-control-regex
        .replace(/[\x00-\x1F\x7F]/g, "")
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\.+$/, "");
};

export default sanitizeFilename;
