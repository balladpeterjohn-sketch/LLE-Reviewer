import { ContentBlock, ImageLayout, ImageSize, ImageWrap } from '../types';

export const IMAGE_SIZES: ImageSize[] = ['small', 'medium', 'large', 'full'];

export const IMAGE_LAYOUTS: ImageLayout[] = [
  'left',
  'right',
  'top',
  'bottom',
  'center',
  'wrap-left',
  'wrap-right',
  'magazine-left',
  'magazine-right',
  'inset-left',
  'inset-right',
  'banner',
];

export const IMAGE_SIZE_LABELS: Record<ImageSize, string> = {
  small: 'S',
  medium: 'M',
  large: 'L',
  full: 'Full',
};

export const IMAGE_LAYOUT_LABELS: Record<ImageLayout, string> = {
  left: 'Img Left',
  right: 'Img Right',
  top: 'Img Above',
  bottom: 'Img Below',
  'wrap-left': 'Float L',
  'wrap-right': 'Float R',
  center: 'Centered',
  'magazine-left': 'Magazine L',
  'magazine-right': 'Magazine R',
  'inset-left': 'Inset L',
  'inset-right': 'Inset R',
  banner: 'Banner',
};

export const IMAGE_LAYOUT_ICONS: Record<ImageLayout, string> = {
  left: '▣ ≡',
  right: '≡ ▣',
  top: '▣\n≡',
  bottom: '≡\n▣',
  'wrap-left': '⊡ ≡',
  'wrap-right': '≡ ⊡',
  center: '▥',
  'magazine-left': '▬ ≡',
  'magazine-right': '≡ ▬',
  'inset-left': '⊡≡',
  'inset-right': '≡⊡',
  banner: '▬',
};

export const IMAGE_LAYOUT_DESCRIPTIONS: Record<ImageLayout, string> = {
  left: 'Small image · text right',
  right: 'Text left · small image',
  top: 'Image above · text below',
  bottom: 'Text above · image below',
  'wrap-left': 'Text flows around image (left)',
  'wrap-right': 'Text flows around image (right)',
  center: 'Centered image · text below',
  'magazine-left': 'Large half-page image left',
  'magazine-right': 'Large half-page image right',
  'inset-left': 'Tiny image inset left',
  'inset-right': 'Tiny image inset right',
  banner: 'Full-width banner image',
};

export function getImageLayout(block: ContentBlock): ImageLayout {
  if (block.imageLayout) return block.imageLayout;
  return block.imagePosition === 'right' ? 'right' : 'left';
}

export function getImageSize(block: ContentBlock): ImageSize {
  return block.imageSize ?? 'small';
}

export function isStackedLayout(layout: ImageLayout): boolean {
  return layout === 'top' || layout === 'bottom' || layout === 'center' || layout === 'banner';
}

export function isMagazineLayout(layout: ImageLayout): boolean {
  return layout === 'magazine-left' || layout === 'magazine-right';
}

export function isInsetLayout(layout: ImageLayout): boolean {
  return layout === 'inset-left' || layout === 'inset-right';
}

export function getNativeSideImageSize(size: ImageSize): { width: number; height: number } {
  switch (size) {
    case 'small':  return { width: 96, height: 96 };
    case 'large':  return { width: 168, height: 168 };
    case 'full':   return { width: 200, height: 200 };
    default:       return { width: 128, height: 128 };
  }
}

export function getNativeMagazineImageSize(size: ImageSize): { height: number } {
  switch (size) {
    case 'small':  return { height: 140 };
    case 'large':  return { height: 220 };
    case 'full':   return { height: 260 };
    default:       return { height: 180 };
  }
}

export function getNativeInsetImageSize(_size: ImageSize): { width: number; height: number } {
  return { width: 72, height: 72 };
}

export function getNativeBannerImageSize(size: ImageSize): { height: number } {
  switch (size) {
    case 'small':  return { height: 120 };
    case 'large':  return { height: 220 };
    case 'full':   return { height: 260 };
    default:       return { height: 170 };
  }
}

export function getNativeStackedImageStyle(size: ImageSize): {
  width: `${number}%`;
  height: number;
  alignSelf: 'center' | 'stretch';
} {
  switch (size) {
    case 'small':  return { width: '55%', height: 120, alignSelf: 'center' };
    case 'large':  return { width: '95%', height: 240, alignSelf: 'center' };
    case 'full':   return { width: '100%', height: 280, alignSelf: 'stretch' };
    default:       return { width: '80%', height: 180, alignSelf: 'center' };
  }
}

export function getNativeFullImageStyle(size: ImageSize): {
  width: `${number}%`;
  height: number;
  alignSelf: 'center' | 'stretch';
} {
  switch (size) {
    case 'small':  return { width: '40%', height: 110, alignSelf: 'center' };
    case 'large':  return { width: '85%', height: 240, alignSelf: 'center' };
    case 'full':   return { width: '100%', height: 280, alignSelf: 'stretch' };
    default:       return { width: '60%', height: 170, alignSelf: 'center' };
  }
}

export const IMAGE_WRAP_OPTIONS: ImageWrap[] = ['none', 'wrap-left', 'wrap-right'];

export const IMAGE_WRAP_LABELS: Record<ImageWrap, string> = {
  none: 'No Wrap',
  'wrap-left': 'Float Left',
  'wrap-right': 'Float Right',
};

export function getImageWrap(block: ContentBlock): ImageWrap {
  return block.imageWrap ?? 'none';
}

export function hasImageWrapText(block: ContentBlock): boolean {
  const wrap = getImageWrap(block);
  return (wrap === 'wrap-left' || wrap === 'wrap-right') && !!block.text?.trim();
}

export function getImageSizeClass(size: ImageSize): string {
  return `img-size-${size}`;
}

export function getLayoutClass(layout: ImageLayout): string {
  return `layout-${layout}`;
}

export function getPdfImageCellWidth(size: ImageSize): string {
  switch (size) {
    case 'small':  return '28%';
    case 'large':  return '42%';
    case 'full':   return '48%';
    default:       return '35%';
  }
}

export function getPdfMagazineWidth(_size: ImageSize): string {
  return '48%';
}

export function getPdfImageMaxWidth(size: ImageSize): string {
  switch (size) {
    case 'small':  return '32%';
    case 'large':  return '72%';
    case 'full':   return '100%';
    default:       return '50%';
  }
}

export function getPdfImageMaxHeight(size: ImageSize): string {
  switch (size) {
    case 'small':  return '120px';
    case 'large':  return '280px';
    case 'full':   return '400px';
    default:       return '200px';
  }
}
