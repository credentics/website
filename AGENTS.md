## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Docs site

`credentics.io/docs` is served from a separate repo ([`credentics/docs`](https://github.com/credentics/docs), MkDocs + Material theme), deployed independently and routed onto `/docs` at the Nginx level on the same server. Nothing in this repo builds or references it — see that repo's README for build/deploy details.

## Deploy

Push to `main` triggers `.github/workflows/deploy.yml`, which builds and rsyncs to the Contabo server. See `README.md` for the required GitHub secrets/variables.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
