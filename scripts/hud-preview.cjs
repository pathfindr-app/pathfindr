// Responsive visual fixture using the real HUD markup and styles, without map/network work.
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const header=html.slice(html.indexOf('<div id="gameplay-hud">'),html.indexOf('<!-- Mobile Overflow Menu -->')).trim();
const styles=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]+>/g)].map(m=>m[0]).join('\n');
const content='<base href="http://localhost:4200/"><meta name="viewport" content="width=device-width">'+styles+'<body><div id="app">'+header.replace(/\s*<\/div>$/, '<button id="mobile-options" aria-label="Map menu">Menu</button></div>')+'</div></body>';
const escaped=content.replaceAll('&','&amp;').replaceAll('"','&quot;');
fs.writeFileSync('output/hud-responsive.html','<!doctype html><title>HUD responsive check</title><style>body{margin:0;background:#171a25;color:white;font:14px sans-serif}iframe{display:block;border:0;width:100%;height:160px}.phone{width:390px;margin:12px auto}.small{width:320px;margin:12px auto}</style><p>Desktop</p><iframe srcdoc="'+escaped+'"></iframe><p>390px mobile</p><iframe class="phone" srcdoc="'+escaped+'"></iframe><p>320px mobile</p><iframe class="small" srcdoc="'+escaped+'"></iframe>');
