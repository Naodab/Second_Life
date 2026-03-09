package com.naodab.commonjpa.hibernate;

import org.hibernate.boot.Metadata;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.hibernate.integrator.spi.Integrator;
import org.hibernate.service.spi.SessionFactoryServiceRegistry;

import com.naodab.commonjpa.listener.SoftDeleteEventListener;

public class SoftDeleteIntegrator implements Integrator {

  @Override
  public void integrate(
      Metadata metadata,
      SessionFactoryImplementor sessionFactory,
      SessionFactoryServiceRegistry serviceRegistry) {

    EventListenerRegistry registry =
        serviceRegistry.getService(EventListenerRegistry.class);

    registry.appendListeners(
        EventType.PRE_DELETE,
        new SoftDeleteEventListener());
  }

  @Override
  public void disintegrate(
      SessionFactoryImplementor sessionFactory,
      SessionFactoryServiceRegistry serviceRegistry) {}
}
