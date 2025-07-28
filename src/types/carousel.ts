export interface Slide {
  el: HTMLElement;
  rendered: boolean;
}

export interface CarouselOptions {
  margin?: number;
  width?: number;
  nextMinSlideRate?: number;
  freeMode?: boolean;
  responsive?: boolean;
  loop?: boolean;
  centering?: boolean;
  navigation?: boolean | NavigationOptions;
  pagination?: boolean | PaginationOptions;
}

export interface NavigationOptions {
  color?: string;
  size?: string;
  theme?: 'circle' | 'shadow';
  type?: 'text' | 'svg';
  hoverHighlight?: boolean;
}

export interface PaginationOptions {
  color?: string;
  size?: string;
  position?: 'inside' | 'outside';
}
