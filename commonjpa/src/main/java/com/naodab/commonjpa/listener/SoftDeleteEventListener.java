package com.naodab.commonjpa.listener;

import java.time.LocalDateTime;

import org.hibernate.event.spi.EventSource;
import org.hibernate.event.spi.PreDeleteEvent;
import org.hibernate.event.spi.PreDeleteEventListener;

import com.naodab.commonjpa.annotation.SoftDelete;
import com.naodab.commonjpa.entity.BaseEntity;

public class SoftDeleteEventListener implements PreDeleteEventListener {

  @Override
  public boolean onPreDelete(PreDeleteEvent event) {
    Object entity = event.getEntity();
    System.out.println("SoftDelete triggered: " + entity.getClass());

    if (!entity.getClass().isAnnotationPresent(SoftDelete.class)) {
      return false;
    }

    if (!(entity instanceof BaseEntity)) {
      return false;
    }

    EventSource session = event.getSession();
    BaseEntity baseEntity = (BaseEntity) entity;

    baseEntity.setDeletedAt(LocalDateTime.now());
    baseEntity.setUpdatedAt(LocalDateTime.now());

    session.update(baseEntity);

    return true;
  }
}
