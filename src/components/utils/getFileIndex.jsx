const getFileIndex = (files, fileMetadata) => {
    fileMetadata = fileMetadata.split(";")
    // alert(fileMetadata)
    const filetype = fileMetadata[0].replace("fileupload:", "")
    const filename = fileMetadata[1]
    const filesize = fileMetadata[2]
    // console.log(filetype, filename, filesize)
    for (let i = 0; i < files.length; i++) {
        if (files[i]["name"] === filename && files[i]["type"] === filetype && files[i]["size"].toString() === filesize) {
            return i
        }
    }
    return -1
}

export default getFileIndex