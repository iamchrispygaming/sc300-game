# Identity Defender

A browser mini-game for studying for **Microsoft SC-300: Identity and Access Administrator**. You play the identity administrator at Halcyon Freight, a fictional company, and work through 25 missions that cover every objective in the official study guide (skills measured as of October 28, 2026).

**Play:** open `index.html`, or use the GitHub Pages site for this repository.

## Features
- **Ops workspace (new in 2.0):** the main screen is a playable identity operations console. The first mission, *Monday Morning Lockout*, shows employees and attackers signing in through a simulated Conditional Access gate. Inspect each sign-in's evidence, edit the policies, press **Test** and watch the results, then confirm your understanding with a prediction on a new sign-in. The mission adapts to your Conditional Access level (Guided, Standard or Advanced) and accepts any configuration that meets the requirements.
- **Study library:** 20 domain missions, 4 domain bosses and a final boss. All 98 official objectives are covered, each by at least two different questions.
- **Modes:**
  - Learn: missions with hints and explanations.
  - Practice: mixed questions with feedback after each one.
  - Review: spaced repetition that brings missed topics back as different scenarios.
  - Exam drill: timed and weighted by exam domain.
- **Adaptive difficulty:** each of the 16 study-guide topics keeps its own level (Beginner, Intermediate, Advanced), based on first-try answers. Misses bring a worked example and a simpler related question, followed by a new scenario at the original level. Exam drills keep a fixed mix.
- **Progress:** XP is tracked separately from mastery (Not started → Learning → Needs review → Demonstrated), with confidence ratings and achievements.
- **Saving:** progress saves in your browser's local storage. Use **Progress › Export** to back it up or move it between devices.

## Structure
| File | Purpose |
|---|---|
| `index.html` | Page shell and styles |
| `js/app.js` | Game engine (study library, adaptive difficulty, saving) |
| `js/lab.js` | Ops workspace: Conditional Access simulator and mission loop |
| `js/lab-missions.js` | Ops mission data (sign-ins, policies, requirements, hints) |
| `js/content-*.js` | Questions, training bank, difficulty tags, sources, campaign structure (data only) |

Adaptive thresholds are in the `ADAPT` object at the top of `js/app.js`.

## Notes
- All companies, people and logs are fictional. Screens are simplified simulations of the Microsoft Entra admin center.
- The questions are original practice material, not exam questions. Practice results are learning indicators, not a prediction of your exam score.
- Technical content was checked against Microsoft Learn on 2026-11-18. Each question links to its sources.
