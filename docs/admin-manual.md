# Adamant Administrator Manual

This guide is for whoever hosts Adamant for an institution or lab: installing it, wiring it up to a NextCloud and/or eLabFTW instance, and knowing what to check when something doesn't connect. It assumes familiarity with Docker and basic web server concepts. For a walkthrough of the application itself, see [`user-manual.md`](user-manual.md).

---

## Table of Contents

1. [Architecture at a Glance](#1-architecture-at-a-glance)
2. [Installing with Docker Compose](#2-installing-with-docker-compose)
3. [Installing from Source (Development)](#3-installing-from-source-development)
4. [Configuration Reference](#4-configuration-reference)
5. [eLabFTW Setup Checklist](#5-elabftw-setup-checklist)
6. [NextCloud Setup Checklist](#6-nextcloud-setup-checklist)
7. [Managing the Built-in Schema List](#7-managing-the-built-in-schema-list)
8. [Optional: Job-Request Email Workflow](#8-optional-job-request-email-workflow)
9. [Verifying a Deployment](#9-verifying-a-deployment)
10. [Security Notes](#10-security-notes)
11. [Troubleshooting](#11-troubleshooting)

---

## 1. Architecture at a Glance

Adamant is two containers behind one nginx front door:

| Component | Built from | Runs as | Notes |
|---|---|---|---|
| **Client** | `Dockerfile.client` | nginx serving a static Vite build (`dist/`) | Built with `node:22-alpine`. `deployment/nginx.default.conf` serves the app and reverse-proxies `/api` to the backend. |
| **Server** | `Dockerfile.server` | `gunicorn` running the Flask app (`backend/api.py`) on port 5000, one sync worker, 300-second request timeout | Built with `python:3.12`. Talks to eLabFTW (API v2) and NextCloud (WebDAV/OCS) on the backend's behalf. |

The server deliberately runs a **single worker**. `api.py` writes fixed filenames into `temp-files/` and then clears that whole directory after each experiment submission, so two concurrent workers would overwrite and delete each other's files. Don't raise `--workers` in `Dockerfile.server` until that code path uses per-request temporary files. The 300-second timeout matches `proxy_read_timeout` in nginx, so a slow NextCloud or eLabFTW call fails at the same point regardless of which layer times out first.

`docker-compose.yml` builds both and wires them together: nginx's `/api` location proxies to `http://api:5000` using the Docker Compose service name, so no CORS configuration is needed, the browser only ever talks to the client's origin. Only the client's port (`3000:80` by default) is published to the host; the API container isn't exposed directly.

Two things worth knowing up front because they affect how config changes take effect:
- **Client-side config is baked into the build.** The front-end config file (`src/local-conf.json`, see [Section 4](#4-configuration-reference)) is read by Vite at build time and inlined into the JavaScript bundle. Changing it requires rebuilding the client image, there's no volume mount for it and no way to change it by restarting the running container.
- **Backend config is volume-mounted and read at request time.** `docker-compose.yml` mounts `./backend/conf` and `./backend/schemas` into the API container, so changes there (see [Sections 7](#7-managing-the-built-in-schema-list) and [8](#8-optional-job-request-email-workflow)) take effect without a rebuild.

---

## 2. Installing with Docker Compose

```bash
git clone https://github.com/csihda/adamant.git
cd adamant
cp src/local-conf.example.json src/local-conf.json   # then edit it - see Section 4
docker compose build
docker compose up -d
```

By default the app is reachable at `http://localhost:3000`. Change the published port by editing the `ports` mapping under the `client` service in `docker-compose.yml`. Both services restart automatically after a host reboot (`restart: unless-stopped`).

`.dockerignore` keeps `node_modules`, `backend/venv`, `backend/conf` (which can hold SMTP credentials), and `.env` files out of the build context, so they're never baked into an image.

To pick up a config change (`src/local-conf.json`, or `general-conf.json` if you edit the shared defaults), rebuild the client image and recreate the container:

```bash
docker compose build client
docker compose up -d client
```

`backend/conf/jobrequest-conf.json` and files under `backend/schemas/` don't need a rebuild, they're bind-mounted, so editing them on the host and (for schema files) doing nothing further, or restarting the `api` container for config file changes, is enough.

---

## 3. Installing from Source (Development)

Useful for testing config changes or patches before building images. The Node/Python versions below are what the Docker images actually use; treat them as the source of truth over any older version notes elsewhere in the repo.

```bash
git clone https://github.com/csihda/adamant.git
cd adamant
npm install --legacy-peer-deps
cp src/local-conf.example.json src/local-conf.json   # then edit it - see Section 4

cd backend
python -m venv venv
./venv/Scripts/activate   # Windows; use `source venv/bin/activate` on Linux/macOS
mkdir temp-files
pip install -r requirements.txt
cd ..

npm run start-api    # Windows only: starts the Flask backend (script hardcodes venv\Scripts\flask)
npm start             # in a second terminal - starts the Vite dev server
```

On Linux or macOS, skip `npm run start-api` and instead, from `backend/` with the venv active, run `flask --app api.py run --no-debugger`.

The dev server (`vite.config.js`) proxies `/api` to `http://127.0.0.1:5000`, matching nginx's behavior in production, so the same `local-conf.json` and backend config apply in both setups. The app is reachable at `http://localhost:3000`.

`--legacy-peer-deps` is required for every `npm install` in this repo: `mathjax-react@1.0.6` declares a peer dependency on React ^15/^16 while the project uses React 17. This is expected and already accounted for in `Dockerfile.client`.

---

## 4. Configuration Reference

Front-end configuration is split across two files, merged by `src/appConfig.js`:

| File | Tracked in git? | Purpose |
|---|---|---|
| `src/general-conf.json` | Yes | Shared defaults, safe to commit. Currently just `usecase-dialog`. |
| `src/local-conf.json` | No, gitignored | Deployment-specific values: your institution's server URLs and folder paths. Copy it from `src/local-conf.example.json`. |

`appConfig.js` spreads `general-conf.json` then `local-conf.json` on top, so a key present in both takes its value from `local-conf.json`. If `src/local-conf.json` doesn't exist, the app still builds, those keys just come back `undefined`, and any feature depending on them (NextCloud, the pre-configured eLabFTW connection) has nothing to connect to.

### Key reference

| Key | File | Example | Used for |
|---|---|---|---|
| `local-elab-url` | `local-conf.json` | `https://elabftw.example.org` | The pre-configured "eLabFTW" connection users see in the CONNECT menu and schema selector. Left unset, that connection option has no server to reach. |
| `nextcloud-url` | `local-conf.json` | `https://nextcloud.example.org` | The NextCloud server users connect to. |
| `elab-internal-schemas-folder-name` | `local-conf.json` | `Schemas` | The title of the eLabFTW Item that holds shared schema files. See [Section 5](#5-elabftw-setup-checklist). |
| `nextcloud-schemas-folder-path` | `local-conf.json` | `institute/adamant/schemas` | Folder path (relative to each connecting user's own NextCloud files root) that holds shared schema files. See [Section 6](#6-nextcloud-setup-checklist). |
| `nextcloud-filename-field` | `general-conf.json` | `URN` | Schema field whose value names the metadata file on NextCloud (matched against the field's key or title, case-insensitively). If the schema has no such field or it's empty, the name falls back to `metadata`. |
| `usecase-dialog` | `general-conf.json` | `false` | When `true`, shows a landing dialog offering the job-request workflows (browse/edit experiment, request analysis, process request) instead of going straight to the schema selector. Leave `false` for a plain metadata-form deployment. |

There is no support for an "external" eLabFTW instance in this config, by design, that connection is entirely user-supplied at login time (URL, email, token), so it needs no server-side setup at all beyond the network reachability noted in [Section 10](#10-security-notes).

---

## 5. eLabFTW Setup Checklist

- **Confirm API v2 support.** The backend calls `{elabURL}/api/v2/...` exclusively. `README.md` notes the backend has been exercised against eLabFTW v5.3.10; any eLabFTW version exposing API v2 should work.
- **Set `local-elab-url`** to the instance's base URL (no trailing slash assumptions are made elsewhere in the code, but keeping it bare avoids double-slash edge cases).
- **Create an Item to hold shared schemas.** In eLabFTW, create a database item (any category) whose **title exactly matches** `elab-internal-schemas-folder-name`. Adamant's schema-list endpoint searches `/api/v2/items` for a title match and 404s with "No eLabFTW item titled '…' was found" if none matches, the match is case-sensitive and exact, not a substring search.
- **Upload schema files as attachments** ("uploads") on that Item. Only attachments ending in `.json` are offered in the schema selector's eLabFTW group; anything else is filtered out silently.
- **Tokens are per-user, never stored server-side.** Each person generates their own API token from their own eLabFTW profile (Control Panel → API keys) and enters it at login in Adamant. The backend receives it per-request and doesn't persist it. It needs enough permission to read Items and their Uploads for browsing, and to create Experiments if you expect users to use "Create eLabFTW Experiment".
- **The "eLabFTW (external)" connection needs none of the above configured.** Users type a different instance's URL and their own token for it directly into that dialog. All that's required on your end is that your Adamant backend can reach that instance over the network, see [Section 10](#10-security-notes).

---

## 6. NextCloud Setup Checklist

- **Set `nextcloud-url`** to the NextCloud server's base URL.
- **Decide a shared schema folder path** and set `nextcloud-schemas-folder-path` to it. This path is resolved per connecting user, relative to *their own* WebDAV files root (`remote.php/dav/files/<username>/...`), it is not a single shared location unless you also use NextCloud's own Group Folders app to make that same relative path resolve to a shared folder for every relevant user.
- **Create `nextcloud-schemas-folder-path` before anyone tries to browse it.** Listing a folder uses a WebDAV `PROPFIND`; if it doesn't exist, that call fails and users see "Unable to list schemas from NextCloud" even though their login is fine. This is a separate concern from where users *upload* datasets: that destination folder is chosen by the user each time through the "Browse" picker, and Adamant auto-creates it if missing (`MKCOL`), so a working dataset upload elsewhere doesn't mean the schema-list folder itself exists yet.
- **Only `.json` files** in that folder are offered as schemas; subfolders and other file types are filtered out.
- **App passwords, not account passwords.** Each user generates an app password under NextCloud's *Settings → Security → Devices & sessions*, names it (e.g. "Adamant"), and uses that, never their real account password, at login. Like eLabFTW tokens, this is per-request from the browser to the backend and isn't stored server-side.
- **WebDAV and the OCS API must be reachable** from the Adamant backend (login verification uses `ocs/v1.php/cloud/users/{username}`; everything else uses WebDAV under `remote.php/dav/files/`). Both are enabled by default on a stock NextCloud install.
- **Upload size is capped by nginx**, not the backend: `deployment/nginx.default.conf` sets `client_max_body_size 64M` for the client container, which also bounds how large a dataset (metadata + schema + attached resource files) can be uploaded to NextCloud in one request. Raise that value and rebuild the client image if your users need to attach larger files.

---

## 7. Managing the Built-in Schema List

The "Default" group in the schema selector has two independent sources, matching whether the front-end reached the backend:

- **Server available:** served from `backend/schemas/*.json`. This directory is bind-mounted (`docker-compose.yml`), so dropping a new `.json` file there is picked up immediately, no restart needed.
- **Server unreachable (offline mode):** falls back to the schemas bundled into the browser build, from `src/schemas/`. Adding a schema here also requires updating the schema-name list in `src/pages/AdamantMain.jsx` and rebuilding the client image, since (per [Section 1](#1-architecture-at-a-glance)) this path is baked into the JS bundle at build time.

If you only deploy with the backend always reachable, you can treat `backend/schemas/` as the single source of truth and not worry about the bundled fallback at all.

---

## 8. Optional: Job-Request Email Workflow

`backend/conf/jobrequest-conf.json` is a separate, optional feature (the "Browse/Edit Experiment", "Request Analysis", and "Process Request" pages, gated behind `usecase-dialog: true`) that emails a configured address when a job request is submitted, using SMTP settings inside that same file. It's gitignored and bind-mounted (`docker-compose.yml`), so it's entirely absent by default, with no negative effect on the rest of the app. `check_mode` (the endpoint behind the "connection established" banner) reports its own "offline mode" string when this file is missing, but that's unrelated to whether the backend itself is reachable, the banner in the app is driven purely by whether `check_mode` responds at all, not by its contents.

This document doesn't cover the file's schema in detail since it's a separate workflow from the core form-and-submit flow described in `user-manual.md`; read `backend/api.py`'s `check_mode`/`create_experiment`/`update_experiment` handlers if you need to stand it up.

---

## 9. Verifying a Deployment

- Open the app and confirm the green **"Connection to server is established"** notification appears, this means the client reached `/api/check_mode` through nginx, i.e. both containers are up and correctly networked.
- Open **CONNECT** and log into your configured eLabFTW and/or NextCloud instance to confirm credentials and network reachability end-to-end.
- Hover the **NextCloud**/**eLabFTW** groups in the schema selector to confirm the shared schema folder/Item is found and its `.json` files are listed.
- If you changed code or config, run the test suite and a production build before deploying:

```bash
npx vitest run   # see docs/dependency-audit.md for current pass count
npx vite build
```

---

## 10. Security Notes

- **No secrets belong in `general-conf.json`**, it's committed to the repository. Institution-specific URLs and any future secret-shaped values belong in the gitignored `local-conf.json`.
- **User credentials are never stored server-side.** eLabFTW tokens and NextCloud app passwords are sent from the browser to the backend per-request and used immediately; nothing is written to disk or a database on the server.
- **The NextCloud and eLabFTW (both internal and external) endpoints accept a server URL from the request and call it directly, with no server-side allowlist.** For the pre-configured connections this URL is fixed by your own `local-conf.json`, but the "eLabFTW (external)" flow and, in principle, a modified client could send any URL, the backend will make an outbound request to whatever it's given. If your deployment has strict egress requirements, account for this when setting network/firewall policy for the API container, since this is proxy-like behavior by design rather than a bug to patch.
- **No CORS configuration exists or is needed** in the reference nginx setup, since the browser only ever talks to the client's own origin and nginx proxies `/api` server-side. If you deploy the client and server on genuinely separate origins instead of behind one nginx host, you'll need to add CORS handling yourself, it isn't there today.
- See [`dependency-audit.md`](dependency-audit.md) for the current state of `npm audit` findings and how to re-run that process.

---

## 11. Troubleshooting

| Symptom | Likely cause |
|---|---|
| No green "Connection to server is established" banner | Client can't reach the API, check the `api` container is running and nginx's `/api` proxy target (`http://api:5000`) matches your Compose service name. |
| eLabFTW/NextCloud login fails with a generic error | Wrong `local-elab-url`/`nextcloud-url`, or the backend container can't reach that host over the network. |
| eLabFTW group shows "No eLabFTW item titled '…' was found" | No eLabFTW Item exists with a title exactly matching `elab-internal-schemas-folder-name` (case-sensitive, exact match). |
| NextCloud group shows "Unable to list schemas from NextCloud" but login succeeded | The folder at `nextcloud-schemas-folder-path` doesn't exist yet in that user's NextCloud space, create it (Adamant won't create it for you; only uploads auto-create folders). |
| A schema/data file doesn't show up in a NextCloud/eLabFTW list | It doesn't end in `.json`, or (NextCloud) it's a subfolder rather than a file, both are filtered out. |
| Upload to NextCloud fails only for large datasets | Raise `client_max_body_size` in `deployment/nginx.default.conf` and rebuild the client image. |
| A slow NextCloud/eLabFTW operation fails with a 502 or 504 error | Gives up after 300 seconds at either nginx or gunicorn. Check `docker compose logs api` for the underlying error; if the operation legitimately takes longer, raise both `proxy_read_timeout`/`proxy_send_timeout` (nginx) and `--timeout` (`Dockerfile.server`) together. |
| Edited `src/local-conf.json` but nothing changed | Client config is baked in at build time, rebuild and recreate the `client` container/image, not just restart it. |
| New file dropped into `backend/schemas/` doesn't appear | Confirm `docker-compose.yml`'s `./backend/schemas:/app/schemas` volume mount is actually in effect for your deployment method, if you're not using Docker Compose, this directory needs to be reachable by whatever process serves the backend. |
