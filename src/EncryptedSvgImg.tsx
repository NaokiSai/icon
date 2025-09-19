import React, { useEffect, useState } from 'react';

type EncryptedSvgImgProps = {
  src: string;
  width?: number;
  height?: number;
  alt?: string;
};

const AES_KEY_HEX = import.meta.env.VITE_AES_KEY;
const AES_IV_HEX = import.meta.env.VITE_AES_IV;

// ArrayBuffer → 文字列
function arrayBufferToUtf8(buffer: ArrayBuffer): string {
  return new TextDecoder('utf-8').decode(buffer);
}

// 復号関数（AES-256-CBC）
async function decryptAES256CBC(encryptedBuffer: ArrayBuffer, keyHex: string, ivHex: string): Promise<string> {
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

  return arrayBufferToUtf8(decrypted);
}

const EncryptedSvgImg: React.FC<EncryptedSvgImgProps> = ({ src, width = 100, height = 100, alt = '' }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndDecrypt = async () => {
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

        const encryptedBuffer = await res.arrayBuffer();
        const decryptedSvgText = await decryptAES256CBC(encryptedBuffer, AES_KEY_HEX, AES_IV_HEX);

        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(decryptedSvgText, 'image/svg+xml');

        const serializedSvg = new XMLSerializer().serializeToString(svgDoc.documentElement);
        setSvgHtml(serializedSvg);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchAndDecrypt();
  }, [src]);

  if (error) return <div style={{ color: 'red' }}>❌ Error: {error}</div>;
  if (!svgHtml) return <div>Loading SVG...</div>;

  // ▼ インラインSVG表示 → 検証ツールで中身確認できる
  return (
    <div
      style={{ width, height }}
      aria-label={alt}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
      className='icon-list-item'
    />
  );
};

export default EncryptedSvgImg;
