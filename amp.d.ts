import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'amp-story': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'amp-story-page': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'amp-story-grid-layer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'amp-img': React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
      'amp-story-bookend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'amp-video': React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
    }
  }
}