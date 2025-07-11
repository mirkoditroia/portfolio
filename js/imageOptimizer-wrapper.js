// Wrapper per esporre ImageOptimizer globalmente
import { ImageOptimizer, createResponsiveImage, createPictureElement } from './imageOptimizer.js';

// Esponi nel window object per compatibilità
window.ImageOptimizer = ImageOptimizer;
window.createResponsiveImage = createResponsiveImage;
window.createPictureElement = createPictureElement;

console.log('🖼️ ImageOptimizer wrapper caricato'); 