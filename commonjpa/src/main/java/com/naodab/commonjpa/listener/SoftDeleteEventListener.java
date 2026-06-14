package com.naodab.commonjpa.listener;

import org.hibernate.event.spi.EventSource;
import org.hibernate.event.spi.PreDeleteEvent;
import org.hibernate.event.spi.PreDeleteEventListener;

import com.naodab.commonjpa.annotation.SoftDelete;
import com.naodab.commonjpa.entity.BaseEntity;
import com.naodab.commonjpa.util.AppDateTimes;

public class SoftDeleteEventListener implements PreDeleteEventListener {

  @Override
  public boolean onPreDelete(PreDeleteEvent event) {
    Object entity = event.getEntity();

    if (!entity.getClass().isAnnotationPresent(SoftDelete.class)) {
      return false;
    }

    if (!(entity instanceof BaseEntity)) {
      return false;
    }

    EventSource session = event.getSession();
    BaseEntity baseEntity = (BaseEntity) entity;

    baseEntity.setDeletedAt(AppDateTimes.now());
    baseEntity.setUpdatedAt(AppDateTimes.now());

    session.merge(baseEntity);

    return true;
  }
}
