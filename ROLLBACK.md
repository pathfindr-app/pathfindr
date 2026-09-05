# Build recovery

Original app version: 1.0.0. Original Git revision:
`a3b0b238e33acf16afd1ad1194a2864b31839bab`.

The original workspace was dirty. The complete archive includes its uncommitted
files, ignored files, dependencies, and Git history. A Git checkout alone would
not recover that exact build.

New build: `pathfindr-route-wheel-20260904.13`, branch `codex/visual-city-v2`.

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
