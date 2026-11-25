import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// MediaPipe's Emscripten WASM runtime writes TensorFlow Lite INFO diagnostics
// and recoverable streaming-WASM ArrayBuffer fallback notices to stderr -> console.error.
const originalConsoleError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const first = typeof args[0] === 'string' ? args[0].trimStart() : '';
  if (
    first.startsWith('INFO: Created TensorFlow Lite') ||
    first.startsWith('INFO: ') ||
    first.startsWith('WARNING: Logging before InitGoogleLogging()') ||
    first.startsWith('wasm streaming compile failed:') ||
    first === 'falling back to ArrayBuffer instantiation' ||
    /^[IW]\d{4}\s+\d{2}:\d{2}:\d{2}\.\d+/.test(first)
  ) {
    console.info(...args);
    return;
  }
  originalConsoleError(...args);
};

createRoot(document.getElementById('root')!).render(<App />);
