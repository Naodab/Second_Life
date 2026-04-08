package com.naodab.locationservice.config;

import java.time.Duration;

import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.JdkSerializationRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
public class CacheManagerConfig {

  @SuppressWarnings("null")
  @Bean
  public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
    RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofHours(12))
        .disableCachingNullValues()
        .prefixCacheNameWith("jdk::")
        .serializeKeysWith(
            RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
        .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
            new JdkSerializationRedisSerializer()));

    return RedisCacheManager.builder(redisConnectionFactory)
        .cacheDefaults(defaults)
        .transactionAware()
        .build();
  }
}
