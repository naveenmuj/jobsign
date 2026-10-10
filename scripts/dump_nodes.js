const fs = require('fs');
const file = process.argv[2] || 'scripts/window_dump.xml';
const xml = fs.readFileSync(file, 'utf8');
const regex = /<node[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*\/>|<node[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*>/g;
let m;
while ((m = regex.exec(xml)) !== null) {
  const line = m[0];
  const bMatch = line.match(/bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
  if (bMatch) {
    const [_, x1, y1, x2, y2] = bMatch.map(Number);
    const textMatch = line.match(/text="([^"]*)"/);
    const descMatch = line.match(/content-desc="([^"]*)"/);
    const text = (textMatch && textMatch[1]) || (descMatch && descMatch[1]) || '';
    if (text) {
      const cx = Math.round((x1 + x2) / 2);
      const cy = Math.round((y1 + y2) / 2);
      console.log(`[${cx}, ${cy}] "${text}" (bounds: [${x1},${y1}][${x2},${y2}])`);
    }
  }
}
