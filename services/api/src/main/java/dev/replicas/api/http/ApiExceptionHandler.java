package dev.replicas.api.http;

import java.util.Map;
import java.util.TreeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
  private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @Override
  protected ResponseEntity<Object> handleMethodArgumentNotValid(
      MethodArgumentNotValidException exception,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    Map<String, String> errors = new TreeMap<>();
    exception
        .getBindingResult()
        .getFieldErrors()
        .forEach(error -> errors.putIfAbsent(error.getField(), error.getDefaultMessage()));
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, "Request validation failed.");
    problem.setTitle("Invalid request");
    problem.setProperty("errors", errors);
    return handleExceptionInternal(exception, problem, headers, status, request);
  }

  @Override
  protected ResponseEntity<Object> handleHttpMessageNotReadable(
      HttpMessageNotReadableException exception,
      HttpHeaders headers,
      HttpStatusCode status,
      WebRequest request) {
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(
            status, "Request body must be valid JSON with the documented fields and types.");
    problem.setTitle("Invalid request");
    return handleExceptionInternal(exception, problem, headers, status, request);
  }

  @ExceptionHandler(DataAccessException.class)
  public ResponseEntity<ProblemDetail> databaseUnavailable(DataAccessException exception) {
    LOG.error("database.request.failed exceptionType={}", exception.getClass().getSimpleName());
    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(
            HttpStatus.SERVICE_UNAVAILABLE,
            "Database unavailable. Retry when readiness is restored.");
    problem.setTitle("Service unavailable");
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(problem);
  }
}
