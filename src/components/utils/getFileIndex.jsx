const getFileIndex = (files, fileMetadata) => {
    fileMetadata = fileMetadata.split(";")
    // alert(fileMetadata)
    const filetype = fileMetadata[0].replace("fileupload:", "")
    const filename = fileMetadata[1]
    const filesize = fileMetadata[2]
    // console.log(filetype, filename, filesize)
    for (let i = 0; i < files.length; i++) {
        // empty slot: a resource whose file has not been attached in this session
        if (!files[i]) continue
        if (files[i]["name"] === filename && files[i]["type"] === filetype && files[i]["size"].toString() === filesize) {
            return i
        }
    }
    return -1
}

export default getFileIndex