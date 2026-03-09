import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines.splice(663, 958 - 664 + 1); // 0-indexed, so line 664 is index 663
fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done');
