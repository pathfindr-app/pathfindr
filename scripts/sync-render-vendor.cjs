// Copy pinned, unmodified browser dependencies and their licenses.
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
for (const [source, target] of [
    ['three/build/three.min.js', 'three.min.js'], ['three/LICENSE', 'three-LICENSE.txt'],
    ['earcut/dist/earcut.min.js', 'earcut.min.js'], ['earcut/LICENSE', 'earcut-LICENSE.txt']
]) {
    fs.copyFileSync(path.join(root, 'node_modules', source), path.join(root, 'vendor', target));
}
