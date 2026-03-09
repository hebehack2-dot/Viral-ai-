import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Delete 347 to 376
lines.splice(346, 376 - 347 + 1);

// Delete 169 to 299
lines.splice(168, 299 - 169 + 1);

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done');
