export interface ImgBBUploadResponse {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  deleteUrl?: string;
  error?: string;
}

export async function uploadImageToImgBB(file: File): Promise<ImgBBUploadResponse> {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: 'অনুগ্রহ করে JPG, JPEG, PNG অথবা WEBP ফরম্যাটের ছবি আপলোড করুন।',
    };
  }

  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeInBytes) {
    return {
      success: false,
      error: 'ছবির সাইজ সর্বোচ্চ 10MB হতে পারে।',
    };
  }

  // Convert file to base64 string
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  }).catch(() => null);

  if (!base64Data) {
    return {
      success: false,
      error: 'ছবিটি পড়তে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।',
    };
  }

  // 1. Try secure server backend proxy
  try {
    const response = await fetch('/api/upload/imgbb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64Data }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.url) {
        return {
          success: true,
          url: data.url,
          thumbnailUrl: data.thumbnailUrl || data.url,
          deleteUrl: data.deleteUrl,
        };
      }
    }
  } catch (err) {
    console.warn('Backend ImgBB upload proxy error:', err);
  }

  // 2. Direct client-side ImgBB upload fallback
  try {
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
    const formData = new FormData();
    formData.append('key', 'a50e33356154606bbc7c4c82300cc768');
    formData.append('image', cleanBase64);

    const directRes = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (directRes.ok) {
      const result = await directRes.json();
      if (result.success && result.data?.url) {
        return {
          success: true,
          url: result.data.url,
          thumbnailUrl: result.data.thumb?.url || result.data.url,
          deleteUrl: result.data.delete_url,
        };
      }
    }
  } catch (err) {
    console.warn('Direct ImgBB API fallback error:', err);
  }

  // 3. Client-side local dataUrl fallback
  return {
    success: true,
    url: base64Data,
    thumbnailUrl: base64Data,
  };
}
