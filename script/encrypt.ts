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
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// 対応拡張子
const SUPPORTED_EXTENSIONS = ['.svg', '.png', '.jpg', '.jpeg'];

function encryptFile(inputPath: string, outputPath: string, isText: boolean) {
  const data = isText
    ? Buffer.from(fs.readFileSync(inputPath, 'utf-8'), 'utf-8') // SVG
    : fs.readFileSync(inputPath); // PNG, JPG (バイナリ)

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  fs.writeFileSync(outputPath, encrypted);
  console.log(`🔒 Encrypted: ${inputPath} → ${outputPath}`);
}

fs.readdirSync(INPUT_DIR)
  .filter(file => {
    const ext = path.extname(file).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(ext);
  })
  .forEach(file => {
    const ext = path.extname(file).toLowerCase();
    const isText = ext === '.svg'; // SVGはテキスト、それ以外はバイナリ
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file + '.enc');
    encryptFile(inputPath, outputPath, isText);
  });

console.log('✅ All supported files encrypted.');
