package com.naodab.commonservice.constant;

public class AppRegexp {
  public static final String PHONE_NUMBER_REGEX = "^(\\+84|0)\\d{9}$";
  public static final String CHARACTER_ONLY_REGEX = "^[\\p{L}\\s]+$";
  public static final String NUMBER_ONLY_REGEX = "^\\d+$";
  public static final String BANK_ACCOUNT_NUMBER_REGEX = "^\\d{10,19}$";
}
