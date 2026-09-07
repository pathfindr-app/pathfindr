# Mobile stroke settle — .46

- Source commit `89cfc86`, branch `codex/new-cairo-arena-20260907`.
- Build `pathfindr-camera-settle-20260907.46`.
- Production `dpl_HftYU5dtYSYEfFmEShwzcvM6mgr3`.
- https://www.pathfindr.world
- Immutable URL https://pathfindralpha-7jvpyl4w9-pathfindr-apps-projects.vercel.app
- Exact stage `/tmp/pathfindr-camera-settle-afq8GE`.
- Previous exact stage `/tmp/pathfindr-arena-release-afdb7y`, deployment `dpl_4tzafERn3FcMpy4qAMgJ2YYapAS3`.

Normal mobile trace release now gently settles the head into the usable map center. Cancelled gestures preserve manual camera ownership; route completion still owns its reveal camera. No route geometry/scoring changes.

157 tests passed, including five actual camera-adapter callback tests. In-app 390×844 Washington tap extended to 0.08km then centered at (195,424). Before fix, short trace released at (192,490); after fix a real 0.09km trace/8 nodes settled at (195,424). Fixture uses real Washington pack and actual controls, disconnected map-provider fetches, disabled fullscreen, read-only visible telemetry; it is not deployed. Stock headless test timed out on navigation, so it is not cited as successful gameplay evidence.

Preview `dpl_58RxTR7d85VSvcv2RbQoU9d3J2Jq`: authenticated shared-site checks pass; served adapter matches stage. Standard preview checker encounters login. Production revalidated unchanged before deploy. Public post-deployment: all eight Printshop checks pass; all four Circuit files match source; main entry, adapter, config and build-info match stage. 308 unrelated production source files preserved byte-for-byte, including Circuit and all Printshop source/functions. No database/payment changes.

Rollback only while this remains the newest release (check production first):

```sh
vercel rollback https://pathfindralpha-48cjgci77-pathfindr-apps-projects.vercel.app --yes --scope pathfindr-apps-projects
```

Broader goal remains active. Normal US startup reproduced an in-app page crash twice, but controlled Washington starts successfully; root cause is not proven. All-mode fallback and remaining runtime invariants still require verification. No real-iPad FPS claim.
