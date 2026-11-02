# T55 — First-launch application styles

Date: 2026-11-02, Asia/Tehran. Local production loading repair only.
Local repair commit: `4ed3f04`.

## Owner observation versus established cause

The first owner screenshot shows an oversized Welcome mascot, unstyled buttons
and missing typography/colors. The owner reported intermittent first launches of
an installed PWA and explicitly has not tested APK. The phone's serving revision,
worker, CSS response and timing are unknown. A screenshot does not establish
cache corruption, an updater fault or a Three.js sizing cause.

The inspected production Angular configuration enabled `inlineCritical`. Its
generated document loaded the complete app stylesheet using:

```html
<link rel="stylesheet" href="styles-MGRSVELZ.css" media="print" onload="this.media='all'">
```

Its inline critical CSS cannot describe the complete dynamically rendered Angular
Welcome view. The app could start and display its mascot before the utility
stylesheet arrived. This code-level failure was reproduced locally by holding
only the stylesheet response; JS and Three.js continued loading normally.

## Separate repair

- Production style optimization keeps minification but sets `inlineCritical` to
  false. The emitted document uses a normal render-blocking stylesheet link.
  Complete styling arrives before application first paint/bootstrap.
- The Mero component independently bounds every size (40/56/80/128px and the
  responsive hero). Welcome uses the existing `min(14rem, 28svh)` square and
  short-window constraint inside component CSS, as well as the existing shell
  rule. Canvas intrinsic resolution cannot define the CSS layout box.
- `scripts/check-startup-styles.cjs` checks the emitted document and actual local
  CSS file, excluding noscript fallbacks. It rejects asynchronous print/onload
  application styles. This guards the production output, not only its config.

Tradeoff: initial paint waits for the full local stylesheet. A first install with
slow CSS may wait longer before displaying content, rather than showing an
interactive partially styled app. No auth, update-activation or service-worker
cache policy was changed. Failure to fetch CSS altogether is not solved by this
change and must not be described as accepted offline/PWA behavior.

## Executed delayed-response comparison

The pre-fix production output was copied to `tmp/mero-css-before`; the corrected
build was served from `dist/mehrchain-frontend/browser`. A loopback-only HTTP
fixture embedded a 390 x 750 frame, withheld requests for `styles-*.css`, and
provided a separate Release CSS control. No backend login or real account data.

| State | Pre-fix output | Corrected output |
| --- | --- | --- |
| App JS available, CSS deliberately held | Welcome DOM and mascot visible; title and bare buttons lacked utility styling | No incomplete Welcome content was painted |
| CSS explicitly released | Styling becomes available | Styled Welcome, correctly constrained mascot and full controls render |
| Emitted-document guard | Fails on the print/onload link (expected negative control) | Passes with one blocking stylesheet |

The baseline document SHA-256 was
`625b90251532da8e2a9b0ebf1384ff4440dac35828f840f67c6bfce6ecb1cbb2`
(`main-O4WI3EVO.js`, local output before this task's loading change).
The final corrected document SHA-256 is
`a1b316e4ea3917a5c6a8be6a048c6794dc601ed63939d29061704bdf4bee8703`
(`main-R36C4OKL.js`). Both builds used `styles-MGRSVELZ.css`. This isolates the loading contract from
the contents of the utility stylesheet; it is not a production build identity.

To repeat the comparison, produce two otherwise equivalent builds with critical
inlining enabled/disabled, serve each through a loopback response gate for only
the generated CSS, and inspect before and after releasing that gate. Do not block
JS or the Three.js chunk. A parent page with an iframe allows inspection while
the frame's load event is deliberately pending.

```sh
npm run build:frontend
node scripts/check-startup-styles.cjs
```

Both passed. The checker was also run against the copied pre-fix output and
rejected its onload link as intended. The related frontend run passed 69 tests
across 8 files. Existing build warnings concern QR-code CommonJS packaging and
Browserslist data; neither is a failed build or evidence about phone startup.

## Acceptance boundary

This establishes the local CSS race and its repair, not the exact cause of every
owner phone launch. Installed Android PWA first paint, worker identity and repeated
cold launches still require T56 (P1, after deploying T55). APK remains untested.
T52 continues to own update-notice/Reload comparisons and is not closed or
renamed by this repair. T30 continues to own Profile V2's original phone checks.

Roadmap validation also detected a pre-existing README language-check failure:
`e6551f0` had removed the preserved poem markers and altered its whitespace.
Only that exact hash-protected block and markers were restored from its parent;
the rest of the rewritten README was retained. The English-language/roadmap
validator then passed.
