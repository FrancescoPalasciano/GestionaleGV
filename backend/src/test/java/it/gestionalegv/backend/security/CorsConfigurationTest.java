package it.gestionalegv.backend.security;

import it.gestionalegv.backend.health.HealthController;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.filter.CorsFilter;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CorsConfigurationTest {

    // CORS is independent of the JWT filter and user service; no database is needed.
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new HealthController())
            .addFilters(new CorsFilter(new SecurityConfig(null, null).corsConfigurationSource()))
            .build();

    @ParameterizedTest
    @ValueSource(strings = {
            "http://gestionale.51.38.98.213.sslip.io",
            "https://gestionale.51.38.98.213.sslip.io",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "https://tabacchipro.it",
            "https://www.tabacchipro.it"
    })
    void allowsPreflightAndHealthFromAuthorizedOrigins(String origin) throws Exception {
        mvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, origin)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "content-type,authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin));

        mvc.perform(get("/api/v1/health").header(HttpHeaders.ORIGIN, origin))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, origin));
    }

    @Test
    void rejectsUnauthorizedOrigins() throws Exception {
        mvc.perform(options("/api/v1/auth/login")
                        .header(HttpHeaders.ORIGIN, "http://gestionale.sslip.io.example.com")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "POST"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
