import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');

// Delete handleGenerateAudio
lines.splice(106, 133 - 106 + 1);

// Delete handleFileUpload
lines.splice(48, 61 - 48 + 1);

// Delete unused state variables
lines.splice(19, 34 - 19 + 1);

lines.splice(24, 32 - 24 + 1);

fs.writeFileSync('src/App.tsx', lines.join('\n'));
console.log('Done');
