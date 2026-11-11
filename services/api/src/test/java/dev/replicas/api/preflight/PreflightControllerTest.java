package dev.replicas.api.preflight;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.replicas.api.http.JsonConfiguration;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PreflightController.class)
@Import(JsonConfiguration.class)
class PreflightControllerTest {
  @Autowired private MockMvc mvc;

  @ParameterizedTest
  @CsvSource({"1,128", "900,2048", "300,512"})
  void acceptsValidBoundariesWithoutEnablingExecution(int timeout, int memory) throws Exception {
    mvc.perform(
            post("/api/v1/preflight")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"label":" synthetic-task ","timeoutSeconds":%d,"memoryMiB":%d}
                    """
                        .formatted(timeout, memory)))
        .andExpect(status().isOk())
        .andExpect(header().exists("X-Request-Id"))
        .andExpect(jsonPath("$.valid").value(true))
        .andExpect(jsonPath("$.executionEnabled").value(false))
        .andExpect(jsonPath("$.label").value("synthetic-task"))
        .andExpect(jsonPath("$.taskId").doesNotExist());
  }

  @Test
  void acceptsMaximumLabelLength() throws Exception {
    mvc.perform(
            post("/api/v1/preflight")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"label":"%s","timeoutSeconds":1,"memoryMiB":128}
                    """
                        .formatted("x".repeat(80))))
        .andExpect(status().isOk());
  }

  @ParameterizedTest
  @MethodSource("invalidRequests")
  void rejectsInvalidRequests(String body) throws Exception {
    mvc.perform(post("/api/v1/preflight").contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isBadRequest())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(400))
        .andExpect(jsonPath("$.detail").isString())
        .andExpect(jsonPath("$.valid").doesNotExist());
  }

  @Test
  void reportsFieldsWithoutEchoingRejectedValues() throws Exception {
    mvc.perform(
            post("/api/v1/preflight")
                .contentType(MediaType.APPLICATION_JSON)
                .content(
                    """
                    {"label":"safe-error-canary","timeoutSeconds":0,"memoryMiB":127}
                    """))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.errors.timeoutSeconds").exists())
        .andExpect(jsonPath("$.errors.memoryMiB").exists())
        .andExpect(content().string(not(containsString("safe-error-canary"))));
  }

  static Stream<String> invalidRequests() {
    return Stream.of(
        "{}",
        "null",
        "[]",
        "{invalid",
        """
        {"label":"","timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":"   ","timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":"%s","timeoutSeconds":1,"memoryMiB":128}
        """
            .formatted("x".repeat(81)),
        """
        {"timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":"x","memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":1}
        """,
        """
        {"label":"x","timeoutSeconds":null,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":0,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":901,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":1,"memoryMiB":127}
        """,
        """
        {"label":"x","timeoutSeconds":1,"memoryMiB":2049}
        """,
        """
        {"label":"x","timeoutSeconds":"1","memoryMiB":128}
        """,
        """
        {"label":12,"timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":1.5,"timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":true,"timeoutSeconds":1,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":1.5,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":true,"memoryMiB":128}
        """,
        """
        {"label":"x","timeoutSeconds":1,"memoryMiB":128,"extra":true}
        """);
  }
}
