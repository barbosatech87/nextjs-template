import 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'amp-story': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        standalone?: string;
        title?: string;
        publisher?: string;
        'publisher-logo-src'?: string;
        'poster-portrait-src'?: string | null;
      };
      'amp-story-page': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      'amp-story-grid-layer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        template?: string;
      };
      'amp-img': React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> & {
        layout?: string;
      };
      'amp-story-bookend': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        layout?: string;
      };
      'amp-video': React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement> & {
        layout?: string;
      };
      'amp-story-page-outlink': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        layout?: string;
        'cta-image'?: string; // Substituindo cta-text por cta-image (opcional válido)
        theme?: 'light' | 'dark' | 'custom';
      };
    }
  }
}