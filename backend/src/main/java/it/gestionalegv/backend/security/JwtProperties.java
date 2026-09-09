package it.gestionalegv.backend.security;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Binding type-safe delle proprietà JWT definite in application.yml
 * sotto la chiave {@code app.security}.
 */
@Component
@ConfigurationProperties(prefix = "app.security")
public class JwtProperties {

    private String jwtSecret;
    private long jwtExpirationMs;

    public String getJwtSecret() {
        return jwtSecret;
    }

    public void setJwtSecret(String jwtSecret) {
        this.jwtSecret = jwtSecret;
    }

    public long getJwtExpirationMs() {
        return jwtExpirationMs;
    }

    public void setJwtExpirationMs(long jwtExpirationMs) {
        this.jwtExpirationMs = jwtExpirationMs;
    }
}
