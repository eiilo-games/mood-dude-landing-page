# Mood Dude — website

The site for the Mood Dude series at `mooddude.app`: the three games (Mood
Dude, Mood Dude: Infinity, Mood Dude: Adventures — coming soon), a privacy
policy for each game and one for the site itself, with every past version
kept online.

Plain static files, no build step, no third-party requests. Served by GitHub
Pages from the root of this repository. The games live in the `mood-dude`
and `mood-dude-infinity` repositories.

```
index.html                  home: running-dude hero, the three games
strip.js                    the hero's canvas: the dude runs, tap to jump, mood buttons recolour the ground
dude.js                     the dude who wanders along the bottom of every page; click him or press 1/2/3 to change mood
style.css                   one stylesheet for every page
/privacy/index.html          list of every policy, its effective date and version count
/privacy/index.html<name>/index.html   the policy in effect (link this URL in Play Console)
/privacy/index.html<name>/<date>.html  earlier versions, named by the date they took effect (noindex)
tools/policy.mjs            new policy versions, and a consistency check
img/                        sprites, tiles and mood icons from the games, screenshots
fonts/                      Kenney Blocks / Future (CC0) and Atkinson Hyperlegible (OFL), self-hosted
app-ads.txt                 AdMob authorised-seller line; must be served at the domain root
404.html, robots.txt, sitemap.xml, CNAME, .nojekyll
```

Policies today: `mood-dude`, `mood-dude-infinity` and `website`.

## Run locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Every internal link is root-absolute (`/privacy/mood-dude`, `/img/...`), so
pages work whether a server adds the trailing slash, drops it (clean-URL
servers like `npx serve`) or neither. The site must be served from the root
of a domain, as it is on `mooddude.app`. Link to policies as `/privacy/<name>`,
never with a relative path.

## Changing a privacy policy

Never edit a policy in place once it has been live. Start a new version:

```sh
node tools/policy.mjs new mood-dude-infinity 2026-12-01 "Added a remove-ads purchase."
```

This copies the current `index.html` to `<its effective date>.html` and marks
the copy as an old version: `noindex`, no canonical, and a notice saying when
it was in effect, with a link back to the current one. It then moves
`index.html` to the new date, adds a row on top of its "Changes and past
versions" table, and updates the date and version count on `/privacy/index.html`
and `lastmod` in `sitemap.xml`.

Then edit `/privacy/index.html<name>/index.html` with the new wording, and check:

```sh
node tools/policy.mjs check   # every archive linked, dates consistent, hub up to date
node tools/policy.mjs list    # each policy, its effective date and past versions
```

Publish the new policy before the app version that needs it ships, and
update the Play Console Data safety form to match.

To add a policy (Mood Dude: Adventures, say), copy `/privacy/mood-dude-infinity/index.html`
to `/privacy/mood-dude-adventures/`, rewrite it with one `First version.` row,
then add it to `/privacy/index.html` (with `data-policy` and `data-count`
markers like the others), to `sitemap.xml`, and to the footers.

The tool relies on a few markers in each policy page; keep them when editing:
`<time class="effective" datetime="…">`, `<tbody data-versions>` and the one
`<tr data-current>` row.

## Before going live

- The Google Play buttons point at `com.eiilo.games.mooddude` and
  `com.eiilo.games.mooddudeinfinity`, which 404 until each is published.
- Both games show AdMob ads and use Google Analytics for Firebase; the
  policies describe that setup (the same as Trappy Flump). Check the ad
  placements and the consent ("privacy option in the app's settings")
  wording against the games once ads are in.
- `app-ads.txt` holds the same eiilo AdMob publisher line as Trappy Flump.
  AdMob only checks the root of the developer website set in Play Console,
  so set `https://mooddude.app` there for both games.
- Paste each game's policy URL into its Play Console store listing:
  `https://mooddude.app/privacy/mood-dude` and
  `https://mooddude.app/privacy/mood-dude-infinity`.

## Deploy

GitHub Pages: Settings > Pages > Deploy from a branch, branch `main`, folder
`/ (root)`. `CNAME` holds `mooddude.app`; point the domain's DNS at GitHub
Pages. If the site is hosted somewhere else, update the "Hosting and server
logs" section of the website policy (with a new version).

## Assets

Sprites, tiles, mood icons and the Kenney fonts come from the games and are
Kenney's (CC0). Screenshots are captured with each game's
`tools/screenshot.gd`. The ground tiles in `img/tiles/` are 64×32 crops of
`mood-dude/assets/tiles/bricks.png`: a face tile, then a plain one.
