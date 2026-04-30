type CloudinaryUploadErrorResponse = {
  error?: {
    message?: string;
  };
};

type CloudinaryUploadSuccessResponse = {
  secure_url?: string;
};

const cloudName = (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined)?.trim();
const uploadPreset = (import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined)?.trim();

function getUploadUrl(): string {
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Thiếu cấu hình Cloudinary: cần VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
  // According to Cloudinary JS upload docs, browser unsigned upload posts to this endpoint.
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`;
}

export async function uploadImageToCloudinary(file: File, folder?: string): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("File upload không hợp lệ.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset ?? "");
  if (folder?.trim()) {
    formData.append("folder", folder.trim());
  }

  const res = await fetch(getUploadUrl(), {
    method: "POST",
    body: formData,
  });

  const payload = (await res.json().catch(() => ({}))) as
    | CloudinaryUploadErrorResponse
    | CloudinaryUploadSuccessResponse;

  if (!res.ok) {
    const cloudinaryMessage =
      "error" in payload ? payload.error?.message : undefined;
    throw new Error(
      cloudinaryMessage
        ? `Cloudinary upload lỗi: ${cloudinaryMessage}`
        : `Cloudinary upload thất bại (HTTP ${res.status}).`,
    );
  }

  if (!("secure_url" in payload) || !payload.secure_url) {
    throw new Error("Cloudinary không trả về secure_url.");
  }

  return payload.secure_url;
}
