# Bundled review resources

`index.html` is independently viewable offline. It embeds:

- Poppins Regular and SemiBold from the existing approved V2 review sources.
  License: `../t22-profile-structure/source/Poppins-OFL.txt`.
- Installed Lucide Angular icon geometry. License:
  `../t22-profile-structure/source/Lucide-LICENSE`.
- The existing MehrChain `apps/mehrchain-frontend/public/assets/mero.png` identity
  asset, used as a static empty-state image rather than a replacement model.
- A QR image generated locally with the installed `qrcode` package, containing
  only a synthetic `example.invalid` URL; no real invitation token.

Build from the repository root:

```text
node design/ux/t34-chain-connect-show-up/build.cjs
```

This uses the already installed local esbuild, Lucide and qrcode packages and the
V2 font sources. No CDN, font service or other external request is required by
the built HTML. The prototype's mutable state lives only in the current page.
