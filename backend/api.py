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

app = Flask(__name__, static_folder='../build', static_url_path='/')  # for Gunicorn deployment
# app = Flask(__name__)
api = Api(app)

@app.route('/api/check_mode', methods=["GET"])
def check_mode():
    # check if online, and get list of schemas used in job request workflows
    listSchemas = []
    listSubmitText = []
    try:
        with open("./conf/jobrequest-conf.json", "r") as fi:
            f = fi.read()
            f = json.loads(f)
            emailconf_list = f["confList"]
            for element in emailconf_list:
                listSchemas.append(element["completeSchemaTitle"])
                listSchemas.append(element["requestSchemaTitle"])
                listSubmitText.append(element["submitButtonText"])
                listSubmitText.append(element["submitButtonText"])
        return {"message": "connection is a success", "jobRequestSchemaList": listSchemas, "submitButtonText": listSubmitText, "configs": emailconf_list}
    except Exception as e:
        return {"message": "connection is a success", "jobRequestSchemaList": listSchemas, "submitButtonText": listSubmitText, "configs": emailconf_list}


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
    params = {'title': title, 'body': '<h1><span style="font-size:14pt;">Goal :</span></h1>\n<p>\xa0</p>\n<h1><span style="font-size:14pt;">Procedure :</span></h1>\n<p>\xa0</p>\n<h1><span style="font-size:14pt;">Results :<br></span></h1>\n<p>\xa0</p>'}
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
    elabURL = request.form['elabURL']
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

# Uncomment below for docker deployment
#if __name__ == "__main__":
#    app.run(debug=True, host="0.0.0.0", port=5000)
