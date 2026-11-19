# Identity Defender

A 2D top-down adventure/puzzle game for learning **Microsoft SC-300: Identity and Access Administrator**.

You're the identity administrator on the Halcyon Freight campus. The campus has five areas, and each one is a mission with its own look. In each area you walk around, talk to people, inspect evidence, change real Microsoft Entra settings at a terminal, and then watch the result: doors open or stay shut, buildings light up, alarms go off. Walk off the edge of the screen to reach the next area. The way forward opens once you finish the mission.

**Play:** open `index.html` (or this repository's GitHub Pages site).
**Study library:** `library.html` has the full 98-objective question campaign, with practice, review and exam drills. The game and the library share one saved progress.

## The campaign
| # | Area | Mission | SC-300 |
|---|---|---|---|
| 1 | Halcyon Gardens (park, morning) | **New Hire Day**: dynamic membership rules and group-based licensing | 1.2 |
| 2 | Gate Plaza (dusk) | **Restore the Access Gates**: Conditional Access | 2.2 |
| 3 | App Market Street (midday) | **The Consent Lure**: user consent, verified publishers, the admin consent workflow | 3.2 |
| 4 | Admin Compound (night) | **Admin for an Hour**: Privileged Identity Management (eligible roles, activation duration, MFA, approval) | 4.3 |
| 5 | Finance Canal (sunset) | **Who Still Needs This?**: access reviews (reviewers, fallback, no-response default, auto apply) | 4.2 |

- **Levels:** each mission has Guided, Standard and Advanced versions. The game picks one from your progress on that topic, or you can choose in the menu.
- **Finishing a mission:** once every requirement is met, you predict what happens in a new situation under your settings. That prediction counts as mastery evidence. Repeated test runs don't.

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Move | WASD or arrow keys | Movement pad |
| Talk, inspect, use a terminal | E (also Space or Enter) | **Use** button, or tap the prompt |
| Run the scenario (at a terminal) | R | ▶ button |
| Hint (clue → highlight → worked answer) | H | Hint |
| Records (logs, users, apps…) | L | Logs button |
| Missions list (jump to any area) | M | Missions |
| Pause menu (settings, learn more, credits) | Esc or P | ☰ |

You can also play without walking: the pause menu opens the terminal and the records directly. The game honours your system's reduced-motion setting, and you can override it in the menu.

## Deploying to GitHub Pages
1. Upload **everything in this folder** to the root of the repository, keeping the folders: `assets/`, `js/` (including `js/levels/`), `vendor/` and `LICENSES/`, plus `.nojekyll`. Replace the files that are already there.
2. Under **Settings → Pages**, publish from your branch and the `/ (root)` folder.
3. To check what's live, open `…/version.json`. It should show `3.1.0`. The pause menu also shows the build number.

All paths are relative, and every file is requested with `?v=3.1.0`, which makes browsers fetch the new version. The site has no service worker. Files left over from older versions (for example `js/lab.js`) are never loaded.

## Structure
| Path | Purpose |
|---|---|
| `index.html` | The game: canvas, HUD and the retro RPG interface styles |
| `js/main.js` | Overworld engine: builds each area from data, the player, people, doors, exits and the run choreography |
| `js/ui.js` | HUD, labels, dialogue, terminal controls, evidence, missions, menus, debrief |
| `js/levels/*.js` | One file per mission: area layout, people, terminal settings, rules, hints, predictions and sources |
| `js/ca-engine.js`, `js/lab-missions.js` | Conditional Access rules and data (Mission 02) |
| `js/progress.js` | Save bridge to the shared progress (localStorage `identityDefender.v1`) |
| `library.html`, `js/app.js`, `js/content-*.js` | The study library |
| `assets/` | Kenney CC0 art and original art (see `ASSET_CREDITS.md`) |
| `vendor/phaser.min.js` | Phaser 3.90.0 (MIT) |

## Notes
- **The simulations** are simplified on purpose. Each mission lists its simplifications in the game (☰ › Learn) and links its Microsoft Learn sources.
- **Progress** saves in your browser. Back it up with Study library › Progress › Export.
- **Results** in practice are learning indicators, not a prediction of your exam score.
