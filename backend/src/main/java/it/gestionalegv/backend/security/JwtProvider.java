package it.gestionalegv.backend.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SecurityException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utility per generare e validare token JWT firmati con HMAC-SHA256.
 */
@Component
public class JwtProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtProvider.class);

    private final SecretKey key;
    private final long expirationMs;

    public JwtProvider(JwtProperties props) {
        this.key = Keys.hmacShaKeyFor(props.getJwtSecret().getBytes(StandardCharsets.UTF_8));
        this.expirationMs = props.getJwtExpirationMs();
    }

    /**
     * Genera un token JWT con subject = email e claim custom.
     */
    public String generateToken(Long id, String email, boolean active) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(email)
                .claim("id", id)
                .claim("active", active)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /**
     * Estrae l'email (subject) dal token.
     */
    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    /**
     * Estrae l'ID dal token.
     */
    public Long getIdFromToken(String token) {
        return parseClaims(token).get("id", Long.class);
    }

    /**
     * Valida il token: firma, scadenza, formato.
     *
     * @return {@code true} se il token è valido
     */
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (SecurityException e) {
            log.error("Firma JWT non valida: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Token JWT malformato: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("Token JWT scaduto: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("Token JWT non supportato: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("Token JWT vuoto: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
