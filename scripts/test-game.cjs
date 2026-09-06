/* Game-only suite: unrelated Print Studio tests are intentionally outside this release. */
const fs=require('node:fs'),{spawnSync}=require('node:child_process');
const files=fs.readdirSync('tests').filter(f=>f.endsWith('.test.cjs')&&f!=='prints.test.cjs').map(f=>'tests/'+f);
const result=spawnSync(process.execPath,['--test',...files],{encoding:'utf8'});
process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
// Some legacy tests mock process.exit; TAP failures remain authoritative.
process.exit(result.status||(/^not ok /m.test(result.stdout||'')?1:0));
