// src/decrypt.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const INPUT_DIR = './encrypted';
const OUTPUT_DIR = './decrypted';

const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.VITE_AES_KEY ?? '', 'hex');
const iv = Buffer.from(process.env.VITE_AES_IV ?? '', 'hex');

if (key.length !== 32 || iv.length !== 16) {
  throw new Error('❌ AES_KEY must be 32 bytes and AES_IV must be 16 bytes (in hex).');
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// テキストファイルとして出力する拡張子（他はバイナリ）
const TEXT_EXTENSIONS = ['.svg'];

function decryptFile(inputPath: string, outputPath: string, isText: boolean) {
  const encrypted = fs.readFileSync(inputPath);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  if (isText) {
    fs.writeFileSync(outputPath, decrypted.toString('utf-8'), 'utf-8');
  } else {
    fs.writeFileSync(outputPath, decrypted);
  }

  console.log(`🔓 Decrypted: ${inputPath} → ${outputPath}`);
}

fs.readdirSync(INPUT_DIR)
  .filter(file => file.endsWith('.enc'))
  .forEach(file => {
    const inputPath = path.join(INPUT_DIR, file);
    const originalFileName = file.replace(/\.enc$/, '');
    const ext = path.extname(originalFileName).toLowerCase();
    const isText = TEXT_EXTENSIONS.includes(ext);

    const outputPath = path.join(OUTPUT_DIR, originalFileName);
    decryptFile(inputPath, outputPath, isText);
  });

console.log('✅ All files decrypted.');
