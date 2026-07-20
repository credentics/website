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

Outputs static HTML to `dist/`.

## Deploying

Deployed independently from the docs repo, but served from the same domain and the same Contabo box — Nginx routes `/docs` to the docs repo's build output and everything else to this repo's, via two `location` blocks in one server block (see the docs repo's README for the full Nginx config).

## CI/CD

Two GitHub Actions workflows:

- **`ci.yml`** — runs `npm run build` on every PR and every push to a non-`main` branch. Pure build check, no deploy.
- **`deploy.yml`** — on push to `main`, builds and `rsync`s `dist/` straight to the Contabo box.

`deploy.yml` needs these set in the repo's GitHub settings (Settings → Secrets and variables → Actions):

| Name | Type | Value |
|---|---|---|
| `DEPLOY_HOST` | Secret | Contabo server hostname/IP |
| `DEPLOY_USER` | Secret | `deploy` |
| `DEPLOY_SSH_KEY` | Secret | Private key for the `deploy` user (see below) |
| `DEPLOY_PATH` | Variable | `/var/www/credentics/dist` |

The `deploy` user is shared with the docs repo's deploy, but uses a **separate keypair per repo** so a leaked secret in one repo doesn't compromise the other. Retrieve this repo's key directly from the server rather than having it pass through any chat/AI tool:

```
ssh root@<server> cat /root/deploy_key_website
```

Paste that into the `DEPLOY_SSH_KEY` secret, then delete it from the server:

```
ssh root@<server> rm /root/deploy_key_website /root/deploy_key_website.pub
```

The workflow also targets a GitHub **environment** named `production` — optional protection (e.g. required reviewers before a deploy runs). Create one under Settings → Environments if you want that gate, or remove the `environment: production` line from `deploy.yml` if every push to `main` should deploy immediately.
