# Asset credits

Identity Defender serves every asset from this repository. Nothing is hotlinked.

## Third-party assets

| Asset | Creator | Official source | License | Files in this repo | Changes |
|---|---|---|---|---|---|
| **RPG Urban Pack 1.0** (16×16 campus tiles, animated characters, props, vehicles) | Kenney (www.kenney.nl) | https://kenney.nl/assets/rpg-urban-pack | CC0 1.0 (public domain dedication) | `assets/kenney-rpg-urban/tilemap_packed.png`, `assets/kenney-rpg-urban/License.txt` | The file is unchanged. At runtime the game scales it ×2–×4 (nearest neighbour), applies a cool evening tint to the map, and colour-tints a few characters to tell them apart. |
| **Game Icons** (29 white UI icons) | Kenney (www.kenney.nl) | https://kenney.nl/assets/game-icons | CC0 1.0, per the bundled `License.txt` | `assets/kenney-game-icons/*.png`, `assets/kenney-game-icons/License.txt` | None. They're displayed at 15 px in the interface. |
| **Kenney Fonts**: Kenney Pixel, Kenney Future | Kenney (www.kenney.nl) | https://kenney.nl/assets/kenney-fonts | CC0 1.0, per the bundled `License.txt` | `assets/kenney-fonts/KenneyPixel.ttf`, `assets/kenney-fonts/KenneyFuture.ttf`, `assets/kenney-fonts/License.txt` | None. |
| **Phaser 3.90.0** (game engine) | Richard Davey, Phaser Studio Inc. | https://www.npmjs.com/package/phaser | MIT | `vendor/phaser.min.js`, `vendor/PHASER-LICENSE.md` | None. |

**How the Kenney files were obtained.** kenney.nl couldn't be reached from the build environment. The files were taken from a public GitHub mirror of Kenney's packs, https://github.com/ETdoFresh/kenney.nl, at these paths:
- `kenney_rpgurbanpack/Tilemap/tilemap_packed.png`
- `gameicons/PNG/White/2x/`
- `kenney_fontpackage/Fonts/`

Each pack's own license file was downloaded with it and is kept next to the files. Those license files state CC0, and Kenney's official pages list the same packs as CC0. Under CC0, attribution is optional, but Kenney is credited here and in the in-game menu (☰ Menu › Learn › Credits).

SHA-256 of the files as downloaded:
- `tilemap_packed.png`: 305e71fa778444a0858c33988d45a6b79ea923f500f96079f4378347cf6ad389
- `KenneyPixel.ttf`: 174093d8b71aa808d7ffff70529c9087274515493add48134528c9136f621e92
- `KenneyFuture.ttf`: bd36e536cc26672bdba652547494a4877f2a446329bb7141840d9cd73bceffc2

## Original artwork for this game

The following were drawn for Identity Defender (by script, pixel by pixel) to match the RPG Urban Pack's palette and 16 px grid. They don't come from any third-party source.

- `assets/original/gate.png`: the access gate, with four states (idle, scanning, open, denied)
- `assets/original/console.png`: the security console
- `assets/original/rack.png`: the server racks
- `assets/original/drone.png`: the IMAP "mail script" drone
- `assets/original/sign_*.png`: the neon app signs
- `assets/original/bubbles.png`, `lamp.png`, `chevron.png`: status bubbles and lights

The game also generates a few effects in code at runtime: the glow, spark, marker and data-packet textures.

## Learning content

All people, companies, IP addresses and logs are fictional. Conditional Access behaviour was checked against Microsoft Learn (links in ☰ Menu › Learn › Sources). The questions are original practice material, not exam content.
