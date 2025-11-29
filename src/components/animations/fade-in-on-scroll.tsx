"use client";

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: number; // Atraso opcional em milissegundos
}

export const FadeInOnScroll: React.FC<FadeInOnScrollProps> = ({ children, className, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Usa um timeout para o atraso
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
            observer.unobserve(entry.target); // Anima apenas uma vez
          }
        });
      },
      {
        threshold: 0.1, // Dispara quando 10% do elemento está visível
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [delay]);

  return (
    <div
      ref={elementRef}
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5',
        className
      )}
    >
      {children}
    </div>
  );
};