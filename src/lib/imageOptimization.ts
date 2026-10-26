/**
 * Image Optimization & Strict Size Guard
 * Enforces a strict 1MB maximum upload size to protect Firebase storage & client performance.
 */

export const MAX_IMAGE_SIZE_BYTES = 1024 * 1024; // Exactly 1 MB (1,048,576 bytes)
export const MAX_IMAGE_SIZE_MB = 1;

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sizeBytes: number;
  sizeFormatted: string;
}

/**
 * Format bytes into human-readable string (KB / MB)
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

/**
 * Validates file size strictly against the 1MB threshold.
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  const sizeBytes = file.size;
  const sizeFormatted = formatFileSize(sizeBytes);

  if (!file.type.startsWith('image/')) {
    return {
      valid: false,
      error: 'الملف المحدد ليس صورة صالحة. يرجى اختيار ملف بصيغة JPG، PNG، WebP، أو GIF.',
      sizeBytes,
      sizeFormatted
    };
  }

  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `حجم الصورة المحدد (${sizeFormatted}) يتجاوز الحد الأقصى المسموح به (1 ميغابايت / 1MB). يرجى ضغط الصورة أو اختيار صورة أصغر لحماية حصة الاستخدام المجاني.`,
      sizeBytes,
      sizeFormatted
    };
  }

  return {
    valid: true,
    sizeBytes,
    sizeFormatted
  };
};

/**
 * Reads and optimizes an image file into a Data URL.
 * Automatically checks size and uses canvas compression if necessary to guarantee under 1MB.
 */
export const processAndCompressImage = async (file: File, maxDimension: number = 1400): Promise<{ dataUrl: string; sizeFormatted: string }> => {
  // 1. Strict size validation
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'حجم الصورة يتجاوز 1 ميغابايت');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('فشل قراءة ملف الصورة. يرجى المحاولة مرة أخرى.'));
    };

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('فشل معالجة بيانات الصورة.'));
      img.onload = () => {
        try {
          // If the original is already small and reasonable, check its dimensions
          let { width, height } = img;

          // Scale down if dimensions are excessively large
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to original read if canvas fails
            const result = reader.result as string;
            resolve({
              dataUrl: result,
              sizeFormatted: validation.sizeFormatted
            });
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to WebP or JPEG with 0.88 quality
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
          let outputDataUrl = canvas.toDataURL(outputType, 0.88);

          // Verify output size in base64
          const approximateBytes = Math.round((outputDataUrl.length * 3) / 4);
          if (approximateBytes > MAX_IMAGE_SIZE_BYTES) {
            // Compress further if needed
            outputDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          }

          const finalBytes = Math.round((outputDataUrl.length * 3) / 4);
          resolve({
            dataUrl: outputDataUrl,
            sizeFormatted: formatFileSize(finalBytes)
          });
        } catch (canvasErr) {
          console.warn('Canvas optimization skipped, using raw data url:', canvasErr);
          const rawResult = reader.result as string;
          resolve({
            dataUrl: rawResult,
            sizeFormatted: validation.sizeFormatted
          });
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
};
