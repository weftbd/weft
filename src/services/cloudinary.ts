import { getLocalStoreSettings } from './settings';

export interface CloudinaryUploadResponse {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  publicId?: string;
  resourceType?: 'image' | 'video';
  format?: string;
  error?: string;
  fallback?: boolean;
}

/**
 * Helper to detect if a URL or file is a video
 */
export function isVideoMedia(urlOrType?: string, explicitMediaType?: 'image' | 'video'): boolean {
  if (explicitMediaType === 'video') return true;
  if (explicitMediaType === 'image') return false;
  if (!urlOrType) return false;
  const lower = urlOrType.toLowerCase();
  if (lower.startsWith('data:video/')) return true;
  if (lower.includes('/video/upload/')) return true;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(lower);
}

/**
 * Generate a clean, unique public_id prefix for Cloudinary uploads
 */
export function generateUniqueMediaName(originalFileName?: string): string {
  const sanitized = (originalFileName || 'media')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .substring(0, 30);

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `taarok_${sanitized}_${timestamp}_${randomStr}`;
}

/**
 * Fast client-side image compressor for high-resolution photos
 */
export async function compressImageForUpload(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<{ base64Data: string; blob?: Blob }> {
  return new Promise((resolve, reject) => {
    if (file.size < 200 * 1024 && file.type === 'image/webp') {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          base64Data: reader.result as string,
          blob: file,
        });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = Math.round(maxHeight);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ base64Data: reader.result as string, blob: file });
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const compressedDataUrl = canvas.toDataURL(outputType, quality);

      canvas.toBlob(
        (blob) => {
          resolve({
            base64Data: compressedDataUrl,
            blob: blob || file,
          });
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve({ base64Data: reader.result as string, blob: file });
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 15000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Resolve configured Cloudinary Cloud Name and Upload Preset from Store Settings or Env
 */
export function getCloudinaryConfig(): { cloudName: string; uploadPreset: string } {
  const metaEnv = ((import.meta as any) || {}).env || {};
  let storeCloudName = '';
  let storePreset = '';

  try {
    const settings = getLocalStoreSettings();
    storeCloudName = settings?.cloudinaryCloudName?.trim() || '';
    storePreset = settings?.cloudinaryUploadPreset?.trim() || '';
  } catch {
    // Ignore local read error
  }

  const cloudName =
    storeCloudName ||
    (metaEnv.VITE_CLOUDINARY_CLOUD_NAME as string)?.trim() ||
    'btvxkkav';

  const uploadPreset =
    storePreset ||
    (metaEnv.VITE_CLOUDINARY_UPLOAD_PRESET as string)?.trim() ||
    '';

  return { cloudName, uploadPreset };
}

/**
 * Upload an Image or Video file to Cloudinary.
 * Supports:
 * 1. Direct client-side unsigned upload to Cloudinary when uploadPreset is configured
 * 2. Server-side signed/unsigned upload via /api/upload/cloudinary
 * 3. Instant fallback preview if credentials are not yet entered so work is never lost
 */
export async function uploadMediaToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');

  if (!isImage && !isVideo) {
    return {
      success: false,
      error: 'অনুগ্রহ করে ছবি (JPG, PNG, WEBP) অথবা ভিডিও (MP4, WEBM, MOV) ফাইল আপলোড করুন।',
    };
  }

  const maxSizeInBytes = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024; // 100MB for video, 25MB for image
  if (file.size > maxSizeInBytes) {
    return {
      success: false,
      error: isVideo
        ? 'ভিডিওর সাইজ সর্বোচ্চ 100MB হতে পারে।'
        : 'ছবির সাইজ সর্বোচ্চ 25MB হতে পারে।',
    };
  }

  const resourceType: 'image' | 'video' = isVideo ? 'video' : 'image';
  const { cloudName, uploadPreset } = getCloudinaryConfig();

  // Prepare file / compressed image
  let uploadBlob: Blob | File = file;
  let fallbackDataUrl = '';

  if (isImage) {
    try {
      const compressed = await compressImageForUpload(file, 1600, 1600, 0.85);
      fallbackDataUrl = compressed.base64Data;
      if (compressed.blob) {
        uploadBlob = compressed.blob;
      }
    } catch (err) {
      console.warn('Image compression note:', err);
      fallbackDataUrl = await readFileAsDataUrl(file);
    }
  }

  // 1. If an unsigned Upload Preset and Cloud Name are configured, upload directly to Cloudinary CDN
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append('file', uploadBlob, file.name);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'taarok');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${encodeURIComponent(
        cloudName
      )}/${resourceType}/upload`;

      const directRes = await fetchWithTimeout(
        cloudinaryUrl,
        {
          method: 'POST',
          body: formData,
        },
        isVideo ? 45000 : 12000
      );

      if (directRes.ok) {
        const data = await directRes.json();
        if (data.secure_url) {
          const thumbUrl =
            resourceType === 'video'
              ? data.secure_url.replace(/\.[^/.]+$/, '.jpg')
              : data.secure_url;
          return {
            success: true,
            url: data.secure_url,
            thumbnailUrl: thumbUrl,
            publicId: data.public_id,
            resourceType,
            format: data.format,
          };
        }
      }
    } catch (err) {
      console.warn('Direct Cloudinary upload note, trying server proxy:', err);
    }
  }

  // 2. Try Server Proxy (/api/upload/cloudinary) which supports server-side API Key + Secret signing or Preset
  try {
    const fileDataUrl =
      fallbackDataUrl || (file.size <= 25 * 1024 * 1024 ? await readFileAsDataUrl(file) : '');

    if (fileDataUrl) {
      const proxyRes = await fetchWithTimeout(
        '/api/upload/cloudinary',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fileBase64: fileDataUrl,
            fileName: generateUniqueMediaName(file.name),
            resourceType,
            cloudName,
            uploadPreset,
          }),
        },
        isVideo ? 30000 : 10000
      );

      if (proxyRes.ok) {
        const data = await proxyRes.json();
        if (data.success && data.url) {
          return {
            success: true,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl || data.url,
            publicId: data.publicId,
            resourceType: data.resourceType || resourceType,
            fallback: data.fallback,
          };
        }
      }
    }
  } catch (err) {
    console.warn('Server Cloudinary proxy note:', err);
  }

  // 3. Safe fallback so admin user never loses their preview while setting up Cloudinary credentials
  if (isVideo) {
    const videoPreviewUrl =
      file.size <= 15 * 1024 * 1024 ? await readFileAsDataUrl(file) : URL.createObjectURL(file);
    return {
      success: true,
      url: videoPreviewUrl,
      thumbnailUrl: videoPreviewUrl,
      resourceType: 'video',
      fallback: true,
    };
  }

  return {
    success: true,
    url: fallbackDataUrl,
    thumbnailUrl: fallbackDataUrl,
    resourceType: 'image',
    fallback: true,
  };
}

export const uploadImageToCloudinary = uploadMediaToCloudinary;
export const uploadVideoToCloudinary = uploadMediaToCloudinary;
