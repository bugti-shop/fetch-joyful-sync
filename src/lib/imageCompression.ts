/**
 * Image compression and WebP conversion utilities
 * Reduces file sizes while maintaining quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  convertToWebP?: boolean;
}

/**
 * Compresses and optionally converts an image to WebP format
 * @param file - The image file to compress
 * @param options - Compression options
 * @returns Promise with compressed image as Blob
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<Blob> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    convertToWebP = true,
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;
        
        if (width > height) {
          width = Math.min(width, maxWidth);
          height = width / aspectRatio;
        } else {
          height = Math.min(height, maxHeight);
          width = height * aspectRatio;
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with specified format
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        convertToWebP ? 'image/webp' : file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Converts a compressed blob back to a File object
 * @param blob - The blob to convert
 * @param originalFileName - Original file name
 * @param convertToWebP - Whether the file was converted to WebP
 * @returns File object
 */
export function blobToFile(
  blob: Blob,
  originalFileName: string,
  convertToWebP: boolean = true
): File {
  const extension = convertToWebP ? '.webp' : originalFileName.substring(originalFileName.lastIndexOf('.'));
  const nameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
  const newFileName = `${nameWithoutExt}${extension}`;
  
  return new File([blob], newFileName, { type: blob.type });
}

/**
 * Gets the size reduction percentage
 * @param originalSize - Original file size in bytes
 * @param compressedSize - Compressed file size in bytes
 * @returns Percentage string
 */
export function getSizeReduction(originalSize: number, compressedSize: number): string {
  const reduction = ((originalSize - compressedSize) / originalSize) * 100;
  return `${reduction.toFixed(1)}%`;
}
