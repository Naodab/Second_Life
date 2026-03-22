package com.naodab.uploadservice.services.impl;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.cloudinary.Cloudinary;
import com.naodab.uploadservice.services.UploadService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CloudinaryService implements UploadService {

  Cloudinary cloudinary;

  @Async
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
      throw new RuntimeException("Failed to upload file to cloudinary", e);
    }
  }

  @Async
  @Override
  public String uploadFromUrl(String fileUrl) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Async
  @Override
  public String uploadBase64(String base64) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Async
  @Override
  public Set<String> upload(List<MultipartFile> files) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public Boolean delete(String url) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public Boolean delete(List<String> urls) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public String replace(String oldUrl, MultipartFile newFile) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public String getUrl(String publicId) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public String getSignedUrl(String publicId, long expireTime) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  @Override
  public void validate(MultipartFile file) {
    throw new UnsupportedOperationException("Not supported yet.");
  }

  private String extractPublicId(String url) {
    String marker = "/upload";
    int idx = url.indexOf(marker);
    if (idx == -1) throw new IllegalArgumentException("Not a valid Cloudinary URL: " + url);

    String path = url.substring(idx + marker.length());
    if (path.matches("v\\d+/.*")) path = path.substring(path.indexOf('/') + 1);

    int dot = path.lastIndexOf('.');
    return (dot != -1) ? path.substring(0, dot) : path;
  }
}
