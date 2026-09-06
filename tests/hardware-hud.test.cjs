const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const window={};vm.runInNewContext(fs.readFileSync('engine/hardware-hud.js','utf8'),{window,document:{readyState:'loading',addEventListener(){}}});
test('LCD digit masks and punctuation are bounded, safe and complete',()=>{
 const {markup}=window.PathfindrLCD;
 assert.equal((markup('0123456789').match(/class="lcd-digit"/g)||[]).length,10);
 assert.equal((markup('8').match(/class="lit"/g)||[]).length,7);
 assert.equal((markup('0').match(/class="lit"/g)||[]).length,6);
 assert.equal((markup('1').match(/class="lit"/g)||[]).length,2);
 assert.ok(markup('1.63km').includes('lcd-dot'));assert.ok(markup('3/5').includes('lcd-slash'));
 assert.ok(!markup('<img src=x onerror=alert()>').includes('<img'));
});
