# TheBizdom | BIZ of the wisDOM

This repo hosts the code for [thebizdom.in](https://thebizdom.in) on the `master` branch, built and served through GitHub Pages.

Theme: [Jekflix](https://github.com/thiagorossener/jekflix-template) (Jekyll), with a custom "ink & saffron" palette defined in `_sass/_theme.scss` (source of truth for local dev: `src/yml/theme.yml`).

## Environment 🔂

Before starting, make sure you have Ruby and NodeJS installed.

And install Gulp client:

```
$ npm install gulp-cli -g
```

## Installation 🔂

Clone this repo:

```
$ git clone https://github.com/sidart/bizdom.git
```

Access the local project:

```
$ cd bizdom
```

Install npm packages:

```
$ npm install
```

Install Ruby dependencies:

```
$ bundle install
```

Build Jekyll:

```
$ bundle exec jekyll build
```

## Local Server 🔁

After the steps above, to run Jekyll locally, you'll just need to run Gulp:

```
$ gulp
```

## Local Admin 🔁

After running Jekyll locally, you can manage content by opening your favourite browser at

```
http://localhost:8000/admin
```

> Note: the Decap/Netlify CMS admin (`admin/`) uses the `git-gateway` backend, which only works when the site is deployed on Netlify with Identity enabled. On GitHub Pages it won't authenticate — edit posts directly in `_posts/` or use `jekyll-admin` locally instead.

## GitHub Publish 🔁

After making changes, you'll just need to run Gulp build:

```
$ gulp build
```

Then commit your changes and push to GitHub. Every push/PR to `master` is also build-checked by GitHub Actions (`.github/workflows/jekyll-build.yml`).

## Notes for maintainers 📝

- **Analytics**: set your GA4 measurement ID (`G-XXXXXXXXXX`) in `src/yml/advanced.yml` (and mirror it in `_config.yml`). The old `UA-` ID no longer collects data.
- **Homepage pagination**: `paginate: 12` in `_config.yml` — older posts live at `/page/2/`, `/page/3/`, …
- **Post images**: store uploaded images in `assets/img/uploads/` and reference them as `/assets/img/uploads/<file>`. Older posts use Cloudinary URLs, which still works.
- **Multi-page posts**: separate sections with `--page-break--` in the post body (`jekyll-paginate-content`).
