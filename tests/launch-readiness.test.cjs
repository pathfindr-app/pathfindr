const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=f=>fs.readFileSync(f,'utf8');
test('generator fails closed without a configured cron secret',()=>{
 assert.match(read('supabase/functions/create-hourly-challenge/index.ts'),/if \(!cronSecret \|\| cronSecretHeader !== cronSecret\)/);
});
test('route badges are removed; animated paths and global legend remain',()=>{
 const game=read('game.js');assert.doesNotMatch(game,/PathfindrRouteCinema.tag\(/);
 assert.match(game,/PathfindrRouteCinema.route\(ctx,savedUserPoints/);assert.match(read('index.html'),/id="route-identity-legend"/);
});
test('free Visualizer does not alter paid entitlement checks for Explorer',()=>{
 const source=read('game.js'),start=source.indexOf('function checkPremiumAccess(mode)'),end=source.indexOf('async function showPremiumRequired',start);
 const c={PathfindrAuth:{hasPurchased:()=>false},DEBUG_BYPASS_PREMIUM:false};vm.createContext(c);vm.runInContext(source.slice(start,end),c);
 assert.equal(c.checkPremiumAccess('visualizer'),true);assert.equal(c.checkPremiumAccess('explorer'),false);
 c.PathfindrAuth.hasPurchased=()=>true;assert.equal(c.checkPremiumAccess('explorer'),true);
});
test('game build excludes unrelated Print Studio assets',()=>{assert.doesNotMatch(read('scripts/build.js'),/^\s*'prints',/m);});
test('share UI attempts hosted URLs first and never hands users giant links',()=>{
 const source=read('engine/share-ui.js');assert.ok(source.indexOf('PathfindrShareCloud.publish')<source.indexOf('PathfindrShareData.encode'));
 assert.match(source,/url.href.length<=1500/);assert.match(source,/navigator.share\(\{title:payload.title/);
});
