/*
 * create-icons.js
 *
 * Run: node create-icons.js
 *
 * Generates simple placeholder PNG icons for the extension.
 * These are minimal 1-color PNGs created purely in code without
 * any image libraries — using raw PNG binary format.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height) {
  /*
   * Build a minimal valid PNG file.
   * We'll draw a filled red circle on a dark blue background.
   */

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  function createChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(data.length, 0);

    const crcInput = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcInput);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);

    return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
  }

  // CRC32 implementation
  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[n] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return crc ^ 0xFFFFFFFF;
  }

  // IHDR data: width, height, bit depth, color type, compression, filter, interlace
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);    // bit depth
  ihdrData.writeUInt8(2, 9);    // color type (RGB)
  ihdrData.writeUInt8(0, 10);   // compression
  ihdrData.writeUInt8(0, 11);   // filter
  ihdrData.writeUInt8(0, 12);   // interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Generate pixel data
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const rawData = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // filter byte (none)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Red circle (microphone symbol)
        rawData[offset++] = 239; // R
        rawData[offset++] = 68;  // G
        rawData[offset++] = 68;  // B
      } else if (dist <= radius + 2) {
        // Border
        rawData[offset++] = 99;  // R
        rawData[offset++] = 102; // G
        rawData[offset++] = 241; // B
      } else {
        // Dark background
        rawData[offset++] = 15;  // R
        rawData[offset++] = 23;  // G
        rawData[offset++] = 42;  // B
      }
    }
  }

  // Compress
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Create icons directory
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons
const sizes = [16, 48, 128];
for (const size of sizes) {
  const png = createPNG(size, size);
  const filename = `icon${size}.png`;
  fs.writeFileSync(path.join(iconsDir, filename), png);
  console.log(`Created ${filename} (${png.length} bytes)`);
}

console.log('All icons generated successfully!');