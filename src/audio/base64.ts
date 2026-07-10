/**
 * base64文字列をArrayBufferに変換する。
 * fetch() でbase64 data URIを読むとiOS Safariで失敗するため、
 * atob() 経由でバイト列を組み立てる（旧実装と同一アルゴリズム）。
 */
export function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}
