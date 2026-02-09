import { PNG } from 'pngjs'
import { writeFileSync, mkdirSync } from 'node:fs'

function makeIcon(size) {
  const png = new PNG({ width: size, height: size })
  // background solid (dark)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2
      png.data[idx + 0] = 17   // R
      png.data[idx + 1] = 17   // G
      png.data[idx + 2] = 17   // B
      png.data[idx + 3] = 255  // A
    }
  }

  // simple “coin” circle
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.28
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx
      const dy = y - cy
      if (dx * dx + dy * dy <= r * r) {
        const idx = (size * y + x) << 2
        png.data[idx + 0] = 245
        png.data[idx + 1] = 197
        png.data[idx + 2] = 66
        png.data[idx + 3] = 255
      }
    }
  }

  return PNG.sync.write(png)
}

mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', makeIcon(192))
writeFileSync('public/icons/icon-512.png', makeIcon(512))

console.log('Icons generated: public/icons/icon-192.png, icon-512.png')
