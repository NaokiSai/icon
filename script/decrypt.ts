// src/decrypt.ts
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

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
  fs.mkdirSync(OUTPUT_DIR);
}

function decryptFile(inputPath: string, outputPath: string) {
  const data = fs.readFileSync(inputPath);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  fs.writeFileSync(outputPath, decrypted);
  console.log(`🔓 Decrypted: ${inputPath} → ${outputPath}`);
}

fs.readdirSync(INPUT_DIR)
  .filter(file => file.endsWith('.enc'))
  .forEach(file => {
    const inputPath = path.join(INPUT_DIR, file);
    const outputFileName = file.replace(/\.enc$/, '');
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    decryptFile(inputPath, outputPath);
  });

console.log('✅ All files decrypted.');
