// Copy pinned browser dependencies and licenses; adapt example ESM imports to
// the existing global THREE so GLTFLoader does not ship a second renderer.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
for (const [source, target] of [
    ['three/build/three.min.js', 'three.min.js'], ['three/LICENSE', 'three-LICENSE.txt'],
    ['earcut/dist/earcut.min.js', 'earcut.min.js'], ['earcut/LICENSE', 'earcut-LICENSE.txt']
]) {
    fs.copyFileSync(path.join(root, 'node_modules', source), path.join(root, 'vendor', target));
}
for (const file of ['loaders/GLTFLoader.js', 'utils/BufferGeometryUtils.js']) {
    let source = fs.readFileSync(path.join(root, 'node_modules/three/examples/jsm', file), 'utf8');
    source = source.replace(/import \{([\s\S]*?)\} from 'three';/, 'const {$1} = window.THREE;')
        .replace("'../utils/BufferGeometryUtils.js'", "'./BufferGeometryUtils.js'");
    fs.writeFileSync(path.join(root, 'vendor', path.basename(file)), source);
}
