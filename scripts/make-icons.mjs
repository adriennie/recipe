// Draws the app icon (orange tile, white bowl, steam) as PNGs with no dependencies.
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};

function draw(size, full) {
  const s = size / 512;
  const px = (x, y) => {
    const X = x / s, Y = y / s;
    // tile (rounded unless full-bleed for apple-touch-icon)
    if (!full) {
      const r = 112, cx = Math.min(Math.max(X, r), 512 - r), cy = Math.min(Math.max(Y, r), 512 - r);
      if ((X - cx) ** 2 + (Y - cy) ** 2 > r * r) return [0, 0, 0, 0];
    }
    // bowl: lower half-disc centered (256,236) radius 160
    if (Y >= 236 && (X - 256) ** 2 + (Y - 236) ** 2 <= 160 * 160) return [255, 255, 255, 255];
    // steam bars
    const bar = (x0, y0, h) => X >= x0 && X <= x0 + 28 && Y >= y0 && Y <= y0 + h;
    if (bar(176, 120, 84) || bar(242, 96, 108) || bar(308, 120, 84)) return [43, 33, 24, 255];
    return [242, 196, 90, 255];
  };
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const p = px(x + 0.5, y + 0.5);
      raw.set(p, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))
  ]);
}

writeFileSync('public/icon-192.png', draw(192, true));
writeFileSync('public/icon-512.png', draw(512, true));
writeFileSync('public/apple-touch-icon.png', draw(180, true));
console.log('icons written');
