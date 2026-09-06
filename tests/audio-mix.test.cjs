const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(){
 const source=fs.readFileSync('game.js','utf8'),start=source.indexOf('const SoundEngine = {'),end=source.indexOf('\n};',start)+3;
 const param=()=>({value:1,cancelScheduledValues(){},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v},setTargetAtTime(v){this.target=v}});
 const node=()=>({gain:param(),connections:[],connect(n){this.connections.push(n)},disconnect(){},start(){},stop(){}});
 const listeners={};let resumes=0,attached;
 const ctx={state:'suspended',currentTime:1,destination:{},createGain:node,createBufferSource:node,createDynamicsCompressor(){return {...node(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}},resume(){resumes++;this.state='running';return Promise.resolve()}};
 const scope={window:{AudioContext:function(){return ctx}},document:{addEventListener(k,v){listeners[k]=v}},localStorage:{getItem:()=>null,setItem(){}},PathfindrAudio:{attach(...args){attached=args}},console,setTimeout,performance:{now:()=>0}};
 vm.runInNewContext(source.slice(start,end)+';this.api=SoundEngine;',scope);
 const audio=scope.api;let ui=0,music=0;
 audio.loadAudioFiles=()=>new Promise(()=>{});audio.loadUISounds=()=>ui++;audio.loadSoundtrack=()=>music++;
 audio.init();return {audio,ctx,listeners,get resumes(){return resumes},get ui(){return ui},get music(){return music},get attached(){return attached}};
}
test('music and effects have independent buses with one protected output',()=>{
 const e=setup(),a=e.audio;
 assert.equal(a.masterGain.connections[0],a.mixLimiter);assert.equal(a.musicGain.connections[0],a.mixLimiter);
 assert.equal(a.mixLimiter.connections[0],e.ctx.destination);
 a.duckMusic(.7);assert.equal(a.masterGain.gain.value,1);assert.equal(a.musicGain.gain.value,.62);assert.equal(a.musicGain.gain.target,1);
});
test('UI and soundtrack loading are not held behind effect downloads; gestures recover suspended audio',()=>{
 const e=setup();assert.equal(e.ui,1);assert.equal(e.music,1);assert.equal(e.resumes,1);
 e.ctx.state='suspended';e.listeners.pointerdown();assert.equal(e.resumes,2);
 e.audio.muted=true;e.ctx.state='suspended';e.listeners.keydown();assert.equal(e.resumes,2);
});
test('an old scan ending cannot clear the newer scanning source',()=>{
 const {audio:a}=setup();a.buffers.scanning={duration:1};a.scanning();const old=a.activeSources.scanning.source;
 a.scanning();const current=a.activeSources.scanning.source;old.onended();assert.equal(a.activeSources.scanning.source,current);
 current.onended();assert.equal(a.activeSources.scanning,null);
});
