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
        if (url != null && !url.trim().isEmpty()) {
            url = url.trim();
            if (!url.startsWith("jdbc:")) {
                url = "jdbc:" + url;
            }
            // Switch automatico a transaction mode (porta 6543) per evitare limiti di connessione (EMAXCONNSESSION)
            if (url.contains("pooler.supabase.com:5432")) {
                url = url.replace(":5432", ":6543");
            }
            if (url.contains("6543") && !url.contains("prepareThreshold")) {
                url += (url.contains("?") ? "&" : "?") + "prepareThreshold=0";
            }
        }
        return properties.initializeDataSourceBuilder()
                .url(url)
                .build();
    }
}
