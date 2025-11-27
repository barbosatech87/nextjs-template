/* eslint-disable @typescript-eslint/no-explicit-any */

// IntrinsicElements are looked up on the global JSX namespace.
// We avoid top-level imports here to ensure this file is treated as a script/global declaration.

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