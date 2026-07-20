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
