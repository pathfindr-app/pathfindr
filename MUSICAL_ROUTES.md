# Musical routes — local build .14

## Lingering-history emphasis (.15 follow-up)

Previous-round explored edges now receive a separate bounded bass/onset gain, reduced by sqrt(roundCount) and attenuated while the current A* runs. Prior route halos widen and brighten more strongly, and their musical packets use2× strength (capped). Actual route widths/geometry stay stable. The revealed portion of each predecessor tree is retained with historical world coordinates, so road-following charges continue into later rounds. Historical network work has a shared ~144segment budget across ordinary five-round runs. Muting/reactivity-off restores baseline opacity; it does not hide routes. Explorer history receives the same gain and stronger route charges. Same-map friend rounds now preserve prior history; new-map transitions still clear it.

## Signal and timing

`npm run analyze:music` generates `data/soundtrack-analysis.js` from the shipped Music/*.mp3 files. This optional asset-generation step needs ffmpeg, Python3 and NumPy. No remote service is used. Normal builds copy the generated atlas; tests validate its SHA-256 source hashes. Regenerate it when changing music.

Analysis: mono22.05kHz, Hann-window2048-sample FFT,512-sample hop. Positive differences in log spectral magnitude produce onset strength. Peaks must exceed both a rolling local baseline and a track-relative threshold, with380ms minimum separation. These are onsets, not claimed beat/downbeat labels. Three RMS spectral bands (40–250,250–2200,2200–9000Hz) are normalized by each track's95th percentile and stored at ~21.5Hz. Runtime interpolates envelopes against HTMLAudioElement.currentTime, never frame count. Atlas is ~755KiB before compression for12tracks. Unknown tracks fall back to live2048FFT positive flux.

Pause/mute/hidden/reduced-motion disables packets; seeking or track changes reset the event cursor, so missed attacks aren't replayed in a burst. At most8 charges survive4seconds. Existing attack/release smoothing remains for band envelopes. No microphone or third-party calls.

## Rendering

Arc-length lookup places each charge by distance along a polyline, not vertex index. Position advances0.42route lengths/sec and intensity decays exp(-age/2.1). Three nested trailing spans approximate a luminous packet: wide dim residue, colored body, narrow lighter filament. Bass packets are wider; high-band packets include a small attached cross-spark. During drawing, effects occupy the final35% of the path. Existing immutable route ownership colors/dashes remain.

Route-distance caches are bounded20 and invalidate on projected geometry changes. No new animation loop, GL context, per-particle DOM or per-edge timers. These added effects are layered Canvas strokes, not a new HDR route-mesh shader; existing WebGL emission remains. Do not claim Blender parity or measured deviceFPS gains.

A* records its predecessor map alongside existing frontier history, then builds a visual tree once per animation. Each branch divides charge amplitude by sqrt(childCount), conserving squared amplitude. Arrival delay follows accumulated tree distance, normalized to2.1seconds across the tree; local heat decays exponentially. Render samples at most360tree segments and checks revealed-edge membership, so it cannot reveal the solution early or alter search order. Nine batched strokes provide residue/body/core levels. Dense trees intentionally sample the presentation; no graph nodes/edges are removed from gameplay.

## Sources and limits

- https://www.audiolabs-erlangen.de/resources/MIR/FMP/C6/C6S1_NoveltySpectral.html — log spectral flux and onset novelty.
- https://www.audiolabs-erlangen.de/resources/MIR/FMP/C6/C6S2_TempoBeat.html — onset vs beat/tempo distinction.
- https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode — FFT bins and spectral analysis.
- https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold — flash safety. Event-rate limiting is not a complete compliance proof; recorded visual output still needs dedicated flash analysis. No full-screen or red flashes are introduced, and reduced-motion disables reactive charges.

No production deployment or database migration is part of this implementation. Prior production is .13: https://pathfindralpha-3j28dnpos-pathfindr-apps-projects.vercel.app.
