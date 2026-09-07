# Isolated New Cairo Circuit release — September 7

- Game source: e278830 on `codex/new-cairo-arena-20260907`.
- Public prototype: https://www.pathfindr.world/arena/
- Deployment: `dpl_4tzafERn3FcMpy4qAMgJ2YYapAS3`.
- Immutable URL: https://pathfindralpha-48cjgci77-pathfindr-apps-projects.vercel.app
- Exact source stage: `/tmp/pathfindr-arena-release-afdb7y`.
- Previous shared production: `dpl_Cx4CYnfmrzSPEpHH2WQgZfQyHwYW`, main game build .45.
- Only four public files added under `/arena/`. All 308 prior source files SHA1-verified against current production before copying and preserved byte-for-byte. Main game remains build .45; no lobby integration, database mutation, Printshop change or payment toggle.

## Release verification

152 tests passed. Preview `dpl_64a17QoHbhBq6D2cMTNHCHgWcoey` passed authenticated main game, all city assets checked by continuity verifier, Printshop and private-source checks. Ordinary preview checker was blocked by Vercel authentication. All four served arena files matched source bytes in preview and public production. Public main index matched the exact preexisting staged entry. All eight public Printshop checks passed after production deployment.

Prototype gameplay was inspected locally at desktop and 390×844 before release (see progress.md and arena/README.md). No real iPad performance certification, online multiplayer, or server-side prototype persistence is claimed.

## Exact rollback

Only use while this is still the latest release; inspect production first to avoid discarding newer independent work.

```sh
vercel rollback https://pathfindralpha-c9d3ryl3d-pathfindr-apps-projects.vercel.app --yes --scope pathfindr-apps-projects
```

This removes the added experiment and restores the immediately preceding complete game-and-shop deployment, not a historical Printshop baseline. Run the public Printshop checker and game entry checks afterward.
