/* eslint-disable @typescript-eslint/no-explicit-any */

// Este arquivo aumenta o namespace global JSX para incluir elementos AMP.
// É intencionalmente mantido simples, sem importações/exportações, para garantir que seja tratado como um script global.

declare namespace JSX {
  interface IntrinsicElements {
    'amp-story': any;
    'amp-story-page': any;
    'amp-story-grid-layer': any;
    'amp-img': any;
    'amp-story-bookend': any;
    'amp-video': any;
  }
}