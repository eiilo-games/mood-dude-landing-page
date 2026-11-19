# Mood Dude — website

The site for the Mood Dude series at `mooddude.app`: the three games (Mood
Dude, Mood Dude: Infinity, Mood Dude: Adventures), a privacy
policy for each game and one for the site itself, and terms and conditions
for each game, with every past version kept online.

Plain static files, no build step, no third-party requests. Served by GitHub
Pages from the root of this repository. The games live in the `mood-dude`,
`mood-dude-infinity` and `mood-dude-adventures` repositories.

```
index.html                  home: running-dude hero, the three games
strip.js                    the hero's canvas: the dude runs, tap to jump, mood buttons recolour the ground
dude.js                     the dude who wanders along the bottom of every page; click him or press 1/2/3 to change mood
lightbox.js                 screenshot viewer: each .shots link opens a swipeable full-screen carousel of its game's shots
style.css                   one stylesheet for every page
/privacy/index.html          list of every policy, its effective date and version count
/privacy/index.html<name>/index.html   the policy in effect (link this URL in Play Console)
/privacy/index.html<name>/<date>.html  earlier versions, named by the date they took effect (noindex)
tools/policy.mjs            new policy versions, and a consistency check
/terms/index.html           list of every game's terms, their effective date and version count
/terms/<name>/index.html    the terms in effect (give this URL to the stores)
/terms/<name>/<date>.html   earlier versions, named by the date they took effect (noindex)
tools/terms.mjs             new terms versions, and a consistency check
img/                        sprites, tiles and mood icons from the games, screenshots, the two store badges
favicon.ico, apple-touch-icon.png   site icons; per-page square favicons in img/favicon/
fonts/                      Kenney Blocks / Future (CC0) and Atkinson Hyperlegible (OFL), self-hosted
app-ads.txt                 AdMob authorised-seller line; must be served at the domain root
404.html, robots.txt, sitemap.xml, CNAME, .nojekyll
```

Policies today: `mood-dude`, `mood-dude-infinity`, `mood-dude-adventures`
and `website`.

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

To add a policy for a new game, copy the closest existing policy
to `/privacy/<name>/`, rewrite it with one `First version.` row,
then add it to `/privacy/index.html` (with `data-policy` and `data-count`
markers like the others), to `sitemap.xml`, and to the footers.

The tool relies on a few markers in each policy page; keep them when editing:
`<time class="effective" datetime="…">`, `<tbody data-versions>` and the one
`<tr data-current>` row.

## Terms and conditions

Each game has its own terms and conditions (French law; the publisher's
trader details), kept exactly like the privacy policies: `terms/<name>/index.html`
is the version in effect, each earlier version is archived next to it as
`<its effective date>.html` (noindex), and `/terms/index.html` lists them all.
The website itself has no terms. Terms today: `mood-dude`,
`mood-dude-infinity` and `mood-dude-adventures`.

Never edit a live version in place. Start a new version:

```sh
node tools/terms.mjs new mood-dude-adventures 2026-12-01 "Added a new pack."
```

This archives the current `index.html` as `<its effective date>.html`
(`noindex`, no canonical or `og:url`, an "old version" notice where the
`<!-- archived-notice -->` marker is), moves `index.html` to the new date,
adds a row on top of its "Changes and past versions" table, and updates the
date and version count on `/terms/index.html` and `lastmod` in
`sitemap.xml`. Then edit `terms/<name>/index.html` with the new wording, and
check:

```sh
node tools/terms.mjs check   # every archive linked, dates consistent, hub up to date, no placeholders left
node tools/terms.mjs list    # each game's terms, effective date and past versions
```

Publish new terms before the app version that needs them ships (for
example a new kind of purchase). The markers the tool relies on are listed at
the top of `tools/terms.mjs`; keep them when editing: `<time
class="effective" datetime="…">`, `<!-- archived-notice -->`, `<tbody
data-versions>` with its one `<tr data-current>` row, and on the hub the
`data-terms` and `data-count` markers.

The URLs to give Google Play, App Store Connect (the EULA / licence
agreement field) and the trader (EU DSA) declarations:
`https://mooddude.app/terms/mood-dude`,
`https://mooddude.app/terms/mood-dude-infinity` and
`https://mooddude.app/terms/mood-dude-adventures`.

## Before going live

- The Google Play buttons point at `com.eiilo.games.mooddude`,
  `com.eiilo.games.mooddudeinfinity` and `com.eiilo.games.mooddudeadventures`,
  which 404 until each is published.
- The Adventures policy (26 October 2026, first version, rewritten before
  it was ever published) covers AdMob ads (banners on the title, map and
  store, interstitials, rewarded: continue, double coins, a free crystal
  and a Daily Gift each once per 24 hours), the consent form behind the
  gear on the title screen, Google Analytics for Firebase, Play Games
  trophies from the trophy button (no leaderboard) and Play Billing
  purchases, restored automatically at launch. Crash reporting or a
  leaderboard would need a new version first (`tools/policy.mjs new`).
- Both games show AdMob ads and use Google Analytics for Firebase; the
  policies describe that setup (the same as Trappy Flump). Check the ad
  placements and the consent ("privacy option in the app's settings")
  wording against the games once ads are in.
- `app-ads.txt` holds the same eiilo AdMob publisher line as Trappy Flump.
  AdMob only checks the root of the developer website set in Play Console,
  so set `https://mooddude.app` there for every game.
- The terms pages still hold four placeholders: `[[TRADER_NAME]]`,
  `[[TRADER_ADDRESS]]`, `[[TRADER_REGISTRATION]]` (the same trader details
  as declared to Google Play and Apple) and `[[CONSUMER_MEDIATOR]]` (the
  consumer mediator's name and website). `node tools/terms.mjs check` fails
  until they are filled in, in all three games. The terms say they take
  effect on 14 November 2026; as long as no archived version exists yet, that
  date may be moved by hand to the real first-publication date (the
  `<time class="effective">` line, the `(this version)` row, the hub's
  `data-terms` date and the sitemap `lastmod`), then run `check`.
- Paste each game's policy URL into its Play Console store listing:
  `https://mooddude.app/privacy/mood-dude`,
  `https://mooddude.app/privacy/mood-dude-infinity` and
  `https://mooddude.app/privacy/mood-dude-adventures`.

## Store badges

Every game is on both stores. Each game card has a `.stores` row with two
badges, the App Store one first:

- Mood Dude: `https://apps.apple.com/app/mood-dude-color-switch/id6829543306`
  (on the App Store the game is called "Mood Dude: Color Switch", because
  "Mood Dude" was taken; the card says so and the JSON-LD has it as
  `alternateName`) and `com.eiilo.games.mooddude` on Google Play.
- Mood Dude: Infinity: `https://apps.apple.com/app/mood-dude-infinity/id6829543585`
  and `com.eiilo.games.mooddudeinfinity`.
- Mood Dude: Adventures: `https://apps.apple.com/app/mood-dude-adventures/id6829543664`
  and `com.eiilo.games.mooddudeadventures`.

The App Store links carry no country code, so Apple sends each visitor to
their own storefront. To check an app is live (the store page itself answers
429 to `curl`): `curl -s "https://itunes.apple.com/lookup?id=6829543306&country=us"`.

`img/app-store.svg` is Apple's own "Download on the App Store" badge (black,
US-UK), downloaded unchanged from
`https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg`
and served from this site like everything else. `img/google-play.png` is
Google's. The stores' badge rules, which `style.css` ("Store badges")
follows: artwork unaltered, both badges the same height, the App Store badge
first, clear space of a quarter of the badge height around it, never under
40px tall. The pair shrinks together to stay on one row in a narrow column
and stacks below a 44px height. The credit lines the stores ask for are in
the home page footer (`.marks`).

The iPhone and iPad versions have no Google Play Games (so no leaderboard,
and trophies stay in the game's own list) and Adventures sells nothing for
real money there. The cards say "on Android" wherever that matters; update
them when an iOS update adds Game Center or purchases.

The website policy's "Links to other sites" section names the store buttons:
adding or removing a store is a new version of it
(`node tools/policy.mjs new website <date> "…"`).

## Deploy

GitHub Pages: Settings > Pages > Deploy from a branch, branch `main`, folder
`/ (root)`. `CNAME` holds `mooddude.app`; point the domain's DNS at GitHub
Pages. If the site is hosted somewhere else, update the "Hosting and server
logs" section of the website policy (with a new version).

## Assets

Sprites, tiles, mood icons and the Kenney fonts come from the games and are
Kenney's (CC0). Screenshots are captured with each game's
`tools/screenshot.gd`. Adventures captures at 1152×648, so its `mda-*`
shots are a 972×648 crop resized to 960×640 (`level@column` drops the dude
mid-level; wait for the level-name card to fade first). The ground tiles in `img/tiles/` are 64×32 crops of
`mood-dude/assets/tiles/bricks.png`: a face tile, then a plain one.

`img/social.png` is the 1200×630 share image (`og:image` on every page),
cropped from `mdi-run.webp`:

```sh
magick img/shots/mdi-run.webp -resize 1200x800 -gravity south -crop 1200x630+0+0 +repage -strip img/social.png
```

## SEO

Every indexable page has a title, description, canonical URL, Open Graph
and Twitter card tags. The home page also has JSON-LD (`WebSite`,
`Organization`, and a `VideoGame` + `MobileApplication` per released game, with both
platforms in `gamePlatform` and `operatingSystem` and both store links in
`installUrl`); add one there when a game launches. `sitemap.xml` lists every current page,
with the screenshots as image entries; bump a page's `lastmod` when you
change it. Old policy and terms versions stay out of it (they are `noindex`).
