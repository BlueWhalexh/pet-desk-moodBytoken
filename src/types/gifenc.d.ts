// Minimal type stubs for `gifenc` (pure JS, no shipped types).
// Only the surface we use in src/lib/sticker-renderer.ts.
declare module "gifenc" {
  export type GifEncoderOptions = {
    auto?: boolean;
    initialCapacity?: number;
  };

  export type WriteFrameOptions = {
    palette?: number[][];
    delay?: number;
    transparent?: boolean;
    transparentIndex?: number;
    dispose?: number;
    repeat?: number;
    first?: boolean;
  };

  export type EncoderInstance = {
    writeFrame: (
      indexed: Uint8Array,
      width: number,
      height: number,
      opts?: WriteFrameOptions,
    ) => void;
    finish: () => void;
    bytes: () => Uint8Array;
    bytesView: () => Uint8Array;
  };

  export function GIFEncoder(opts?: GifEncoderOptions): EncoderInstance;

  export type QuantizeFormat = "rgba4444" | "rgba565" | "rgba888" | "rgb444";
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: { format?: QuantizeFormat; oneBitAlpha?: boolean | number },
  ): number[][];

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: QuantizeFormat,
  ): Uint8Array;
}
