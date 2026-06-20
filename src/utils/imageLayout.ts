import { ContentBlock, ImageLayout, ImageSize } from '../types';

export const IMAGE_SIZES: ImageSize[] = ['small', 'medium', 'large', 'full'];

export const IMAGE_LAYOUTS: ImageLayout[] = [
  'left',
  'right',
  'top',
  'bottom',
  'wrap-left',
  'wrap-right',
  'center',
];

export const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  full: 'Full',
};

export const IMAGE_LAYOUT_LABELS: Record<ImageLayout, string> = {
  left: 'Left',
  right: 'Right',
  top: 'Top',
  bottom: 'Bottom',
  'wrap-left': 'Wrap L',
  'wrap-right': 'Wrap R',
  center: 'Center',
};

export function getImageLayout(block: ContentBlock): ImageLayout {
  if (block.imageLayout) return block.imageLayout;
  return block.imagePosition === 'right' ? 'right' : 'left';
}

export function getImageSize(block: ContentBlock): ImageSize {
  return block.imageSize ?? 'medium';
}

export function isStackedLayout(layout: ImageLayout): boolean {
  return layout === 'top' || layout === 'bottom' || layout === 'center';
}

export function getNativeSideImageSize(size: ImageSize): { width: number; height: number } {
  switch (size) {
    case 'small':
      return { width: 96, height: 96 };
    case 'large':
      return { width: 168, height: 168 };
    case 'full':
      return { width: 200, height: 200 };
    default:
      return { width: 128, height: 128 };
  }
}

export function getNativeStackedImageStyle(size: ImageSize): {
  width: `${number}%`;
  height: number;
  alignSelf: 'center' | 'stretch';
} {
  switch (size) {
    case 'small':
      return { width: '55%', height: 120, alignSelf: 'center' };
    case 'large':
      return { width: '95%', height: 240, alignSelf: 'center' };
    case 'full':
      return { width: '100%', height: 280, alignSelf: 'stretch' };
    default:
      return { width: '80%', height: 180, alignSelf: 'center' };
  }
}

export function getNativeFullImageStyle(size: ImageSize): {
  width: `${number}%`;
  height: number;
  alignSelf: 'center' | 'stretch';
} {
  switch (size) {
    case 'small':
      return { width: '50%', height: 140, alignSelf: 'center' };
    case 'large':
      return { width: '90%', height: 280, alignSelf: 'center' };
    case 'full':
      return { width: '100%', height: 320, alignSelf: 'stretch' };
    default:
      return { width: '75%', height: 220, alignSelf: 'center' };
  }
}

export function getImageSizeClass(size: ImageSize): string {
  return `img-size-${size}`;
}

export function getLayoutClass(layout: ImageLayout): string {
  return `layout-${layout}`;
}

/** Table cell width for side-by-side PDF layouts */
export function getPdfImageCellWidth(size: ImageSize): string {
  switch (size) {
    case 'small':
      return '28%';
    case 'large':
      return '42%';
    case 'full':
      return '48%';
    default:
      return '35%';
  }
}

/** Max width for stacked / standalone images in PDF */
export function getPdfImageMaxWidth(size: ImageSize): string {
  switch (size) {
    case 'small':
      return '45%';
    case 'large':
      return '88%';
    case 'full':
      return '100%';
    default:
      return '68%';
  }
}

export function getPdfImageMaxHeight(size: ImageSize): string {
  switch (size) {
    case 'small':
      return '160px';
    case 'large':
      return '360px';
    case 'full':
      return '460px';
    default:
      return '260px';
  }
}
