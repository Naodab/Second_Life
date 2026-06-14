package com.naodab.commonjpa.util;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

public final class AppDateTimes {

  public static final ZoneOffset ZONE = ZoneOffset.UTC;

  private AppDateTimes() {
  }

  public static LocalDateTime now() {
    return LocalDateTime.now(ZONE);
  }
}
