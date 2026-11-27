# Adamant Administrator Manual

This guide is for whoever hosts Adamant: installing it, connecting it to NextCloud and eLabFTW, and fixing common problems. It assumes basic Docker knowledge. For using the app, see the [user manual](user-manual.md).

---

## Table of Contents

1. [How It Fits Together](#1-how-it-fits-together)
2. [Installing and Updating](#2-installing-and-updating)
3. [Configuration](#3-configuration)
4. [eLabFTW Setup](#4-elabftw-setup)
5. [NextCloud Setup](#5-nextcloud-setup)
6. [Built-in Schemas](#6-built-in-schemas)
7. [Verifying a Deployment](#7-verifying-a-deployment)
8. [Security Notes](#8-security-notes)
9. [Troubleshooting](#9-troubleshooting)
10. [Development Setup](#10-development-setup)

---

## 1. How It Fits Together

`docker-compose.yml` runs two containers:

| Container | Built from | What it does |
|---|---|---|
| `client` | `Dockerfile.client` | nginx serving the built front end. Forwards `/api` to the `api` container. Published on host port 3000. |
| `api` | `Dockerfile.server` | Flask backend (`backend/api.py`) under gunicorn on port 5000. Talks to eLabFTW and NextCloud. Not published to the host. |

The browser only talks to the `client` container, so no CORS setup is needed. The `client` waits until the `api` health check (`/api/check_mode`) passes before starting.

**Where changes take effect:**

| What you change | What you need to do |
|---|---|
| `src/local-conf.json` or `src/general-conf.json` | Rebuild the client. These are built into the JavaScript bundle. |
| Files in `backend/schemas/` | Nothing. The folder is mounted into the `api` container. |
| `backend/conf/jobrequest-conf.json` | Restart the `api` container. |
| Code (a new version) | Rebuild both images. See [Section 2](#2-installing-and-updating). |

Keep the backend at **one gunicorn worker**. It writes fixed file names into `temp-files/` and clears that folder after each eLabFTW submission, so several workers would overwrite each other's files.

---

## 2. Installing and Updating

**First install:**

```bash
git clone https://github.com/plasma-mds/adamant.git
cd adamant
cp src/local-conf.example.json src/local-conf.json   # then edit it, see Section 3
docker compose build
docker compose up -d
```

The app is then at `http://localhost:3000`. To use another port, change the `ports` mapping of the `client` service in `docker-compose.yml`. Both containers restart automatically after a reboot.

**Updating to a new version:**

```bash
git pull
docker compose build
docker compose up -d
```

The version number at the bottom of the page shows which version is running.

**After a config change only:**

```bash
docker compose build client
docker compose up -d client
```

---

## 3. Configuration

The front end reads two files, merged by `src/appConfig.js`. Values in `local-conf.json` override `general-conf.json`.

| File | In git? | Purpose |
|---|---|---|
| `src/general-conf.json` | Yes | Shared defaults. Do not put secrets here. |
| `src/local-conf.json` | No | Your institution's URLs and folders. Copy it from `src/local-conf.example.json`. If it is missing, the Docker build uses the example's placeholder values. |

| Key | File | Example | Purpose |
|---|---|---|---|
| `local-elab-url` | local | `https://elabftw.example.org` | Your institution's eLabFTW, offered as "eLabFTW" in the CONNECT menu. |
| `elab-internal-schemas-folder-name` | local | `Schemas` | Title of the eLabFTW item that holds shared schemas. See [Section 4](#4-elabftw-setup). |
| `nextcloud-url` | local | `https://nextcloud.example.org` | Your NextCloud server. |
| `nextcloud-schemas-folder-path` | local | `institute/adamant/schemas` | Folder holding shared schemas, relative to each user's own NextCloud files. See [Section 5](#5-nextcloud-setup). |
| `nextcloud-filename-field` | general | `URN` | Form field whose value names the uploaded metadata file (matched by key or title, ignoring case). Falls back to `metadata` if missing or empty. |
| `usecase-dialog` | general | `false` | `true` shows a start dialog for the job-request pages instead of the schema selector. Leave `false` for normal use. |

**Optional job-request email workflow.** The job-request pages (enabled by `usecase-dialog: true`) send emails using SMTP settings in `backend/conf/jobrequest-conf.json`. This file is not in git and not part of the image; without it the rest of the app works normally. See the `check_mode` and `submit_job_request` handlers in `backend/api.py` for its format.

---

## 4. eLabFTW Setup

1. **Use eLabFTW with API v2.** The backend has been tested with eLabFTW 5.3.10.
2. **Set `local-elab-url`** to the base URL, without a trailing slash.
3. **Create an item for shared schemas.** In eLabFTW's Database, create an item (any category) whose title is **exactly** the value of `elab-internal-schemas-folder-name`. Upper and lower case must match.
4. **Attach the schema files** to that item. Only files ending in `.json` are shown.

Users create their own API key in eLabFTW (Settings, API KEYS tab) and enter it when connecting. Read access is enough for loading schemas; write access is needed for "Create eLabFTW Experiment".

The **"eLabFTW (external)"** connection needs no setup. Users enter another instance's URL and their key themselves. The `api` container only has to be able to reach that server.

---

## 5. NextCloud Setup

1. **Set `nextcloud-url`** to the base URL.
2. **Create the schema folder** given in `nextcloud-schemas-folder-path`. Adamant does not create it. The path is looked up in **each user's own** NextCloud files. To give everyone the same folder, share it under the same path, for example with NextCloud's Group Folders app.
3. **Put schema files** in that folder. Only `.json` files are shown; subfolders are ignored.

Users log in with an **app password** (NextCloud Settings, Security, Devices & sessions), not their account password.

Upload folders are chosen by users and created automatically if missing. Uploads are limited to **64 MB per dataset** by `client_max_body_size` in `deployment/nginx.default.conf`. To allow more, raise the value (it appears in each `location` block) and rebuild the client.

The `api` container must reach NextCloud's WebDAV (`remote.php/dav/files/`) and OCS (`ocs/v1.php`) endpoints. Both are on by default.

---

## 6. Built-in Schemas

The "Default" group in the schema selector comes from:

- **`backend/schemas/`** when the backend is reachable. Add or remove `.json` files there; changes show up without a restart. Subfolders are included.
- **`src/schemas/`** when the backend is unreachable (offline mode). To add one here, also import it in `src/pages/AdamantMain.jsx` and rebuild the client.

If your backend is always running, you only need to maintain `backend/schemas/`.

---

## 7. Verifying a Deployment

1. Open the app. The green **"Connection to server is established"** message means both containers are running and connected.
2. Check that the version at the bottom of the page is the one you expect.
3. In **CONNECT**, log in to eLabFTW and NextCloud.
4. In the schema selector, check that the eLabFTW and NextCloud groups list your shared schemas.
5. Load a schema, fill in a few fields and use **Submit Dataset to NextCloud** to confirm uploads work.

---

## 8. Security Notes

- **Credentials are not stored.** eLabFTW API keys and NextCloud app passwords go from the browser to the backend with each request and are not written to disk.
- **No secrets in git.** `general-conf.json` is committed. `local-conf.json`, `backend/conf/` and `.env` files are gitignored and excluded from Docker images by `.dockerignore`.
- **The backend calls whatever server URL it is given.** The external eLabFTW connection, and any modified client, can make the `api` container send requests to any address. If your network needs strict outgoing rules, apply them to the `api` container.
- **Separate hosting needs CORS.** If you host the front end and backend on different domains instead of behind one nginx, you must add CORS handling yourself.
- **Dependencies:** [dependency-audit.md](dependency-audit.md) records the last `npm audit` review.

---

## 9. Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| No green "Connection to server is established" message | The `api` container is not running or unhealthy. Check `docker compose ps` and `docker compose logs api`. |
| eLabFTW or NextCloud login fails | Wrong URL in `local-conf.json`, or the `api` container cannot reach that server. |
| "No eLabFTW item titled '...' was found" | No item's title matches `elab-internal-schemas-folder-name` exactly. |
| "Unable to list this NextCloud folder" right after login | The folder in `nextcloud-schemas-folder-path` does not exist in that user's NextCloud. Create or share it. |
| A schema file is not listed | It does not end in `.json`, or (NextCloud) it is inside a subfolder. |
| Large NextCloud uploads fail | Over 64 MB. Raise `client_max_body_size` and rebuild the client. |
| Long operations fail with a 502 or 504 error | Requests time out after 300 seconds. Check `docker compose logs api`. If needed, raise `proxy_read_timeout` and `proxy_send_timeout` in the nginx config and `--timeout` in `Dockerfile.server` together. |
| A config change has no effect | The client was restarted but not rebuilt. Run `docker compose build client` and `docker compose up -d client`. |
| Fixes from a new version are missing | The containers still run old images. Run `git pull`, `docker compose build` and `docker compose up -d`, then check the version at the bottom of the page. |

---

## 10. Development Setup

For testing changes before building images. Requires Node.js 22 and Python 3.12 (the versions used in the Docker images).

```bash
git clone https://github.com/plasma-mds/adamant.git
cd adamant
npm install --legacy-peer-deps
cp src/local-conf.example.json src/local-conf.json

cd backend
python -m venv venv
./venv/Scripts/activate        # Linux/macOS: source venv/bin/activate
mkdir temp-files
pip install -r requirements.txt
cd ..

npm run start-api              # backend (Windows only)
npm start                      # front end, in a second terminal
```

On Linux or macOS, start the backend from `backend/` with the virtual environment active: `flask --app api.py run --no-debugger`.

The app runs at `http://localhost:3000` and forwards `/api` to the backend on port 5000, as in production.

`--legacy-peer-deps` is always needed because `mathjax-react` declares an older React version than the project uses.

Before deploying changes, run the tests and a build:

```bash
npx vitest run
npx vite build
```
