const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const elements=new Map(),intervals=new Set();let id=0;
 const document={getElementById(key){if(!elements.has(key))elements.set(key,{textContent:'old city',style:{},classList:{add(){},remove(){}}});return elements.get(key);}};
 const source=fs.readFileSync('game.js','utf8').split('const CityFacts = {')[1].split('const CityDB = {')[0];
 const c={document,GameState:{},CONFIG:{usCities:[],globalCities:[]},setInterval:()=>{intervals.add(++id);return id;},clearInterval:id=>intervals.delete(id)};
 vm.runInNewContext('const CityFacts = {'+source+';globalThis.facts=CityFacts',c);
 const requests={};c.facts.fetchFacts=city=>new Promise(resolve=>requests[city.name]=resolve);
 return {facts:c.facts,requests,document,intervals};
}
test('late previous-city facts cannot replace the next-city ticker',async()=>{
 const {facts,requests,document,intervals}=setup();
 const old=facts.startTicker({name:'Austin'}),next=facts.startTicker({name:'Seattle'});
 assert.equal(document.getElementById('ticker-text').textContent,'');
 requests.Seattle(['Seattle fact']);await next;requests.Austin(['Austin fact']);await old;
 assert.equal(document.getElementById('ticker-text').textContent,'Seattle fact');assert.equal(intervals.size,1);
 facts.stopTicker();assert.equal(intervals.size,0);assert.equal(document.getElementById('ticker-text').textContent,'');
});
test('stopping during a fetch cannot resurrect the old ticker',async()=>{
 const {facts,requests,intervals}=setup();const pending=facts.startTicker({name:'Austin'});facts.stopTicker();requests.Austin(['old']);await pending;assert.equal(intervals.size,0);assert.equal(facts.ticker.active,false);
});
test('transition facts clear immediately and ignore out-of-order responses',async()=>{
 const {facts,requests,document}=setup();const first=facts.showFactInTransition({name:'Austin'}),second=facts.showFactInTransition({name:'Seattle'});
 assert.equal(document.getElementById('transition-fact').textContent,'');requests.Seattle(['new']);await second;requests.Austin(['old']);await first;
 assert.equal(document.getElementById('transition-fact').textContent,'new');
});
test('city change invalidates pending result facts and clears old text',async()=>{
 const {facts,requests,document}=setup();const pending=facts.showFactInResults({name:'Austin'});facts.stopTicker();requests.Austin(['old']);await pending;assert.equal(document.getElementById('fact-text').textContent,'');
});
test('offline Miami recap has a bundled note without a facts API request',async()=>{
 const source=fs.readFileSync('game.js','utf8').split('const CityFacts = {')[1].split('const CityDB = {')[0];
 const c={document:{},GameState:{},CONFIG:{},fetch:()=>assert.fail('offline pack must not fetch')};
 vm.runInNewContext('const CityFacts = {'+source+';globalThis.facts=CityFacts',c);
 assert.match((await c.facts.fetchFacts({packId:'miami'}))[0],/July 28, 1896/);
});
