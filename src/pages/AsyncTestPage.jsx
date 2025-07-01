import React, { useCallback, useEffect, useState } from "react";
import { IconButton, Button } from "@material-ui/core";
import ProgressDialog from "../components/ProgressDialog";
import CryptoJS from "crypto-js";

// to create a bundle (download dataset+metadata as .zip)
import JSZip from "jszip";
import { saveAs } from "file-saver";

const AsyncTestPage = () => {
  // ProgressDialog
  const [openProgressDialog, setOpenProgressDialog] = useState(false);
  const [progressDialogMessages, setProgressDialogMessages] = useState([
    "",
    "",
  ]);
  const [progress, setProgress] = useState(0);
  const [progressDialogTitle, setProgressDialogTitle] = useState("");

  const [hashes, setHashes] = useState({});

  const [loadedFiles, setLoadedFiles] = useState([]);

  useEffect(() => {
    //console.log(hashes);
  }, [hashes, progress, hashAllFiles]);

  function resolveAfter2Seconds() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("resolved");
      }, 2000);
    });
  }

  function resolveAfterOneSecond() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve("resolved");
      }, 1000);
    });
  }

  async function asyncCall() {
    console.log("calling");
    setOpenProgressDialog(true);
    setProgressDialogTitle("Progressing...");
    setProgressDialogMessages("Doing stuff.");
    setProgress(0);
    for (let i = 0; i < 10; i++) {
      const result = await resolveAfter2Seconds();
      setProgress((i + 1) * 10);
      console.log(result);
    }
    // Expected output: "resolved"
  }

  // --------------------------------------- Dataset certification feature ------------------------------------
  const readAndHash = (file) => {
    return new Promise((resolve) => {
      let reader = new FileReader();
      // hash the file
      reader.onloadend = function () {
        let file_result = this.result;
        let file_wordArr = CryptoJS.lib.WordArray.create(file_result);
        let sha256_hash = CryptoJS.SHA256(file_wordArr);
        console.log(`finished hashing "${file["name"]}"`);
        resolve([file["name"], sha256_hash.toString()]);
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const certifyOnBloxberg = (hashes, metadata) => {
    let crid = [];
    let file_names = [];

    for (const [key, value] of Object.entries(hashes)) {
      file_names.push(key);
      crid.push(value);
    }

    console.log("crid:", crid);
    console.log("file names:", file_names);

    var $ = require("jquery");
    return $.ajax({
      type: "POST",
      url: "/api/certify",
      async: true,
      dataType: "json",
      data: {
        crid: JSON.stringify(crid),
        metadata: JSON.stringify(metadata),
        file_names: JSON.stringify(file_names),
        hashes_dict: JSON.stringify(hashes),
      },
      success: function (status) {
        console.log(status);
        console.log("success");
      },
      error: function (status) {
        console.log("failed");
      },
    });
  };

  async function hashAllFiles() {
    setOpenProgressDialog(true);
    setProgressDialogTitle("Processing...");
    setProgressDialogMessages("Starting...");
    setProgress(0);
    let hashDict = {};
    const increment = 100 / (loadedFiles.length + 1 + 1); // num of files plus one certification process plus one zipping process
    // hashing
    for (let i = 0; i < loadedFiles.length; i++) {
      setProgressDialogMessages(`Hashing "${loadedFiles[i]["name"]}"...`);
      const result = await readAndHash(loadedFiles[i]);
      setProgress((i + 1) * increment);
      hashDict[result[0]] = result[1];
    }
    setProgressDialogMessages(`Finished hashing all files.`);
    console.log("finished:", hashDict);
    setHashes(hashDict);
    // certifying
    setProgressDialogMessages(`Certifying all files...`);
    const result = await certifyOnBloxberg(hashDict, {});
    console.log("result:", result);
    setProgress((loadedFiles.length + 1) * increment);

    // zip the results together
    if (result["status_code"] === 200) {
      setProgressDialogMessages(`Zipping certificates...`);
      const zip = new JSZip();
      for (const [file_name, content] of Object.entries(result["data"])) {
        zip.file(file_name, content, { base64: true });
      }

      zip.generateAsync({ type: "blob" }).then(function (content) {
        saveAs(content, "certificates.zip");
      });
      setProgress(100);
      setProgressDialogTitle("Process complete");
      setProgressDialogMessages(`Finished everything.`);
    } else {
      setProgress(0);
      setProgressDialogTitle("ERROR");
      setProgressDialogMessages(`ERROR`);
    }
  }

  // -------------------------------------------------------------------------------------------------------

  // Asynchronously read selected files and hash
  const handleShowFiles = () => {
    const selectedFile = document.getElementById("browsefiles").files;
    setLoadedFiles(selectedFile);
    console.log(selectedFile);
  };

  return (
    <div style={{ padding: "10px" }}>
      <div>Test page to experiment with async. functions</div>
      <input
        onChange={() => handleShowFiles()}
        type="file"
        id="browsefiles"
        multiple
      ></input>
      <Button onClick={() => asyncCall()}>Async Test</Button>
      <Button onClick={() => hashAllFiles()} color="primary">
        Hash all
      </Button>
      <ProgressDialog
        openProgressDialog={openProgressDialog}
        setOpenProgressDialog={setOpenProgressDialog}
        progress={progress}
        title={progressDialogTitle}
        messages={progressDialogMessages}
      />
    </div>
  );
};

export default AsyncTestPage;
