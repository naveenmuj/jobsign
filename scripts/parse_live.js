const fs = require('fs');
const xml = fs.readFileSync('scripts/live_dump.xml', 'utf8');
const regex = /<node[^>]*content-desc="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
let m;
while ((m = regex.exec(xml)) !== null) {
  console.log(`${m[1]} => [${m[2]},${m[3]}][${m[4]},${m[5]}]`);
}
