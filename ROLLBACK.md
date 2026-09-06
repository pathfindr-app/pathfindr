# Build recovery

Original app version: 1.0.0. Original Git revision:
`a3b0b238e33acf16afd1ad1194a2864b31839bab`.

The original workspace was dirty. The complete archive includes its uncommitted
files, ignored files, dependencies, and Git history. A Git checkout alone would
not recover that exact build.

New build: `pathfindr-amber-instrument-20260905.36`, branch `codex/visual-city-v2`.

## Roll back amber mobile hardware HUD and menu to .35

```sh
vercel rollback https://pathfindralpha-2lbt0kwl6-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

Verified production .35 source recovered to `output/releases/production35` (113 files verified against deployment content hashes).

## Roll back collectible-free Visualizer / tighter framing to .34

```sh
vercel rollback https://pathfindralpha-1jdd7w3xj-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back endpoint orbit / Visualizer city handoff to .33

```sh
vercel rollback https://pathfindralpha-80mtkbpvd-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back closer automatic Visualizer flight to .32

```sh
vercel rollback https://pathfindralpha-7gtdx2yod-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back dark compact recap / city notes / opaque top bar to .31

```sh
vercel rollback https://pathfindralpha-pslox0lff-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back Visualizer camera / mobile atlas UI / city handoff to .30

Previous production: `dpl_6HcgTKMrMekMu2qUYpZsR8Zbnopk`.

```sh
vercel rollback https://pathfindralpha-ns8yxs39f-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back Classic fullscreen / partial trace erase / end pullback to .29

Previous production: `dpl_Eq8euitdYZuEfB7N6Lx8zyYQAkPC`.

```sh
vercel rollback https://pathfindralpha-1wwkzu3k1-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back guided tracing / wider reveal / search pacing to .28

```sh
vercel rollback https://pathfindralpha-4frcophto-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back endpoint camera choreography to .27

Previous production: `dpl_8zsDu3tSmtgWTzQnpKF9Ai33xGFJ`.

```sh
vercel rollback https://pathfindralpha-66mehgmk0-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back Visualizer flow / camera assistance / quiet building materials to .26

Previous production: `dpl_66Z83bxhApWbYtH9aPaH5DAPNxR9` (`pathfindr-map-scorecard-20260904.26`).

```sh
vercel rollback https://pathfindralpha-j8gq50uqm-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back top-down buildings / game chrome / city facts to .25

```sh
vercel rollback https://pathfindralpha-93h3q2ydj-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back coordinate frame / aligned hub to .24

Previous production: `dpl_Ht98mX23ccjJKcNBWZa4294bEGEC`.

```sh
vercel rollback https://pathfindralpha-2cg6qficf-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back city instrument / libraries / random city fix to .23

Previous production: `dpl_GkJeVj4aRcVYwC5NXGxfXeskLUgA`.

```sh
vercel rollback https://pathfindralpha-g53bxxjj5-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back reflective water / Miami coastline to .22

Verified production before .23: `dpl_5tXpezyVVdxaS59pPDDSHsoMbTNy`.

```sh
vercel rollback https://pathfindralpha-hp1a7jtx2-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back trace assistance / moving route dashes to .21

Verified production before .22: `dpl_AqBaWaaLTjpN84DzKLrdsfv6NA3q`.

```sh
vercel rollback https://pathfindralpha-kublhj20i-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back lobby redesign / mapping progress to .19

Verified production before .21: `dpl_EfiF2rBVsBTjP5mTrxXRhHaXwduJ`.

```sh
vercel rollback https://pathfindralpha-qh4r9v7wb-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back lobby-first / DC landmarks / musical routes to .13

Verified production immediately before .17: `dpl_6LohRHoWt2pT8d8MLyAZ4k4qq6eV`.

```sh
vercel rollback https://pathfindralpha-3j28dnpos-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back the route wheel to .12

Production before .13: `dpl_DejfKgXbG8Np9RwXiCdYPoj4ETNB`.

```sh
vercel rollback https://pathfindralpha-ky08x2omu-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Roll back the mobile/road update to .11

Verified production before .12: `dpl_7t3fvhzFgBcPyqfCZjfyuCUegZpf`.

```sh
vercel rollback https://pathfindralpha-nk4r7i2pl-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

## Production rollback (recorded before .11 deployment)

Previous production deployment: `dpl_4QUi8v4t37MoKDcKvoJX7w1gDSiX`

Previous production URL: https://pathfindralpha-ng39hg9ix-pathfindr-apps-projects.vercel.app

Restore production using the authenticated Vercel account:

```sh
vercel rollback https://pathfindralpha-ng39hg9ix-pathfindr-apps-projects.vercel.app --scope pathfindr-apps-projects
```

This is separate from the local archive recovery command below.

Stop any development server, then run from any directory:

```sh
sh /Users/bradleyarakaki/Desktop/Pathfindr-recovery/restore-baseline.sh
```

The script extracts and checks the baseline before moving anything. It preserves
the displaced workspace under `Pathfindr-recovery/displaced-build.*/Pathfindr`.
It restores local files, not deployed sites or remote databases.

Archive SHA-256:
`4fa15676a935f952ae6e6d4b14c3e4c39cd47595ae18e7fdcbce60e9b1478d91`.
