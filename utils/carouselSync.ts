import React from 'react';
import { ScrollView } from 'react-native';

// Global carousel synchronization
export interface CarouselRef {
  ref: React.RefObject<ScrollView | null>;
  index: React.MutableRefObject<number>;
  itemCount: number;
  cardWidthWithMargin: number;
}

let globalCarousels: CarouselRef[] = [];
let globalIsManualScrolling = false;
let globalManualScrollTimeout: ReturnType<typeof setTimeout> | null = null;
let globalAutoScrollInterval: ReturnType<typeof setInterval> | null = null;

export const registerCarousel = (carousel: CarouselRef) => {
  const existingIndex = globalCarousels.findIndex(c => c.ref === carousel.ref);
  if (existingIndex >= 0) {
    globalCarousels[existingIndex] = carousel;
  } else {
    globalCarousels.push(carousel);
  }
};

export const unregisterCarousel = (ref: React.RefObject<ScrollView | null>) => {
  globalCarousels = globalCarousels.filter(c => c.ref !== ref);
};

export const updateCarousel = (ref: React.RefObject<ScrollView | null>, itemCount: number, cardWidthWithMargin: number) => {
  const carousel = globalCarousels.find(c => c.ref === ref);
  if (carousel) {
    carousel.itemCount = itemCount;
    carousel.cardWidthWithMargin = cardWidthWithMargin;
  }
};

export const startGlobalAutoScroll = () => {
  if (globalAutoScrollInterval) return;
  
  globalAutoScrollInterval = setInterval(() => {
    if (globalIsManualScrolling || globalCarousels.length === 0) return;
    
    globalCarousels.forEach(carousel => {
      if (carousel.itemCount === 0 || !carousel.ref.current) return;
      
      carousel.index.current++;
      if (carousel.index.current >= carousel.itemCount * 2) {
        carousel.index.current = carousel.itemCount;
        carousel.ref.current.scrollTo({ 
          x: carousel.itemCount * carousel.cardWidthWithMargin, 
          animated: false 
        });
      }
      carousel.ref.current.scrollTo({ 
        x: carousel.index.current * carousel.cardWidthWithMargin, 
        animated: true 
      });
    });
  }, 2000);
};

export const stopGlobalAutoScroll = () => {
  if (globalAutoScrollInterval) {
    clearInterval(globalAutoScrollInterval);
    globalAutoScrollInterval = null;
  }
};

export const onGlobalScrollBeginDrag = () => {
  globalIsManualScrolling = true;
  if (globalManualScrollTimeout) {
    clearTimeout(globalManualScrollTimeout);
    globalManualScrollTimeout = null;
  }
};

export const onGlobalScrollEndDrag = () => {
  globalManualScrollTimeout = setTimeout(() => {
    globalIsManualScrolling = false;
  }, 2000);
};

export const getCarouselCount = () => globalCarousels.length;
