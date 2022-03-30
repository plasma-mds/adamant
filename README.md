# <img src="https://raw.githubusercontent.com/plasma-mds/adamant/59c295d846e9cc140c01b308c07a2499c1eb8e39/src/assets/adamant-header-5.svg" alt="drawing" style="width:50%;"/>

Adamant is a JSON schema-based metadata creation tool presented in a user-friendly interface. Adamant aims to ease the integration of various research data management (RDM) workflows into the everyday research routine of especially small independent laboratories, which hopefully leads to the generation of research data that adhere to the FAIR (findable, accessible, interoperable, reusable) principles.
As of now, Adamant supports the following features:

- Rendering of interactive web-form based on a valid JSON schema
- User-friendly editing process of the rendered web-form and the corresponding schema
- Creating a valid JSON schema and web-form from scratch
- Live validation for various field types
- Quick re-use of existing schemas from a list
- Downloadable JSON schema and its form data
- API-based integration as various form submission functionalities

A live demo of Adamant (client only) is available at: https://plasma-mds.github.io/adamant/.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/plasma-mds/adamant/blob/main/LICENSE)

# Supported JSON schema keywords

Currently, Adamant supports the rendering and editing of JSON schemas with a specification version draft 4 and 7. The following table lists all the implemented JSON schema keywords in the current version of Adamant. Note that the `id` keyword only works with the JSON schema specification version draft 4, whereas `$id` is used for the newer specification drafts. Lastly, the `contentEncoding` keyword is intended to be used with the specification version draft 7 or newer.

| Field Type | Implemented Keywords                                                                                        | Note                                                            |
| ---------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| String     | `title`, `id`, `$id`, `description`, `type`, `enum`, `contentEncoding`, `default`, `minLength`, `maxLength` | `contentEncoding` can only receive a string value of `"base64"` |
| Number     | `title`, `id`, `$id`, `description`, `type`, `enum`, `default`, `minimum`, `maximum`                        |                                                                 |
| Integer    | `title`, `id`, `$id`, `description`, `type`, `enum`, `default`, `minimum`, `maximum`                        |                                                                 |
| Boolean    | `title`, `id`, `$id`, `description`, `type`, `default`                                                      |                                                                 |
| Array      | `title` , `id`, `$id`, `description`, `type`, `default`, `items`, `minItems`, `maxItems`, `uniqueItems`     |                                                                 |
| Object     | `title`, `id`, `$id`, `description`, `type`, `properties`, `required`                                       |                                                                 |

# Development

Setting up Adamant on a local machine for development:

- `$ git clone https://github.com/plasma-mds/adamant.git`—clone the repository
- `$ cd adamant`—go to adamant project directory
- `adamant$ npm install`—install the dependencies for the client-side
- `adamant$ cd backend`—go to backend directory
- `adamant/backend$ python -m venv venv`—create a python virtual environment
- `adamant/backend$ ./venv/Scripts/activate`—activate the virtual environment
- `adamant/backend$ pip install -r requirements.txt`—install the dependencies for the back-end
- `adamant/backend$ cd ..`—go back to adamant project directory
- `adamant$ yarn start-api`—start the back-end
- `adamant$ yarn start`—on a new terminal, in the adamant project directory, start the front-end

By default, Adamant is accessible at `http://localhost:3000`.

# Deployment

We recommend deploying Adamant with docker-compose, which can be done with ease:

- `$ git clone https://github.com/plasma-mds/adamant.git`—clone the repository
- `$ cd adamant`—go to adamant project directory
- `adamant$ docker−compose build`—build the docker images for both back-end and front-end
- `adamant$ docker−compose up -d`—start both client and server containers, i.e., the whole system

By default, the deployed system can be accessed at `http://localhost:3000`.

# Grant information

The work was funded by the Federal Ministry of Education and Research (BMBF) under the grant mark 16QK03A. The responsibility for the content of this repository lies with the authors.
