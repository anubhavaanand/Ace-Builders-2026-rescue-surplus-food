import zlib from 'zlib';
import fs from 'fs';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

const SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const BG = [22, 163, 74];      // #16a34a
const FG = [255, 255, 255];    // white circle

function makePng(size) {
  const radius = size * 0.35;
  const centre = size / 2;
  const r2 = radius * radius;
  const stride = 1 + size * 3;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y++) {
    const rowStart = y * stride;
    raw[rowStart] = 0; // filter type 0 (None)
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - centre;
      const dy = y + 0.5 - centre;
      const colour = dx * dx + dy * dy <= r2 ? FG : BG;
      const p = rowStart + 1 + x * 3;
      raw[p] = colour[0];
      raw[p + 1] = colour[1];
      raw[p + 2] = colour[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);  // width
  ihdr.writeUInt32BE(size, 4);  // height
  ihdr[8] = 8;                  // bit depth
  ihdr[9] = 2;                  // colour type: RGB
  ihdr[10] = 0;                 // compression method
  ihdr[11] = 0;                 // filter method
  ihdr[12] = 0;                 // interlace: none

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const targets = [
  { size: 192, path: 'client/public/icon-192.png' },
  { size: 512, path: 'client/public/icon-512.png' },
];

for (const { size, path } of targets) {
  const png = makePng(size);
  fs.writeFileSync(path, png);
  console.log(`${path}: ${png.length} bytes`);
}
