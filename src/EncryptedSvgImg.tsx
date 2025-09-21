import React, { useEffect, useRef, useState } from 'react';

type EncryptedImgProps = {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
};

const AES_KEY_HEX = import.meta.env.VITE_AES_KEY;
const AES_IV_HEX = import.meta.env.VITE_AES_IV;

// テキストとして復号する拡張子
const TEXT_EXTENSIONS = ['.svg'];

function arrayBufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buffer);
}

async function decryptAES256CBC(
  encryptedBuffer: ArrayBuffer,
  keyHex: string,
  ivHex: string
): Promise<ArrayBuffer> {
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const ivBytes = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: ivBytes },
    cryptoKey,
    encryptedBuffer
  );

  return decrypted;
}

// 拡張子から MIME タイプを推測
function guessMimeType(filename: string): string {
  const ext = filename.toLowerCase().replace(/\.enc$/, '');
  if (ext.endsWith('.svg')) return 'image/svg+xml';
  if (ext.endsWith('.png')) return 'image/png';
  if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

const EncryptedImg: React.FC<EncryptedImgProps> = ({ src, width = 100, height = 100, alt = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const encryptedBuffer = await res.arrayBuffer();
        const decryptedBuffer = await decryptAES256CBC(encryptedBuffer, AES_KEY_HEX, AES_IV_HEX);

        const mimeType = guessMimeType(src);
        const blob = new Blob([decryptedBuffer], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          throw new Error('Failed to load decrypted image.');
        };

        img.src = url;
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchAndRender();
  }, [src, width, height]);

  if (error) return <div style={{ color: 'red' }}>❌ Error: {error}</div>;

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      aria-label={alt}
      style={{ display: 'block' }}
    />
  );
};

export default EncryptedImg;
