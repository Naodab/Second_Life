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

/** Khớp với “Max file size” của upload preset trên Cloudinary (bytes). Không set = không kiểm tra sớm trên client. */
function parseMaxVideoBytes(): number | undefined {
  const raw = (import.meta.env.VITE_CLOUDINARY_MAX_VIDEO_BYTES as string | undefined)?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

const maxVideoBytesClient = parseMaxVideoBytes();

function assertVideoSizeAllowed(file: File): void {
  if (maxVideoBytesClient == null) return;
  if (file.size > maxVideoBytesClient) {
    const mb = (maxVideoBytesClient / (1024 * 1024)).toFixed(
      maxVideoBytesClient >= 1024 * 1024 ? 0 : 1,
    );
    throw new Error(
      `Video lớn hơn ${mb} MB (giới hạn đã cấu hình trong ứng dụng). Nén video, chọn file nhỏ hơn, hoặc tăng VITE_CLOUDINARY_MAX_VIDEO_BYTES sau khi đã tăng Max file size trên Cloudinary preset.`,
    );
  }
}

function cloudinaryUploadErrorMessage(cloudinaryMessage: string | undefined, httpStatus: number): string {
  if (cloudinaryMessage) {
    const sizeHint =
      /file size too large|maximum is/i.test(cloudinaryMessage)
        ? " Tăng “Max file size” của upload preset trên Cloudinary (Console → Settings → Upload → Upload presets), hoặc dùng preset riêng cho video. Gói dịch vụ cũng có thể có trần riêng."
        : "";
    return `Cloudinary upload lỗi: ${cloudinaryMessage}.${sizeHint}`;
  }
  return `Cloudinary upload thất bại (HTTP ${httpStatus}).`;
}

function assertCloudinaryConfig(): void {
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Thiếu cấu hình Cloudinary: cần VITE_CLOUDINARY_CLOUD_NAME và VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
}

function getImageUploadUrl(): string {
  assertCloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName!)}/image/upload`;
}

function getVideoUploadUrl(): string {
  assertCloudinaryConfig();
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName!)}/video/upload`;
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

  const res = await fetch(getImageUploadUrl(), {
    method: "POST",
    body: formData,
  });

  const payload = (await res.json().catch(() => ({}))) as
    | CloudinaryUploadErrorResponse
    | CloudinaryUploadSuccessResponse;

  if (!res.ok) {
    const cloudinaryMessage =
      "error" in payload ? payload.error?.message : undefined;
    throw new Error(cloudinaryUploadErrorMessage(cloudinaryMessage, res.status));
  }

  if (!("secure_url" in payload) || !payload.secure_url) {
    throw new Error("Cloudinary không trả về secure_url.");
  }

  return payload.secure_url;
}

export async function uploadVideoToCloudinary(file: File, folder?: string): Promise<string> {
  if (!(file instanceof File)) {
    throw new Error("File upload không hợp lệ.");
  }
  assertVideoSizeAllowed(file);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset ?? "");
  if (folder?.trim()) {
    formData.append("folder", folder.trim());
  }

  const res = await fetch(getVideoUploadUrl(), {
    method: "POST",
    body: formData,
  });

  const payload = (await res.json().catch(() => ({}))) as
    | CloudinaryUploadErrorResponse
    | CloudinaryUploadSuccessResponse;

  if (!res.ok) {
    const cloudinaryMessage =
      "error" in payload ? payload.error?.message : undefined;
    throw new Error(cloudinaryUploadErrorMessage(cloudinaryMessage, res.status));
  }

  if (!("secure_url" in payload) || !payload.secure_url) {
    throw new Error("Cloudinary không trả về secure_url.");
  }

  return payload.secure_url;
}
