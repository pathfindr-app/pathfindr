const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8'),css=fs.readFileSync('styles.css','utf8'),game=fs.readFileSync('game.js','utf8');
test('lobby tabs control named panels; test-city shortcuts are not front-page actions',()=>{
    for(const id of ['lobby-play-panel','lobby-atlas-panel','splash-player-panel']) {
        assert.ok(html.includes(`aria-controls="${id}"`));
        assert.equal([...html.matchAll(new RegExp(`id="${id}"`,'g'))].length,1);
    }
    for(const mode of ['miami','washington']) {
        assert.ok(!html.includes(`data-lobby-city="${mode}"`));
        assert.ok(html.includes(`data-mode="${mode}"`));
    }
    assert.match(html,/tab.tabIndex = active \? 0 : -1/);
    assert.ok(fs.statSync('engine/lobby-map.svg').size<500000);
});
test('lobby is visible in initial HTML without waiting for JavaScript or intro playback',()=>{
    assert.match(html, /id="splash-screen" class="overlay splash-show-welcome"/);
    const video=html.match(/<video[\s\S]*?id="splash-intro-video"[\s\S]*?<\/video>/)?.[0];
    assert.ok(video);assert.doesNotMatch(video,/autoplay/);assert.match(video,/preload="none"/);
    assert.match(game,/splashScreen.classList.contains\('splash-show-welcome'\)[\s\S]*?revealWelcome\(\{ immediate: true \}\);\s*return;/);
});
test('external startup dependencies and typography cannot block parsing the lobby',()=>{
    const head=html.slice(0,html.indexOf('</head>'));
    assert.doesNotMatch(head,/<script src=/);
    assert.doesNotMatch(css,/@import/);
    assert.ok(html.indexOf('id="splash-screen"')<html.indexOf('<script src="https://unpkg.com/@capacitor'));
    for(const link of head.matchAll(/<link[^>]+href="https:[^>]+>/g))assert.match(link[0],/media="print"/);
    assert.match(html,/pending\?\.isConnected\) pending.click\(\)/);
});
test('mobile Back to lobby invokes the existing exit action, not the overflow toggle',()=>{
    const mobile=fs.readFileSync('engine/mobile-ui.js','utf8');
    assert.match(mobile, /lobby\.onclick=\(\)=>\{[\s\S]*?sheet\.close\(\);document\.getElementById\('menu-exit'\)\.click\(\)/);
    const exit=game.slice(game.indexOf('function exitToMenu()'),game.indexOf('function switchToExplorerMode()'));
    assert.match(exit,/GameController.enterPhase\(GamePhase.MENU\);\s*showModeSelector\(\);/);
});
