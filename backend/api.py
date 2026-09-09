from flask import Flask, request
from flask_restful import Api
import elabapy
import json
import base64
from pathlib import Path
import os
import smtplib
from email.message import EmailMessage
import mimetypes
import io
import base64
from datetime import date
import requests
from utils import *
import elabapi_python
from elabapi_python.rest import ApiException
#from zipfile import ZipFile
import io
import nextcloud_utils

app = Flask(__name__, static_folder='../build', static_url_path='/')  # for Gunicorn deployment
# app = Flask(__name__)
api = Api(app)

TEMP_FILES_DIR = 'temp-files'


def ensure_temp_files_dir():
    os.makedirs(TEMP_FILES_DIR, exist_ok=True)

@app.route('/api/check_mode', methods=["GET"])
def check_mode():
    # check if online, and get list of schemas used in job request workflows
    listSchemas = []
    listSubmitText = []
    emailconf_list = []
    try:
        if os.path.exists("./conf/jobrequest-conf.json"):
            with open("./conf/jobrequest-conf.json", "r") as fi:
                f = fi.read()
                f = json.loads(f)
                emailconf_list = f.get("confList", [])
                for element in emailconf_list:
                    listSchemas.append(element.get("completeSchemaTitle", ""))
                    listSchemas.append(element.get("requestSchemaTitle", ""))
                    listSubmitText.append(element.get("submitButtonText", ""))
                    listSubmitText.append(element.get("submitButtonText", ""))
            return {"message": "connection is a success", "jobRequestSchemaList": listSchemas, "submitButtonText": listSubmitText, "configs": emailconf_list}
        else:
            return {"message": "offline mode", "jobRequestSchemaList": listSchemas, "submitButtonText": listSubmitText, "configs": emailconf_list}
    except Exception as e:
        print(f"Error in check_mode: {e}")
        return {"message": "offline mode", "jobRequestSchemaList": listSchemas, "submitButtonText": listSubmitText, "configs": emailconf_list}


# get schemas from backend
@app.route('/api/get_schemas', methods=["GET"])
def get_schemas():
    list_of_schemas = {"schemaName": [""], "schema": [None]}
    filelist = list(Path('./schemas').glob('**/*.json'))
    for i in range(0, len(filelist)):
        file = filelist[i]
        file = open(str(file), 'r', encoding='utf-8')
        filename = str(file.name).replace("schemas\\", "")
        filename = filename.replace("schemas/", "")  # for linux, maybe
        content = file.read()
        list_of_schemas["schema"].append(content)
        list_of_schemas["schemaName"].append(filename)
    return list_of_schemas


# fetch a JSON schema from an arbitrary, user-supplied URL
@app.route('/api/load_schema_from_url', methods=['POST'])
def load_schema_from_url():
    url = request.form['url']
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        schema = response.json()
        return {"status": 200, "schema": schema}
    except Exception as e:
        print(f"Error in load_schema_from_url: {e}")
        return {"status": 500, "message": "Unable to fetch or parse a JSON schema from that URL."}


# get available tags from eLabFTW
@app.route('/api/get_tags', methods=['POST'])
def get_tags():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']

    response = requests.get(f'{elabURL}/api/v2/teams/{0}/tags', headers={'Authorization': token})
    # NOTE: API v2 to retrieve tags /api/v2/teams/{id}/tags -> Here, it seems that we can use "0" as id instead of the team id.
    tags = json.loads(response.text)
    #print('tags:', tags)
    #tags = ['tag1', 'tag2'] # comment this after update
    return json.dumps(tags)


# create experiment in eLabFTW
@app.route('/api/create_experiment', methods=['POST'])
def create_experiment():
    ensure_temp_files_dir()
    jsdata = request.form['javascript_data']
    jsschema = request.form['schema']
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    title = request.form['title']
    body = request.form['body']
    tags = request.form['tags']
    tags = json.loads(tags)
    jsdata = json.loads(jsdata)
    jsschema = json.loads(jsschema)
    jsschema_title = jsschema["title"]

    # Prepare tags
    print("tags:", tags)
    tags_array = ['Adamant']
    for tag in tags:
        tags_array.append(tag['tag'])

    params = {"category_id": -1, "tags": tags_array}
    headers = {'Authorization': token, 'Content-Type': 'application/json', 'accept': '*/*'}
    response = requests.post('{0}/api/v2/experiments'.format(elabURL), headers=headers, json=params)

    # Get the latest created experiment id
    response = requests.get('{0}/api/v2/experiments'.format(elabURL), headers=headers)
    experiments = json.loads(response.text)
    this_experiment = experiments[0]
    #print(this_experiment)
    this_experiment_id = int(this_experiment['id'])

    # Modify the body, i.e., give it title and body, and so on
    params = {'title': title,
              'body': '<h1><span style="font-size:14pt;">Goal :</span></h1>\n<p>\xa0</p>\n<h1><span style="font-size:14pt;">Procedure :</span></h1>\n<p>\xa0</p>\n<h1><span style="font-size:14pt;">Results :<br></span></h1>\n<p>\xa0</p>',
              "status": 1}
    response = requests.patch('{0}/api/v2/experiments/{1}'.format(elabURL, this_experiment_id), headers=headers, json=params)
    print('Adding title and body is successful.')

    ############ UPLOAD THE SCHEMA AND JSON DATA ############
    # Configure the api client
    configuration = elabapi_python.Configuration()
    configuration.api_key['api_key'] = token
    configuration.api_key_prefix['api_key'] = 'Authorization'
    configuration.host = '{0}/api/v2'.format(elabURL)
    configuration.debug = False
    configuration.verify_ssl = False

    # create an instance of the API class
    api_client = elabapi_python.ApiClient(configuration)
    # fix issue with Authorization header not being properly set by the generated lib
    api_client.set_default_header(header_name='Authorization', header_value=token)

    # create an instance of Experiments and another for Uploads
    experimentsApi = elabapi_python.ExperimentsApi(api_client)
    uploadsApi = elabapi_python.UploadsApi(api_client)
    # --- JSON SCHEMA
    with open('temp-files//json_schema.json', 'w') as outfile:
        outfile.write(json.dumps(jsschema))
    # upload the file 'json_schema.json' present in temp-files dir
    uploadsApi.post_upload('experiments', this_experiment_id, file='temp-files//json_schema.json', comment='Uploaded with APIv2')
    # --- JSON DATA
    with open('temp-files//json_data.json', 'w') as outfile:
        outfile.write(json.dumps(jsdata))
    # upload the file 'json_data.json' present in temp-files dir
    uploadsApi.post_upload('experiments', this_experiment_id, file='temp-files//json_data.json', comment='Uploaded with APIv2')
    # --- OTHER UPLOADED DATA
    # now check if there are file data in jsdata, if there is then upload it
    collected_data = findBase64(jsdata, "start", [])
    file = open("./mime-types-extensions.json",
                'r', encoding='utf-8')
    mimeExtensions = file.read()
    file.close()
    fileNames = []
    mimeExtensions = json.loads(mimeExtensions)
    for item in collected_data:
        mimeType = item["data"].split(";")[0].replace("data:", "")
        extension = list(mimeExtensions.keys())[
            list(mimeExtensions.values()).index(mimeType)]
        fileNames.append(item["key"]+extension)
        _, encoded = item["data"].split(",", 1)
        binary_data = base64.b64decode(encoded)
        with open("temp-files//"+item["key"]+extension, "wb") as fh:
            fh.write(binary_data)
        uploadsApi.post_upload('experiments', this_experiment_id, file="temp-files//"+item["key"]+extension, comment='Uploaded with APIv2')
    print('file names:', fileNames)

    # now delete everything in temp-files directory
    dir = './temp-files'
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))

    # check if this process is related to job request workflow, if yes then send an e-mail notif to the requester
    try:
        with open("./conf/jobrequest-conf.json", "r") as fi:
            f = fi.read()
            f = json.loads(f)
            email_conf = ""
            for element in f["confList"]:
                if element["completeSchemaTitle"] == jsschema_title or element["requestSchemaTitle"] == jsschema_title:
                    email_conf = element
            # finish the process if not related to job request workflow
            if email_conf == "":
                return {"responseText": f"Created experiment with id {this_experiment_id}.", "message": "success", "experimentId": this_experiment_id}

            requesterEmail = findRequesterEmail(
                jsdata, email_conf["requesterEmailKeyword"], "")
            
            operatorName = findOperatorName(
                jsdata, email_conf["operatorNameKeyword"], "")
            operatorName_ = operatorName.replace(" ", "_")
            operatorEmail = ""
            responsiblePersonEmail = email_conf["responsibleOperatorEmail"]

            for key in email_conf["operators"]:
                if key == operatorName_:
                    operatorEmail = email_conf["operators"][operatorName_]

            # sending the emails
            s = smtplib.SMTP_SSL(email_conf["smtp"])

            # PREPARE msg for APPLICANT
            msg = EmailMessage()
            msg['From'] = operatorEmail  # email_conf["from"]
            msg['To'] = requesterEmail
            msg['Subject'] = email_conf["requestAcceptedSubject"]

            header = email_conf["requestAcceptedHeaderText"]
            html = header+body

            msg.set_content(html, subtype="html")

            s.send_message(msg)
            print("applicant email is valid")
            del msg
    except Exception as e:
        print("No job request configuration was found. Skipping.")

    return {"responseText": f"Created experiment with id {this_experiment_id}.", "message": "success", "experimentId": this_experiment_id}

@app.route('/api/submit_job_request', methods=['POST'])
def submit_job_request():
    today = date.today()
    dateToday = today.strftime("%d_%b_%Y")

    jsdata = request.form['javascript_data']
    jsschema = request.form['schema']
    body = request.form['body']
    jsdata = json.loads(jsdata)
    jsschema = json.loads(jsschema)

    try:
        with open("./conf/jobrequest-conf.json", "r") as fi:
            f = fi.read()

            # find the right conf based on the schema title
            f = json.loads(f)
            email_conf = {}
            for element in f["confList"]:
                if element["completeSchemaTitle"] == jsschema["title"] or element["requestSchemaTitle"] == jsschema["title"]:
                    email_conf = element

            requesterEmail = findRequesterEmail(
                jsdata, email_conf["requesterEmailKeyword"], "")
            operatorName = findOperatorName(
                jsdata, email_conf["operatorNameKeyword"], "")
            operatorName_ = operatorName.replace(" ", "_")
            operatorEmail = ""
            responsiblePersonEmail = email_conf["responsibleOperatorEmail"]

            for key in email_conf["operators"]:
                if key == operatorName_:
                    operatorEmail = email_conf["operators"][operatorName_]

            # sending the emails
            s = smtplib.SMTP_SSL(email_conf["smtp"])

            # PREPARE msg1 for APPLICANT
            msg1 = EmailMessage()
            msg1['From'] = requesterEmail #email_conf["from"]
            msg1['To'] = requesterEmail
            msg1['Subject'] = email_conf["confirmationEmailSubject"]

            header1 = email_conf["confirmationHeaderText"]
            html1 = header1+body

            msg1.set_content(html1, subtype="html")

            # PREPARE msg2 for OPERATOR
            msg2 = EmailMessage()
            msg2['From'] = requesterEmail #email_conf["from"]
            msg2['To'] = "{0}, {1}".format(
                operatorEmail, responsiblePersonEmail)
            msg2['Subject'] = email_conf["requestReceivedEmailSubject"]

            header2 = email_conf["requestReceivedHeaderText"]
            html2 = header2+body

            msg2.set_content(html2, subtype="html")

            # create json attachments
            for i in range(0, 2):
                data = ""
                if i == 0:
                    data = jsdata
                    fileName = "form_data"
                else:
                    data = jsschema
                    fileName = "schema"

                f = json.dumps(data, indent=2).encode('utf-8')
                f_byte_arr = io.BytesIO()
                f_byte_arr.write(f)
                f_byte_arr.seek(0)
                binary_data = f_byte_arr.read()
                # Guess MIME type or use 'application/octet-stream'
                maintype, _, subtype = (mimetypes.guess_type("{0}_{1}.json".format(
                    fileName, dateToday))[0] or 'application/octet-stream').partition("/")
                # Add as attachment
                msg1.add_attachment(binary_data, maintype=maintype, subtype=subtype,
                                    filename="{0}_{1}.json".format(fileName, dateToday))
                msg2.add_attachment(binary_data, maintype=maintype, subtype=subtype,
                                    filename="{0}_{1}.json".format(fileName, dateToday))

            # now send the emails to both requester and operator (and responsible person)
            try:
                s.send_message(msg1)
                s.send_message(msg2)
                print("applicant email is valid")
                del msg1
                del msg2
                return {"response": 200, "responseText": "Your request has been submitted."}
            except Exception as e:
                del msg1
                del msg2
                print(str(e))
                message = "Something went wrong. Probably the email you entered is wrong!"
                return {"response": 500, "responseText": message}

    except Exception as e:
        print(e)
        return {"response": 500, "responseText": "List of operators are not available in the server."}


@app.route('/api/login', methods=['POST'])
def login():
    elabURL = request.form['elabUrl']
    email = request.form['email']
    token = request.form['eLabToken']
    id = ""
    firstName = ""
    lastName = ""
    response = requests.get('{}/api/v2/users'.format(elabURL), headers={'Authorization': token})
    users = json.loads(response.text)
    for user in users:
        if user["email"] == email:
            firstName = user["firstname"]
            lastName = user["lastname"]
            id = user["userid"]

    if id == "":
        return {"status": 400, "message": "User not found"}

    result = {
        "id": id,
        "firstname": firstName,
        "lastname": lastName,
        "email": email
    }

    return json.dumps(result)


@app.route('/api/get_experiments', methods=['POST'])
def get_experiments():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    response = requests.get(
        '{}/api/v2/experiments'.format(elabURL), headers={'Authorization': token})
    experiments = json.loads(response.text)
    print(len(experiments), "experiments retrieved")
    return json.dumps(experiments)


@app.route('/api/read_experiment', methods=['POST'])
def read_experiment():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    experiment_id = request.form['experiment_id']
    # read experiment
    response = requests.get(
        '{0}/api/v2/experiments/{1}'.format(elabURL, experiment_id), headers={'Authorization': token})
    experiment = json.loads(response.text)
    # find schema id and data id

    schema_id, data_id = findJSONS_IDs(experiment)
    if schema_id == None:
        return {"status": 404, "message": "no json files were found", "experiment_id": experiment_id}
    else:
        response = requests.get(
            '{0}/api/v2/experiments/{1}/uploads/{2}?format=binary'.format(elabURL, experiment_id, schema_id), headers={'Authorization': token})

        json_schema = json.loads(response.text)

        response = requests.get(
            '{0}/api/v2/experiments/{1}/uploads/{2}?format=binary'.format(elabURL, experiment_id, data_id), headers={'Authorization': token})

        json_data = json.loads(response.text)

        return {"status": 200, "json_schema": json_schema, "json_data": json_data,  "experiment_id":experiment_id}


@app.route('/api/update_experiment', methods=['POST'])
def update_experiment():
    ensure_temp_files_dir()
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    json_schema = request.form['new_schema']
    json_data = request.form['new_data']
    desc_list = request.form['desc_list']
    experiment_id = request.form['experiment_id']
    # read experiment
    response = requests.get(
        '{0}/api/v2/experiments/{1}'.format(elabURL, experiment_id), headers={'Authorization': token})
    experiment = json.loads(response.text)
    # find schema id and data id

    schema_id, data_id = findJSONS_IDs(experiment)
    schema_item_id, data_item_id = findJSONS_item_IDs(experiment)

    jsdata = json.loads(json_data)
    jsschema = json.loads(json_schema)

    # patch the schema
    with open('temp-files//json_schema.json', 'w') as outfile:
        outfile.write(json.dumps(jsschema))
    with open('temp-files//json_schema.json', 'rb') as data:
        params = {'file': data}

        headers = {'Authorization': token}
        kwargs = {'headers': headers, 'files': params,
                  'verify': True, 'proxies': None}
        res = requests.post(
            '{0}/api/v2/experiments/{1}/uploads/{2}'.format(elabURL, experiment_id, schema_id), **kwargs)
        #res = json.loads(res.text)
        print(res)

    # patch form data/jsdata
    with open('temp-files//json_data.json', 'w') as outfile:
        outfile.write(json.dumps(jsdata))
    with open('temp-files//json_data.json', 'rb') as data:
        params = {'file': data}
        
        headers = {'Authorization': token }
        kwargs = {'headers': headers, 'files': params,
                  'verify': True, 'proxies': None}
        res = requests.post('{0}/api/v2/experiments/{1}/uploads/{2}'.format(elabURL, experiment_id, data_id), **kwargs)
        #res = json.loads(res.text)
        print(res)

    # now delete everything in temp-files directory
    dir = './temp-files'
    for f in os.listdir(dir):
        os.remove(os.path.join(dir, f))
    return {"status": 200, "message": "Experiment successfully updated"}

@app.route('/api/elab/schemas_list', methods=['POST'])
def elab_schemas_list():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    folder_name = request.form['folderName']
    try:
        response = requests.get(
            '{0}/api/v2/items'.format(elabURL),
            headers={'Authorization': token},
            params={'q': folder_name},
        )
        items = response.json()
        matched = next((i for i in items if i.get('title') == folder_name), None)
        if matched is None:
            return {"status": 404, "message": "No eLabFTW item titled '{0}' was found.".format(folder_name)}

        item_id = matched['id']
        entries = list_item_json_uploads(elabURL, token, item_id)
        return {"status": 200, "itemId": item_id, "entries": entries}
    except Exception as e:
        print(f"Error in elab_schemas_list: {e}")
        return {"status": 500, "message": "Unable to list schemas from eLabFTW."}


@app.route('/api/elab/schemas_read', methods=['POST'])
def elab_schemas_read():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    item_id = request.form['itemId']
    upload_id = request.form['uploadId']
    try:
        response = requests.get(
            '{0}/api/v2/items/{1}/uploads/{2}?format=binary'.format(elabURL, item_id, upload_id),
            headers={'Authorization': token},
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in elab_schemas_read: {e}")
        return {"status": 500, "message": "Unable to read this schema from eLabFTW."}


@app.route('/api/elab/categories_list', methods=['POST'])
def elab_categories_list():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    try:
        response = requests.get(
            '{0}/api/v2/items_categories'.format(elabURL),
            headers={'Authorization': token},
        )
        categories = response.json()
        return {
            "status": 200,
            "categories": [
                {"id": c["id"], "title": c["title"], "color": c.get("color")}
                for c in categories
            ],
        }
    except Exception as e:
        print(f"Error in elab_categories_list: {e}")
        return {"status": 500, "message": "Unable to list categories from eLabFTW."}


@app.route('/api/elab/items_list', methods=['POST'])
def elab_items_list():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    category_id = request.form.get('categoryId')
    try:
        params = {'limit': 100}
        if category_id:
            params['category'] = category_id
        response = requests.get(
            '{0}/api/v2/items'.format(elabURL),
            headers={'Authorization': token},
            params=params,
        )
        items = response.json()
        return {
            "status": 200,
            "items": [{"id": i["id"], "title": i["title"]} for i in items],
            "truncated": len(items) >= 100,
        }
    except Exception as e:
        print(f"Error in elab_items_list: {e}")
        return {"status": 500, "message": "Unable to list items from eLabFTW."}


@app.route('/api/elab/item_uploads', methods=['POST'])
def elab_item_uploads():
    elabURL = request.form['eLabURL']
    token = request.form['eLabToken']
    item_id = request.form['itemId']
    try:
        entries = list_item_json_uploads(elabURL, token, item_id)
        return {"status": 200, "entries": entries}
    except Exception as e:
        print(f"Error in elab_item_uploads: {e}")
        return {"status": 500, "message": "Unable to list schemas from this eLabFTW item."}


@app.route('/api/nextcloud/login', methods=['POST'])
def nextcloud_login():
    nc_url = request.form['ncUrl']
    username = request.form['ncUsername']
    app_password = request.form['ncAppPassword']
    try:
        display_name = nextcloud_utils.verify_login(nc_url, username, app_password)
    except Exception as e:
        print(f"Error in nextcloud_login: {e}")
        return {"status": 500, "message": "Unable to reach the NextCloud server."}

    if display_name is None:
        return {"status": 400, "message": "Invalid NextCloud URL, username, or app password."}

    return {"status": 200, "displayname": display_name}


@app.route('/api/nextcloud/list', methods=['POST'])
def nextcloud_list():
    nc_url = request.form['ncUrl']
    username = request.form['ncUsername']
    app_password = request.form['ncAppPassword']
    path = request.form.get('path', '')
    try:
        entries = nextcloud_utils.list_directory(nc_url, username, app_password, path)
    except Exception as e:
        print(f"Error in nextcloud_list: {e}")
        return {"status": 500, "message": "Unable to list this NextCloud folder."}

    return {"status": 200, "path": path, "entries": entries}


@app.route('/api/nextcloud/read', methods=['POST'])
def nextcloud_read():
    nc_url = request.form['ncUrl']
    username = request.form['ncUsername']
    app_password = request.form['ncAppPassword']
    path = request.form['path']
    try:
        content = nextcloud_utils.read_file(nc_url, username, app_password, path)
        return json.loads(content)
    except Exception as e:
        print(f"Error in nextcloud_read: {e}")
        return {"status": 500, "message": "Unable to read this file from NextCloud."}


@app.route('/api/nextcloud/upload', methods=['POST'])
def nextcloud_upload():
    nc_url = request.form['ncUrl']
    username = request.form['ncUsername']
    app_password = request.form['ncAppPassword']
    target_path = request.form['targetPath'].strip("/")
    metadata = request.form['metadata']
    schema = request.form['schema']

    # basename-only, in case a caller sends something other than a bare filename -
    # the frontend already sanitizes this, this is defense in depth against path traversal
    metadata_filename = request.form.get('metadataFilename', 'metadata.json').strip()
    metadata_filename = os.path.basename(metadata_filename.replace('\\', '/')) or 'metadata.json'
    schema_filename = request.form.get('schemaFilename', 'schema.json').strip()
    schema_filename = os.path.basename(schema_filename.replace('\\', '/')) or 'schema.json'

    try:
        nextcloud_utils.make_directory(nc_url, username, app_password, target_path)
        nextcloud_utils.upload_file(nc_url, username, app_password, f"{target_path}/{metadata_filename}", metadata.encode('utf-8'))
        nextcloud_utils.upload_file(nc_url, username, app_password, f"{target_path}/{schema_filename}", schema.encode('utf-8'))

        uploaded_files = request.files.getlist('files')
        if uploaded_files:
            resources_path = f"{target_path}/resources"
            nextcloud_utils.make_directory(nc_url, username, app_password, resources_path)
            for file in uploaded_files:
                # basename-only, same as metadata/schema filenames above - defense in depth
                # against path traversal via a crafted upload filename
                safe_filename = os.path.basename((file.filename or "").replace('\\', '/'))
                if not safe_filename:
                    continue
                nextcloud_utils.upload_file(nc_url, username, app_password, f"{resources_path}/{safe_filename}", file.read())
    except Exception as e:
        print(f"Error in nextcloud_upload: {e}")
        return {"status": 500, "message": "Unable to upload the dataset to NextCloud."}

    return {"status": 200, "message": "Dataset uploaded to NextCloud."}


# Uncomment below for docker deployment
#if __name__ == "__main__":
#    app.run(debug=True, host="0.0.0.0", port=5000)
