package dev.replicas.api.system;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class SystemIntegrationTest {
  @Autowired private MockMvc mvc;
  @Autowired private JdbcTemplate jdbc;

  @Test
  void exposesRealMigratedInstallationMetadata() throws Exception {
    UUID installationId =
        jdbc.queryForObject(
            "SELECT installation_id FROM platform_metadata WHERE singleton = TRUE", UUID.class);
    assertThat(installationId).isNotNull();
    mvc.perform(get("/api/v1/system"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.service").value("replicas-orchestrator"))
        .andExpect(jsonPath("$.phase").value("phase-1"))
        .andExpect(jsonPath("$.database").value("up"))
        .andExpect(jsonPath("$.installationId").value(installationId.toString()))
        .andExpect(jsonPath("$.schemaVersion").value(1))
        .andExpect(jsonPath("$.createdAt").isString());
    assertThat(
            jdbc.queryForObject(
                "SELECT COUNT(*) FROM flyway_schema_history WHERE version = '1' AND success",
                Integer.class))
        .isEqualTo(1);
  }

  @Test
  void reportsLivenessAndDatabaseReadiness() throws Exception {
    mvc.perform(get("/actuator/health/liveness"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"));
    mvc.perform(get("/actuator/health/readiness"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("UP"))
        .andExpect(jsonPath("$.components").doesNotExist());
  }

  @Test
  void doesNotExposeConfigurationOrPrematureTaskOperations() throws Exception {
    mvc.perform(get("/actuator/env")).andExpect(status().isNotFound());
    mvc.perform(get("/agent-tasks")).andExpect(status().isNotFound());
  }
}
