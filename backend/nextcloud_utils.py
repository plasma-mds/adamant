import requests
from urllib.parse import quote, unquote
import xml.etree.ElementTree as ET

DAV_NS = "{DAV:}"

PROPFIND_BODY = """<?xml version="1.0"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:resourcetype/>
    <d:getcontentlength/>
    <d:getlastmodified/>
  </d:prop>
</d:propfind>"""


def webdav_base(nc_url, username):
    return "{0}/remote.php/dav/files/{1}".format(nc_url.rstrip("/"), quote(username))


def webdav_url(nc_url, username, path):
    path = path.strip("/")
    base = webdav_base(nc_url, username)
    if path == "":
        return base
    return "{0}/{1}".format(base, quote(path))


def verify_login(nc_url, username, app_password):
    # Use the OCS API to fetch the user's display name, also validating the credentials.
    response = requests.get(
        "{0}/ocs/v1.php/cloud/users/{1}".format(nc_url.rstrip("/"), quote(username)),
        auth=(username, app_password),
        headers={"OCS-APIRequest": "true", "Accept": "application/json"},
        params={"format": "json"},
    )
    if response.status_code != 200:
        return None
    data = response.json()
    meta = data.get("ocs", {}).get("meta", {})
    # OCS v1 reports success as statuscode 100, not the HTTP-style 200.
    if meta.get("statuscode") not in (100, 200):
        return None
    return data["ocs"]["data"].get("displayname", username)


def list_directory(nc_url, username, app_password, path):
    response = requests.request(
        "PROPFIND",
        webdav_url(nc_url, username, path),
        auth=(username, app_password),
        headers={"Depth": "1", "Content-Type": "application/xml"},
        data=PROPFIND_BODY,
    )
    if response.status_code != 207:
        raise RuntimeError("Unable to list directory (status {0})".format(response.status_code))

    root = ET.fromstring(response.content)
    requested_href = webdav_url(nc_url, username, path).split(nc_url.rstrip("/"), 1)[-1]
    entries = []
    for resp in root.findall("{0}response".format(DAV_NS)):
        href = resp.find("{0}href".format(DAV_NS)).text
        if href.rstrip("/") == unquote(requested_href).rstrip("/"):
            continue  # skip the entry for the requested path itself
        name = unquote(href.rstrip("/").rsplit("/", 1)[-1])
        resourcetype = resp.find(".//{0}resourcetype".format(DAV_NS))
        is_folder = resourcetype is not None and resourcetype.find("{0}collection".format(DAV_NS)) is not None
        entries.append({"name": name, "isFolder": is_folder})

    entries.sort(key=lambda e: (not e["isFolder"], e["name"].lower()))
    return entries


def read_file(nc_url, username, app_password, path):
    response = requests.get(webdav_url(nc_url, username, path), auth=(username, app_password))
    if response.status_code != 200:
        raise RuntimeError("Unable to read file (status {0})".format(response.status_code))
    return response.content


def make_directory(nc_url, username, app_password, path):
    # Create each path segment in turn; a 405 means the segment already exists.
    segments = [s for s in path.strip("/").split("/") if s != ""]
    current = ""
    for segment in segments:
        current = "{0}/{1}".format(current, segment) if current else segment
        response = requests.request(
            "MKCOL", webdav_url(nc_url, username, current), auth=(username, app_password)
        )
        if response.status_code not in (201, 405):
            raise RuntimeError(
                "Unable to create folder '{0}' (status {1})".format(current, response.status_code)
            )


def upload_file(nc_url, username, app_password, path, content):
    response = requests.put(webdav_url(nc_url, username, path), auth=(username, app_password), data=content)
    if response.status_code not in (201, 204):
        raise RuntimeError("Unable to upload '{0}' (status {1})".format(path, response.status_code))
