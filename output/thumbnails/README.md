# Thumbnails

`film.png` is the cover for the single full-course video (`scripts/out/film.mp4`): the **answer**
card on the **dark** theme. Rebuild it, or a variant, with:

```sh
npm run thumb:film                                                   # film.png
npm run thumb:film -- --source map --mark gcp --out output/thumbnails/film-map.png
npm run thumb:film -- --theme navy --out output/thumbnails/film-navy.png
```

`--source` is `answer` | `map`; `--mark` is `tile` | `gcp`; `--theme` is `dark` | `navy` | `light`.

Kept beside it: `film-map.png`, the finished map from §1.3 taken live from the app, with the
Google Cloud mark. At the ~168px
the feed renders, its labels are gone and it reads as coloured confetti, while the answer card
keeps "2,140 at 18:41" and the red EX-LDN-04 row readable.

## The mark: the repo's tile, or the Google Cloud mark

`--mark tile` (default) is `public/favicon.svg`, the GraphL concept tile. It names GCP only in
**text**, which is nominative use and needs no one's permission.

`--mark gcp` places Simple Icons' Google Cloud mark, vendored byte for byte at
`public/vendor/googlecloud-logo.svg`. It is the same mark graphl-flow draws for its `gcp` icon key.
It is a single-colour silhouette, not Google's four-colour logo. The file has no fill, so the script
paints it in Simple Icons' brand colour `#4285f4`. The script never draws or re-traces it, and fails
if the file is missing. `public/vendor/NOTICE-googlecloud-logo.txt` records where it came from:
Simple Icons gives no licence for this icon, and the mark is Google's trademark. Read Google's brand
guidelines and fill in the NOTICE before shipping a cover that wears it. This file is a design note,
not legal advice.

## The card is real, and states its level

Everything in the answer card is parsed from `spine/intro/02-two-clocks/session.txt` (§1.2),
`python answer/derby.py` over the night's raw events: the command, the live peak (households and
minute), and every exchange's buffering ratio, EX-LDN-04 drawn red. The script fails if a line is
missing, or if the first exchange is not the worst.

The card's tag is **`VIEWING-PULSE · RUNS LOCALLY`**: §1.2 is really run on one machine. §10.8's
derby card reaches the same answer through Gold, but that step is mocked, so it is not the
cover's source. COURSE-PLAN's invariant is that every frame states its verification level, and a
cover is not an exception.

## Why the film cover is not `graphl-thumb`

The shell's template is a per-course poster: a scene plus a text panel. Cropped into that panel, a
16:9 scene turns to mush at feed size. `thumb-film.mjs` (ported from azure-trade-finance) uses
poster grammar instead: few elements, enormous type, one focal object. Check every change by
downscaling to 168px. This concept publishes the film only, so there are no per-course covers.

## The colours and the guard

The accent is `--brand` from `src/theme.css`, Google blue `#4285f4` (`#1a73e8` on `light`). The
green and red are graphl-flow's tone palette, `store` `#37b877` and `consume` `#f0656f`, so the
card is painted the way the scenes are. `thumb-film.mjs` fails the build if any text overflows its
box or the card.
