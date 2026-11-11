package dev.replicas.api.system;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentMatchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SystemController.class)
class DatabaseFailureTest {
  @Autowired private MockMvc mvc;
  @MockitoBean private JdbcTemplate jdbc;

  @Test
  void reportsDatabaseFailureWithoutLeakingInternalDetails() throws Exception {
    given(
            jdbc.queryForObject(
                anyString(), ArgumentMatchers.<RowMapper<SystemController.SystemResponse>>any()))
        .willThrow(new DataAccessResourceFailureException("internal-details-canary"));
    mvc.perform(get("/api/v1/system"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
        .andExpect(jsonPath("$.status").value(503))
        .andExpect(jsonPath("$.database").doesNotExist())
        .andExpect(content().string(not(containsString("internal-details-canary"))));
  }
}
