package com.naodab.uploadservice.services.impl;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;
import com.naodab.uploadservice.services.UploadService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryService implements UploadService {

  Cloudinary cloudinary;

  @NonFinal
  @Value("${file.max-size}")
  Long maxSize;

  Set<String> ALLOWED_CONTENT_TYPES = Set.of(
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "image/svg+xml", "video/mp4", "video/webm", "application/pdf");

  @Override
  public String upload(MultipartFile file) {
    return upload(file, new HashMap<>());
  }

  @Override
  public String upload(MultipartFile file, Map<String, Object> options) {
    validate(file);
    try {
      Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), options);
      return (String) result.get("secure_url");
    } catch (IOException e) {
      throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAIL);
    }
  }

  @Override
  public String uploadFromUrl(String fileUrl) {
    if (fileUrl == null || fileUrl.isBlank())
      return null;
    try {
      Map<?, ?> result = cloudinary.uploader().upload(fileUrl, ObjectUtils.emptyMap());
      return (String) result.get("secure_url");
    } catch (IOException e) {
      throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAIL);
    }
  }

  @Override
  public String uploadBase64(String base64) {
    if (base64 == null || base64.isBlank())
      return null;

    String dataUri = base64.startsWith("data:") ? base64 : "data:applicaion/octet-stream;base64" + base64;
    try {
      Map<?, ?> result = cloudinary.uploader().upload(dataUri, ObjectUtils.emptyMap());
      return (String) result.get("secure_url");
    } catch (IOException e) {
      throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAIL);
    }
  }

  @Override
  public Set<String> upload(List<MultipartFile> files) {
    if (files == null || files.isEmpty()) {
      return new HashSet<>();
    }

    Set<String> urls = new HashSet<>();
    files.stream().forEach(file -> urls.add(upload(file)));

    return urls;
  }

  @Override
  public Boolean delete(String url) {
    if (url == null || url.isBlank())
      return false;

    String publicId = extractPublicId(url);
    try {
      Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
      String status = (String) result.get("result");
      return "ok".equalsIgnoreCase(status) || "not found".equalsIgnoreCase(status);
    } catch (IOException e) {
      throw new AppException(ErrorCode.CLOUDINARY_UPLOAD_FAIL);
    }
  }

  @Override
  public Boolean delete(List<String> urls) {
    if (urls == null || urls.isEmpty())
      return false;

    Boolean allDeleted = true;
    for (String url : urls) {
      if (Boolean.FALSE.equals(delete(url))) {
        allDeleted = false;
      }
    }

    return allDeleted;
  }

  @Override
  public String replace(String oldUrl, MultipartFile newFile) {
    delete(oldUrl);
    return upload(newFile);
  }

  @Override
  public String getUrl(String publicId) {
    if (publicId == null || publicId.isBlank())
      return null;

    return cloudinary.url().secure(true).generate(publicId);
  }

  @Override
  public void validate(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new AppException(ErrorCode.FILE_IS_EMPTY);
    }

    if (file.getSize() > maxSize * 1024 * 1024) {
      throw new AppException(ErrorCode.FILE_TOO_LARGE);
    }

    String contentFile = file.getContentType();
    if (contentFile == null || !ALLOWED_CONTENT_TYPES.contains(contentFile)) {
      throw new AppException(ErrorCode.NOT_ALLOWED_CONTENT_FILE);
    }
  }

  private String extractPublicId(String url) {
    String marker = "/upload";
    int idx = url.indexOf(marker);
    if (idx == -1)
      throw new IllegalArgumentException("Not a valid Cloudinary URL: " + url);

    String path = url.substring(idx + marker.length());
    if (path.matches("v\\d+/.*"))
      path = path.substring(path.indexOf('/') + 1);

    int dot = path.lastIndexOf('.');
    return (dot != -1) ? path.substring(0, dot) : path;
  }
}
