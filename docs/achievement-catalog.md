# Pathfindr achievement catalog — 100 proposals

These are proposed unlocks, not claims about current persistence or implemented UI. No retroactive awards without supporting records. Names are original achievement labels; venue brands identify real-world places, not sponsorship.

## Evidence contract

- **C / collection.confirmed:** canonical OSM object key (`node/123`, `way/456`, `relation/789`), type, normalized brand, name, city key, country code, coordinates, round ID, mode, and authoritative acceptance time. Count each place once per lifetime unless a condition explicitly says otherwise. Duplicate retries do not count. Brand comes from OSM metadata/curated mapping, not substring guesses in user text. Unknown brand stays unknown.
- **R / round.completed:** unique round ID, city/country, unassisted flag, input mode, route distance meters, unique traversed OSM node IDs, graph hash/version, efficiency, elapsed active milliseconds and accepted collectibles. Classic score remains route-only. Pause/loading/visualization time is excluded. Assisted/skipped rounds do not unlock skill achievements.
- **D / daily.accepted:** server-accepted challenge ID/date, player entry/version, rank at final closure, route/collection/speed components. Repeated attempts count one challenge; rank achievements wait until results are final.
- **S / challenge.shared / challenge.completed:** stable share ID, creator, recipient identity or privacy-preserving deduplicated installation, completion ID. Creating an unused link never counts as a friend completion. No reward for spam or repeated self-play.
- **V / visualizer.scan.completed:** actual completed scan, city key/country and graph hash. This is a viewing record, not a mapped route. Currently device-local records must not be represented as server-verified account progress.
- **A / arena.match.completed:** authoritative local match summary, winning slot, completed destinations, ability accepted/rejected events, repairs and collection events. Local experimental awards are cosmetic; never mixed into ranked Daily progress.

Metric syntax: `unique(field)` is deduplicated lifetime count; `sum(field)` is a lifetime sum over distinct accepted events; `in_round(...)` and `in_match(...)` reset for each round/match. A streak uses consecutive *eligible played rounds*, not calendar pressure unless explicitly daily dates. Distance milestones use meters, not rounded UI miles (one mile = 1,609.344 m). Geography keys should survive localized city-name changes. Cross-device achievements require account-level event reconciliation; guests can retain local progress and merge deduplicated events later.

## Collection / reading — 01–10

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| collection.first | First discovery | C | 1 unique OSM place, any collection type |
| collection.ten | Street cabinet | C | 10 unique OSM places |
| collection.fifty | City collector | C | 50 unique OSM places |
| collection.hundred | Field collection | C | 100 unique OSM places |
| library.first | Open a chapter | C | 1 unique library |
| library.five | Reading route | C | 5 unique libraries |
| library.twenty | Public knowledge | C | 20 unique libraries |
| library.cities | Interlibrary loan | C | Libraries collected in 5 distinct cities |
| library.countries | World reader | C | Libraries collected in 3 distinct countries |
| library.round | Library crawl | R | 3 unique libraries collected in one completed round |

## Brands / food — 11–20

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| brand.mcdonalds.first | Golden stop | C | 1 unique McDonald's venue |
| brand.mcdonalds.ten | Ten arches | C | 10 unique McDonald's venues |
| brand.mcdonalds.countries | Arches abroad | C | McDonald's venues in 3 countries |
| brand.burgerking.first | Crown stop | C | 1 unique Burger King venue |
| brand.burgerking.ten | Crown circuit | C | 10 unique Burger King venues |
| brand.burgerking.cities | Crown tour | C | Burger King venues in 5 cities |
| brand.wendys.first | Red-roof stop | C | 1 unique Wendy's venue |
| brand.wendys.five | Five fresh stops | C | 5 unique Wendy's venues |
| brand.trio | Three menus | C | At least 1 venue each from McDonald's, Burger King and Wendy's |
| food.independent | Local flavor | C | 10 distinct venues explicitly classified as independent; unknown-brand venues excluded |

## Landmarks / discovery — 21–30

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| landmark.first | A place to remember | C | 1 unique landmark |
| landmark.five | Monument trail | C | 5 unique landmarks |
| landmark.twenty | Landmark ledger | C | 20 unique landmarks |
| landmark.cities | City signatures | C | Landmarks in 5 distinct cities |
| landmark.countries | Across borders | C | Landmarks in 3 countries |
| landmark.eiffel | Iron in the sky | C | Curated Eiffel Tower canonical OSM identity collected |
| landmark.washington | The obelisk | C | Curated Washington Monument canonical OSM identity collected |
| collection.types | Full spectrum | R | At least 1 library, burger venue and landmark in one completed round |
| collection.clean | Collector's instinct | R | At least 3 unique collectibles and efficiency ≥90% in one unassisted round |
| collection.citydepth | Know the neighborhood | C | 25 unique places within one stable city key |

## Mileage / world mapping — 31–40

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| distance.mile | First mile | R | 1,609.344 m of accepted player route distance |
| distance.ten | Ten-mile notebook | R | 16,093.44 m total route distance |
| distance.marathon | A city's marathon | R | 42,195 m total route distance |
| distance.hundred | Hundred-mile survey | R | 160,934.4 m total route distance |
| distance.thousand | Long-range survey | R | 1,609,344 m total route distance |
| nodes.hundred | First connections | R | 100 unique traversed OSM nodes |
| nodes.thousand | Network reader | R | 1,000 unique traversed OSM nodes |
| nodes.ten_thousand | Network builder | R | 10,000 unique traversed OSM nodes |
| nodes.hundred_thousand | A world taking shape | R | 100,000 unique traversed OSM nodes |
| nodes.new_hundred | Fresh ground | R | One round contributes ≥100 nodes never previously traversed by this player |

## Places / exploration — 41–50

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| city.first | First pin | R | Complete a round in 1 city |
| city.five | Five city notebook | R | Complete rounds in 5 distinct cities |
| city.twenty | Urban atlas | R | Complete rounds in 20 distinct cities |
| city.fifty | Fifty skylines | R | Complete rounds in 50 distinct cities |
| country.first_foreign | Beyond home | R | Complete a round outside a voluntarily selected home country; no inferred real location |
| country.five | Five borders | R | Complete rounds in 5 countries |
| country.twenty | World notebook | R | Complete rounds in 20 countries |
| hemisphere.north_south | Across the equator | R | Complete rounds north of +1° and south of −1° latitude |
| hemisphere.east_west | Across the meridian | R | Complete rounds east of +1° and west of −1° longitude |
| city.depth | Resident cartographer | R | Complete 25 distinct rounds in one city |

## Route craft — 51–60

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| route.first | Connection made | R | Finish 1 unassisted round |
| route.ten | Street instinct | R | Finish 10 unassisted rounds |
| route.hundred | Practiced eye | R | Finish 100 unassisted rounds |
| efficiency.ninety | Close call | R | Efficiency ≥90% in 1 unassisted round |
| efficiency.ninetyfive | Read the grid | R | Efficiency ≥95% in 1 unassisted round |
| efficiency.perfect | Same conclusion | R | Route distance within max(1 m, 0.1%) of optimal in an unassisted round |
| efficiency.streak | Consistent instinct | R | 5 consecutive unassisted played rounds at ≥90% efficiency |
| efficiency.long | Long way, right way | R | Unassisted route ≥3,000 m with efficiency ≥95% |
| efficiency.cities | Transferable skill | R | Achieve ≥95% efficiency in 10 different cities |
| efficiency.session | Clean sheet | R | All 5 rounds in one Classic session unassisted and ≥95% efficient |

## Input / recovery — 61–70

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| trace.first | Follow the line | R | Complete an unassisted trace-only round |
| trace.ten | Steady hand | R | Complete 10 unassisted trace-only rounds |
| trace.precise | Guided instinct | R | Trace-only unassisted round with efficiency ≥95% |
| tap.first | Point by point | R | Complete an unassisted tap-only round |
| tap.ten | Deliberate steps | R | Complete 10 unassisted tap-only rounds |
| tap.precise | Measured choices | R | Tap-only unassisted round with efficiency ≥95% |
| input.both | Two ways to draw | R | Complete at least 1 unassisted tap-only and 1 unassisted trace-only round |
| recovery.undo | Second thought | R | Undo an actual route segment, then finish the same round at ≥90% efficiency |
| recovery.deadend | Found a way | R | Recover from a detected trace stall, then finish the same round unassisted |
| recovery.improve | Learn the street | R | Improve efficiency by ≥10 percentage points on a replay of the exact same graph/endpoints, unassisted |

## Daily challenge — 71–80

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| daily.first | Today's map | D | 1 accepted Daily Challenge completion |
| daily.seven | Seven maps | D | Complete 7 distinct Daily Challenges, nonconsecutive allowed |
| daily.thirty | Thirty mornings | D | Complete 30 distinct Daily Challenges, nonconsecutive allowed |
| daily.week | One mapped week | D | Complete Daily Challenges on 7 consecutive challenge dates |
| daily.route | Route specialist | D | Server route component ≥950 in one entry |
| daily.collection | Every discovery counts | D | Earn the full 200 collection component in one entry |
| daily.balanced | Balanced survey | D | Route ≥900, collection ≥100 and speed ≥30 in one entry |
| daily.thousand | Four figures | D | Server total ≥1,000 in one entry |
| daily.topten | On the board | D | Final rank ≤10 with ≥20 distinct eligible competitors |
| daily.winner | Daily cartographer | D | Final rank 1 with ≥10 distinct eligible competitors |

## Shared routes / community — 81–90

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| share.first | Send a street | S | Publish 1 valid playable challenge URL |
| share.played | Challenge accepted | S | One other deduplicated player completes your challenge |
| share.five_players | A little rivalry | S | 5 distinct other players complete your authored challenges |
| share.ten_routes | Route curator | S | 10 distinct authored routes each completed by another player |
| share.full_run | The whole journey | S | Another player completes all 5 rounds of your shared session |
| friend.first | Take the invitation | S | Complete 1 challenge created by another player |
| friend.five | Friendly circuit | S | Complete challenges from 5 distinct creators |
| friend.ten | Ten invitations | S | Complete 10 distinct friend challenges |
| friend.beat | A better way | S | Beat the creator's unassisted distance by ≥1% on the identical pinned graph/endpoints |
| friend.rematch | Settled on the streets | S | Two players each complete one challenge authored by the other |

## Visualizer / local Circuit — 91–100

| Key | Name | Event | Exact unlock condition |
|---|---|---|---|
| visualizer.first | Watch a city think | V | Watch 1 scan finish |
| visualizer.ten_cities | Signal traveler | V | Completed scans in 10 distinct cities |
| visualizer.world | Watching the world | V | Completed scans in 5 countries |
| visualizer.hundred | One hundred searches | V | 100 completed scans, excluding interrupted scans |
| arena.first | Join the circuit | A | Finish 1 local match with at least 1 destination linked |
| arena.five | Five connections | A | Link all 5 destinations in one local match |
| arena.win | Own the circuit | A | Win 1 local match against 3 active bots |
| arena.repair | Connection restored | A | Complete a real cut-induced repair and then finish its destination |
| arena.barrier | Safe disruption | A | A valid barrier causes a rival to reroute; all destinations remain reachable |
| arena.toolbox | Three tools, one city | A | Successfully use barrier, cut and shortcut in one completed match |

## Launch priorities and safeguards

Start with first discovery, library milestones, unique-node mileage, five cities, first shared completion, first Daily completion and first arena win. Keep advanced brand/rank/social unlocks disabled until their evidence exists. No popup interrupts tracing; combine unlocks into a quiet recap strip. Let players hide announcements. Do not sell competitive advantages through achievement rewards; badges, map palettes and optional sound signatures are safer rewards.

Never convert Visualizer viewing into community “world mapped” progress. Deduplicate OSM IDs against the recorded graph version; deleted/merged OSM identities need an explicit migration policy. A live whole-world completion percentage requires a dated OSM denominator and cannot be inferred from the 36-city fallback library. Geo-achievements are about virtual play, not evidence that someone physically visited a venue. Store no device GPS for these achievements.
