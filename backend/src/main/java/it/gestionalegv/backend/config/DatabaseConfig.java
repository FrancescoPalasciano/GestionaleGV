package it.gestionalegv.backend.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(DataSourceProperties properties) {
        String url = properties.getUrl();
        if (url != null && !url.trim().isEmpty() && !url.startsWith("jdbc:")) {
            url = "jdbc:" + url.trim();
        }
        return properties.initializeDataSourceBuilder()
                .url(url)
                .build();
    }
}
