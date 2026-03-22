package com.naodab.uploadservice.services;

import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.web.multipart.MultipartFile;

public interface UploadService {
  String upload(MultipartFile file);
  String upload(MultipartFile file, Map<String, Object> options);
  String uploadFromUrl(String fileUrl);
  String uploadBase64(String base64);
  Set<String> upload(List<MultipartFile> files);

  Boolean delete(String url);
  Boolean delete(List<String> urls);

  String replace(String oldUrl, MultipartFile newFile);

  String getUrl(String publicId);
  String getSignedUrl(String publicId, long expireTime);

  void validate(MultipartFile file);
}
