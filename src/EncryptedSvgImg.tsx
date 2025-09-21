import React, { useEffect, useRef, useState } from 'react';

type EncryptedSvgImgProps = {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
};

const AES_KEY_HEX = import.meta.env.VITE_AES_KEY;
const AES_IV_HEX = import.meta.env.VITE_AES_IV;

function arrayBufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buffer);
}

async function decryptAES256CBC(
  encryptedBuffer: ArrayBuffer,
  keyHex: string,
  ivHex: string
): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const ivBytes = new Uint8Array(ivHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-CBC' },
    false,
    ['decrypt']
  );

  // const decrypted = await crypto.subtle.decrypt(
  //   { name: 'AES-CBC', iv: ivBytes },
  //   cryptoKey
  // );
const decrypted = await crypto.subtle.decrypt(
  { name: 'AES-CBC', iv: ivBytes },
  cryptoKey,
  encryptedBuffer
);
  return arrayBufferToUtf8(decrypted);
}

const EncryptedSvgImg: React.FC<EncryptedSvgImgProps> = ({ src, width = 100, height = 100, alt = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndRender = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const encryptedBuffer = await res.arrayBuffer();
        const decryptedSvgText = await decryptAES256CBC(encryptedBuffer, AES_KEY_HEX, AES_IV_HEX);

        const blob = new Blob([decryptedSvgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = () => {
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // 高解像度対応 (optional)
          canvas.width = width;
          canvas.height = height;
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // メモリリーク防止
          URL.revokeObjectURL(url);
        };

        img.onerror = () => {
          throw new Error('Failed to load decrypted SVG into image.');
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

export default EncryptedSvgImg;
