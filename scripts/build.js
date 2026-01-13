/**
 * Build script for Pathfindr
 * Copies web files to dist/ for Capacitor native builds
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

// Files to copy to dist
const FILES = [
    'index.html',
    'game.js',
    'styles.css',
    'config.js',
    'auth.js',
    'payments.js',
    'ads.js',
    'Scanning1.wav',
    'Found1.wav',
    'Pathfindr1.wav',
];

// Directories to copy
const DIRS = [
    'public',
    'worldcities',
];

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyFile(src, dest) {
    const srcPath = path.join(ROOT, src);
    const destPath = path.join(DIST, src);

    if (fs.existsSync(srcPath)) {
        ensureDir(path.dirname(destPath));
        fs.copyFileSync(srcPath, destPath);
        console.log(`  Copied: ${src}`);
    } else {
        console.log(`  Skipped (not found): ${src}`);
    }
}

function copyDir(src, dest) {
    const srcPath = path.join(ROOT, src);
    const destPath = path.join(DIST, src);

    if (!fs.existsSync(srcPath)) {
        console.log(`  Skipped dir (not found): ${src}`);
        return;
    }

    ensureDir(destPath);

    const entries = fs.readdirSync(srcPath, { withFileTypes: true });
    for (const entry of entries) {
        const srcEntry = path.join(src, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcEntry);
        } else {
            copyFile(srcEntry);
        }
    }
    console.log(`  Copied dir: ${src}`);
}

console.log('Building Pathfindr for mobile...\n');

// Clean dist folder
if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true });
}
ensureDir(DIST);

console.log('Copying files:');
FILES.forEach(file => copyFile(file));

console.log('\nCopying directories:');
DIRS.forEach(dir => copyDir(dir));

console.log('\nBuild complete! Output in dist/');
