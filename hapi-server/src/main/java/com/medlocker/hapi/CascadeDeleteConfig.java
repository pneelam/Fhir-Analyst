package com.medlocker.hapi;

import ca.uhn.fhir.jpa.api.config.DaoConfig;
import ca.uhn.fhir.jpa.interceptor.DeleteConflictInterceptor;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CascadeDeleteConfig {

    @Autowired
    private DaoConfig daoConfig;

    @PostConstruct
    public void enableCascadeDeletes() {
        daoConfig.setDeleteWithCascadeEnabled(true);
    }

    @Bean
    public DeleteConflictInterceptor deleteConflictInterceptor() {
        return new DeleteConflictInterceptor();
    }
}
