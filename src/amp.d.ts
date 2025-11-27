/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

// Garante que este arquivo seja tratado como um módulo para permitir declare global
export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'amp-story': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
      'amp-story-page': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
      'amp-story-grid-layer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
      'amp-img': React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & { [key: string]: any };
      'amp-story-bookend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { [key: string]: any };
      'amp-video': React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement> & { [key: string]: any };
    }
  }
}