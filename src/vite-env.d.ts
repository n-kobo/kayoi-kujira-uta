/// <reference types="vite/client" />

declare module '*.b64?raw' {
  const content: string;
  export default content;
}
