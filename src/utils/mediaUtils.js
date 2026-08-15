/**
 * HafA DIGITAL - Client-Side Image Compression & Media Utilities
 */

/**
 * Compresses a Base64 image data URL string using HTML5 Canvas.
 * Scales down dimensions to maxWidth while maintaining aspect ratio,
 * and encodes to JPEG strictly under 300KB.
 * 
 * @param {string} base64Str - Base64 data URL or raw image URL
 * @param {number} maxWidth - Maximum allowed width in pixels (default: 1000)
 * @param {number} quality - Initial JPEG quality (0.0 to 1.0, default: 0.7)
 * @returns {Promise<string>} Promise resolving to compressed Base64 JPEG data URL
 */
export const compressImage = (base64Str, maxWidth = 1000, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string') {
      return resolve(base64Str || '');
    }

    const trimmed = base64Str.trim();
    if (!trimmed || !trimmed.startsWith('data:image/')) {
      return resolve(trimmed);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Scale down dimensions if width exceeds maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let currentQuality = quality;
      let compressedData = canvas.toDataURL('image/jpeg', currentQuality);

      // Target size < 300KB -> Base64 string length limit (~300 * 1024 * 1.33 ≈ 408,576 chars)
      const MAX_BASE64_LENGTH = 300 * 1024 * 1.33;

      // Iteratively reduce quality if compressed size still exceeds 300KB limit
      while (compressedData.length > MAX_BASE64_LENGTH && currentQuality > 0.2) {
        currentQuality -= 0.15;
        compressedData = canvas.toDataURL('image/jpeg', currentQuality);
      }

      console.log(`[mediaUtils] Image compressed: ${Math.round(trimmed.length / 1024)}KB -> ${Math.round(compressedData.length / 1024)}KB (quality: ${currentQuality.toFixed(2)})`);
      resolve(compressedData);
    };

    img.onerror = (err) => {
      console.warn('[mediaUtils] Image load error during compression, returning original:', err);
      resolve(trimmed);
    };

    img.src = trimmed;
  });
};
