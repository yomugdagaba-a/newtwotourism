package com.northwollo.tourism.config;

import org.apache.catalina.connector.Connector;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TomcatHttpToHttpsRedirectConfig {

    /**
     * Adds an HTTP connector on port 8080 that works alongside the HTTPS connector on 8443.
     * This allows the frontend proxy to connect via HTTP while browsers can use HTTPS directly.
     * 
     * Note: In production, you should use a proper reverse proxy (nginx) and disable HTTP.
     */
    @Bean
    public WebServerFactoryCustomizer<TomcatServletWebServerFactory> servletContainer() {
        return (factory) -> {
            Connector httpConnector = new Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL);
            httpConnector.setScheme("http");
            httpConnector.setPort(8080);
            httpConnector.setSecure(false);
            // Don't set redirect port - allow HTTP requests to be processed directly
            // This is needed for the Next.js proxy which connects via HTTP
            factory.addAdditionalTomcatConnectors(httpConnector);
        };
    }
}
