package com.northwollo.tourism.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("North Wollo Tourism API")
                        .description("Tourism Management System REST API - A comprehensive API for managing tourism places, hotels, bookings, and travel information in North Wollo, Ethiopia.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Woldia University - Software Engineering")
                                .email("contact@wdu.edu.et"))
                        .license(new License()
                                .name("Educational Use")
                                .url("https://wdu.edu.et")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT token")));
    }
}
