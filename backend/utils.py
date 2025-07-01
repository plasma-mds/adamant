def get_key_from_value(d, val):
    keys = [k for k, v in d.items() if v == val]
    if keys:
        return keys[0]
    return None

def findJSONS_IDs(experiment):
    schema_id = None
    data_id = None

    uploads = experiment["uploads"]

    for i in range(len(uploads)):
        if uploads[i]["real_name"] == "json_schema.json":
            schema_id = uploads[i]["id"]
        if uploads[i]["real_name"] == "json_data.json":
            data_id = uploads[i]["id"]

    return schema_id, data_id


def findJSONS_item_IDs(experiment):
    schema_id = None
    data_id = None

    uploads = experiment["uploads"]

    for i in range(len(uploads)):
        if uploads[i]["real_name"] == "json_schema.json":
            schema_id = uploads[i]["item_id"]
        if uploads[i]["real_name"] == "json_data.json":
            data_id = uploads[i]["item_id"]

    return schema_id, data_id

def findBase64(data, prevKey, emptyArray):
    for key in data:
        if isinstance(data[key], list) and (type(data[key]) is dict):
            findBase64(data[key], prevKey+"-"+key, emptyArray)
        elif isinstance(data[key], dict):
            findBase64(data[key], prevKey+"-"+key, emptyArray)
        elif isinstance(data[key], list):
            for i in range(0, len(data[key])):
                findBase64(data[key][i], key+"-"+str(i+1), emptyArray)
        else:
            if isinstance(data[key], str):
                if data[key].startswith("data:") and ("base64" in data[key]):
                    print("found data")
                    emptyArray.append({"key": key, "data": data[key]})

    return emptyArray


# find the value of requesterKeyword
def findRequesterEmail(jsdata, requesterKeyword, result):
    for key in jsdata:
        if key == requesterKeyword:
            result = jsdata[key]
        if isinstance(jsdata[key], dict):
            result = findRequesterEmail(jsdata[key], requesterKeyword, result)
    return result


# find the value of operator Keyword
def findOperatorName(jsdata, operatorKeyword, result):
    for key in jsdata:
        if key == operatorKeyword:
            result = jsdata[key]
        if isinstance(jsdata[key], dict):
            result = findOperatorName(jsdata[key], operatorKeyword, result)
    return result


# find the falue of requesterNameKeyword
def findRequesterName(jsdata, requesterNameKeyword, result):
    for key in jsdata:
        if key == requesterNameKeyword:
            result = jsdata[key]
        if isinstance(jsdata[key], dict):
            result = findRequesterName(
                jsdata[key], requesterNameKeyword, result)
    return result