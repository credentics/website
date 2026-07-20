# credentics.io

Source for the Credentics marketing site — homepage, workshops, blog, and changelog. Built with [Astro](https://astro.build) + Tailwind.

Docs (`credentics.io/docs`) live in a separate repo: [`credentics/docs`](https://github.com/credentics/docs).

## Local development

```
npm install
npm run dev
```

Serves at `http://localhost:4321`.

## Build

```
npm run build
```

Outputs prerendered pages and client assets to `dist/client/`, plus the standalone Node server at `dist/server/entry.mjs`.

## Deploying

Deployed independently from the docs repo, but served from the same domain and the same Contabo box. Nginx keeps routing `/docs` to the docs repo's static build and proxies everything else to the website's standalone Astro Node service on `127.0.0.1:4321`.

Production releases are stored under `/var/www/credentics/releases/<commit>`. The `/var/www/credentics/current` symlink is switched only after dependencies have installed, and the deployment rolls back that symlink if the restarted service fails its health check. Runtime secrets live outside releases in `/var/www/credentics/shared/website.env`.

## CI/CD

Two GitHub Actions workflows:

- **`ci.yml`** — runs `npm run build` on every PR and every push to a non-`main` branch. Pure build check, no deploy.
- **`deploy.yml`** — on push to `main`, builds a versioned release, installs its runtime environment, atomically activates it, restarts the website service, and performs a local health check.

`deploy.yml` needs these set in the repo's GitHub settings (Settings → Secrets and variables → Actions):

| Name | Type | Value |
|---|---|---|
| `DEPLOY_HOST` | Secret | Contabo server hostname/IP |
| `DEPLOY_USER` | Secret | `deploy` |
| `DEPLOY_SSH_KEY` | Secret | Private key for the `deploy` user (see below) |
| `DEPLOY_PATH` | Secret | `/var/www/credentics/dist` (the workflow derives `/var/www/credentics` as its release root) |
| `CONTACT_WEBHOOK_URL` | Secret | Runtime destination for connection-form submissions |

The `deploy` user is shared with the docs repo's deploy, with a **separate keypair per repo** for independent rotation and auditing. These keys are not a hard isolation boundary while they authenticate as the same Linux user; use separate deployment users if the two sites need strict isolation. Retrieve this repo's key directly from the server rather than having it pass through any chat/AI tool:

```
ssh root@<server> cat /root/deploy_key_website
```

Paste that into the `DEPLOY_SSH_KEY` secret, then delete it from the server:

```
ssh root@<server> rm /root/deploy_key_website /root/deploy_key_website.pub
```

The workflow also targets a GitHub **environment** named `production` — optional protection (e.g. required reviewers before a deploy runs). Create one under Settings → Environments if you want that gate, or remove the `environment: production` line from `deploy.yml` if every push to `main` should deploy immediately.

The server-side files installed during the one-time bootstrap are kept in [`ops/`](ops/):

- `bootstrap-server.sh` — installs Node 22, directories, service permissions, and the proxy configuration without deploying or starting the application.
- `credentics-website.service` — systemd service for the standalone Astro server.
- `nginx-credentics.io.conf` — Nginx proxy and `/docs` routing.
- `credentics-website-deploy.sudoers` — narrowly scoped restart/status access for the deployment user.
- `known_hosts` — pinned production SSH host key used by the workflow.
