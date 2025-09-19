// src/encrypt.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const INPUT_DIR = './icons';
const OUTPUT_DIR = './public/static/iconLibrary/icons';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.VITE_AES_KEY ?? '', 'hex');
const iv = Buffer.from(process.env.VITE_AES_IV ?? '', 'hex');

if (key.length !== 32 || iv.length !== 16) {
  throw new Error('❌ AES_KEY must be 32 bytes and AES_IV must be 16 bytes (in hex).');
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR);
}

// 任意の透かし文字列
const WATERMARK_COMMENT = '<!-- watermark: my_brand -->';
// または SVG上に見える形で入れる場合
const WATERMARK_TEXT = `
<text x="10" y="20" font-size="10" fill="gray" opacity="0.5">my_brand</text>
`;

function injectWatermark(svgContent: string): string {
  // SVGタグの前にコメントとして透かしを挿入
  if (!svgContent.includes('<svg')) return svgContent;

  // 透かしを <svg> タグの直後に挿入
  return svgContent.replace(
    /<svg[^>]*>/,
    match => `${match}\n  ${WATERMARK_COMMENT}\n  ${WATERMARK_TEXT}`
  );
}

function encryptFile(inputPath: string, outputPath: string) {
  let data = fs.readFileSync(inputPath, 'utf-8');

  // SVGに透かしを追加
  data = injectWatermark(data);

  // 暗号化
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data, 'utf-8'), cipher.final()]);

  fs.writeFileSync(outputPath, encrypted);
  console.log(`🔒 Encrypted: ${inputPath} → ${outputPath}`);
}

fs.readdirSync(INPUT_DIR)
  .filter(file => file.endsWith('.svg'))
  .forEach(file => {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file + '.enc');
    encryptFile(inputPath, outputPath);
  });

console.log('✅ All files watermarked and encrypted.');
