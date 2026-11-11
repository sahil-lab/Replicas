package dev.replicas.api.preflight;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PreflightController {
  @PostMapping("/api/v1/preflight")
  public PreflightResponse preflight(@Valid @RequestBody PreflightRequest request) {
    return new PreflightResponse(true, false, request.label().strip());
  }

  public record PreflightRequest(
      @NotBlank @Size(max = 80) String label,
      @NotNull @Min(1) @Max(900) Integer timeoutSeconds,
      @NotNull @Min(128) @Max(2048) Integer memoryMiB) {}

  public record PreflightResponse(boolean valid, boolean executionEnabled, String label) {}
}
