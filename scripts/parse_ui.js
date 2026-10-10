const fs = require('fs');
const xml = fs.readFileSync('scripts/current_ui.xml', 'utf8');
const regex = /content-desc="([^"]+)"[^>]*bounds="([^"]+)"/g;
let match;
while ((match = regex.exec(xml)) !== null) {
  if (match[1].trim()) {
    console.log(`${match[1]} => ${match[2]}`);
  }
}
