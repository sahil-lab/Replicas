package dev.replicas.api.http;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {
  private static final Logger LOG = LoggerFactory.getLogger(RequestLoggingFilter.class);

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String requestId = UUID.randomUUID().toString();
    response.setHeader("X-Request-Id", requestId);
    long start = System.nanoTime();
    try (MDC.MDCCloseable ignored = MDC.putCloseable("requestId", requestId)) {
      try {
        filterChain.doFilter(request, response);
      } finally {
        LOG.info(
            "http.request.completed method={} path={} status={} durationMs={}",
            request.getMethod(),
            request.getRequestURI(),
            response.getStatus(),
            TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - start));
      }
    }
  }
}
