
export interface Edit {
  id: string;
  type: 'text' | 'image' | 'drawing';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextEdit extends Edit {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
}

export interface ImageEdit extends Edit {
  type: 'image';
  src: string; // data URL
}

export type AnyEdit = TextEdit | ImageEdit;

// Add other edit types as needed
// export interface DrawingEdit extends Edit { ... }
