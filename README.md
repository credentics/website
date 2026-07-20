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
