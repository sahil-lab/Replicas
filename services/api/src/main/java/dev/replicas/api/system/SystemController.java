package dev.replicas.api.system;

import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SystemController {
  private final JdbcTemplate jdbc;

  public SystemController(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  @GetMapping("/api/v1/system")
  public SystemResponse system() {
    return jdbc.queryForObject(
        """
        SELECT installation_id, created_at, schema_version
        FROM platform_metadata WHERE singleton = TRUE
        """,
        (result, row) ->
            new SystemResponse(
                "replicas-orchestrator",
                "phase-1",
                "up",
                result.getObject("installation_id", UUID.class),
                result.getTimestamp("created_at").toInstant(),
                result.getInt("schema_version")));
  }

  public record SystemResponse(
      String service,
      String phase,
      String database,
      UUID installationId,
      Instant createdAt,
      int schemaVersion) {}
}
