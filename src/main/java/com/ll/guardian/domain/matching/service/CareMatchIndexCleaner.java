package com.ll.guardian.domain.matching.service;

import jakarta.annotation.PostConstruct;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Component;

/**
 * MySQL 테이블 `match` 에 남아 있을 수 있는 클라이언트 고유 제약(UNIQUE INDEX)을
 * 안전하게 제거해 매니저-클라이언트 M:N 배정을 허용한다.
 */
@Component
@Profile("!test")
public class CareMatchIndexCleaner {

    private static final Logger log = LoggerFactory.getLogger(CareMatchIndexCleaner.class);
    private final JdbcTemplate jdbcTemplate;

    public CareMatchIndexCleaner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void dropUniqueIndexesOnMatch() {
        if (isNonMySqlDatabase()) {
            log.debug("Skipping match index cleanup on non-MySQL database (likely test/H2).");
            return;
        }
        try {
            // information_schema 로부터 UNIQUE 인덱스 목록 조회 (PRIMARY 제외)
            String sql = """
                    SELECT INDEX_NAME, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLS
                    FROM information_schema.statistics
                    WHERE table_schema = DATABASE()
                      AND table_name = 'match'
                      AND NON_UNIQUE = 0
                      AND INDEX_NAME <> 'PRIMARY'
                    GROUP BY INDEX_NAME
                    """;

            List<Map<String, Object>> indexes = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : indexes) {
                String idxName = String.valueOf(row.get("INDEX_NAME"));
                String cols = String.valueOf(row.get("COLS"));

                // 클라이언트 단일 배정을 막는 제약으로 보이는 경우만 드롭
                if (cols != null && cols.contains("client_user_id")) {
                    String dropSql = "ALTER TABLE `match` DROP INDEX `" + idxName + "`";
                    jdbcTemplate.execute(dropSql);
                    log.info("Dropped UNIQUE index {} on match (cols={}) to allow M:N assignments", idxName, cols);
                }
            }
        } catch (Exception e) {
            // 스키마 조회/드롭 실패 시 서비스 전체를 막지 않도록 로그만 남긴다.
            log.warn("Failed to drop UNIQUE index on match table (M:N assignment).", e);
        }
    }

    private boolean isNonMySqlDatabase() {
        Connection connection = null;
        try {
            connection = DataSourceUtils.getConnection(jdbcTemplate.getDataSource());
            if (connection == null) {
                return true;
            }
            DatabaseMetaData metaData = connection.getMetaData();
            String product = metaData != null ? metaData.getDatabaseProductName() : "";
            return product == null || !product.toLowerCase().contains("mysql");
        } catch (SQLException e) {
            log.debug("Could not determine database product, skipping index cleanup. reason={}", e.getMessage());
            return true;
        } finally {
            if (connection != null) {
                DataSourceUtils.releaseConnection(connection, jdbcTemplate.getDataSource());
            }
        }
    }
}
