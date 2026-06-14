package com.naodab.locationservice.util;

import com.naodab.commonservice.exception.AppException;
import com.naodab.commonservice.exception.ErrorCode;

public final class CoordinateNormalizer {

  private CoordinateNormalizer() {
  }

  public record LonLat(float longitude, float latitude) {
  }

  public static LonLat normalize(float longitude, float latitude) {
    float lon = longitude;
    float lat = latitude;

    if (isVnLongitude(lon) && isVnLatitude(lat)) {
      return validated(lon, lat);
    }
    if (isVnLatitude(lon) && isVnLongitude(lat)) {
      return validated(lat, lon);
    }
    if (Math.abs(lat) > 90 && Math.abs(lon) <= 90) {
      return validated(lat, lon);
    }
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return validated(lon, lat);
  }

  private static LonLat validated(float longitude, float latitude) {
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      throw new AppException(ErrorCode.INVALID_INPUT);
    }
    return new LonLat(longitude, latitude);
  }

  public static LonLat fromHttpParams(float latitude, float longitude) {
    return normalize(longitude, latitude);
  }

  private static boolean isVnLatitude(float value) {
    return value >= 8f && value <= 24f;
  }

  private static boolean isVnLongitude(float value) {
    return value >= 102f && value <= 111f;
  }
}
