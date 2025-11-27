/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'amp-story': any;
      'amp-story-page': any;
      'amp-story-grid-layer': any;
      'amp-img': any;
      'amp-story-bookend': any;
      'amp-video': any;
    }
  }
}