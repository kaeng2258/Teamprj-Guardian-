-- Normalize existing provider-oriented schema/data to the new manager terminology
SET @schema_name = DATABASE();

-- ===== match table (care assignments) =====
SET @match_old := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'match'
      AND column_name = 'provider_user_id'
);
SET @match_new := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'match'
      AND column_name = 'manager_user_id'
);

SET @sql := (
    SELECT CASE
        WHEN @match_old = 1 AND @match_new = 0 THEN 'ALTER TABLE `match` RENAME COLUMN `provider_user_id` TO `manager_user_id`'
        WHEN @match_old = 1 AND @match_new = 1 THEN 'UPDATE `match` SET `manager_user_id` = `provider_user_id` WHERE `manager_user_id` IS NULL'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT CASE
        WHEN @match_old = 1 AND @match_new = 1 THEN 'ALTER TABLE `match` DROP COLUMN `provider_user_id`'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===== chat_room table =====
SET @chat_provider := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'chat_room'
      AND column_name = 'provider_user_id'
);
SET @chat_manager := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'chat_room'
      AND column_name = 'manager_user_id'
);

SET @sql := (
    SELECT CASE
        WHEN @chat_provider = 1 AND @chat_manager = 0 THEN 'ALTER TABLE `chat_room` RENAME COLUMN `provider_user_id` TO `manager_user_id`'
        WHEN @chat_provider = 1 AND @chat_manager = 1 THEN 'UPDATE `chat_room` SET `manager_user_id` = `provider_user_id` WHERE `manager_user_id` IS NULL'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT CASE
        WHEN @chat_provider = 1 AND @chat_manager = 1 THEN 'ALTER TABLE `chat_room` DROP COLUMN `provider_user_id`'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @chat_read_old := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'chat_room'
      AND column_name = 'is_read_provider'
);
SET @chat_read_new := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'chat_room'
      AND column_name = 'is_read_manager'
);

SET @sql := (
    SELECT CASE
        WHEN @chat_read_old = 1 AND @chat_read_new = 0 THEN 'ALTER TABLE `chat_room` RENAME COLUMN `is_read_provider` TO `is_read_manager`'
        WHEN @chat_read_old = 1 AND @chat_read_new = 1 THEN 'UPDATE `chat_room` SET `is_read_manager` = `is_read_provider` WHERE `is_read_manager` IS NULL'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT CASE
        WHEN @chat_read_old = 1 AND @chat_read_new = 1 THEN 'ALTER TABLE `chat_room` DROP COLUMN `is_read_provider`'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===== alarm_occurrence table =====
SET @occ_notified_old := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'alarm_occurrence'
      AND column_name = 'is_notified_provider'
);
SET @occ_notified_new := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'alarm_occurrence'
      AND column_name = 'is_notified_manager'
);

SET @sql := (
    SELECT CASE
        WHEN @occ_notified_old = 1 AND @occ_notified_new = 0 THEN 'ALTER TABLE `alarm_occurrence` RENAME COLUMN `is_notified_provider` TO `is_notified_manager`'
        WHEN @occ_notified_old = 1 AND @occ_notified_new = 1 THEN 'UPDATE `alarm_occurrence` SET `is_notified_manager` = IFNULL(`is_notified_manager`, `is_notified_provider`)'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT CASE
        WHEN @occ_notified_old = 1 AND @occ_notified_new = 1 THEN 'ALTER TABLE `alarm_occurrence` DROP COLUMN `is_notified_provider`'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @occ_notes_old := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'alarm_occurrence'
      AND column_name = 'provider_notes'
);
SET @occ_notes_new := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @schema_name
      AND table_name = 'alarm_occurrence'
      AND column_name = 'manager_notes'
);

SET @sql := (
    SELECT CASE
        WHEN @occ_notes_old = 1 AND @occ_notes_new = 0 THEN 'ALTER TABLE `alarm_occurrence` RENAME COLUMN `provider_notes` TO `manager_notes`'
        WHEN @occ_notes_old = 1 AND @occ_notes_new = 1 THEN 'UPDATE `alarm_occurrence` SET `manager_notes` = COALESCE(`manager_notes`, `provider_notes`)' 
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := (
    SELECT CASE
        WHEN @occ_notes_old = 1 AND @occ_notes_new = 1 THEN 'ALTER TABLE `alarm_occurrence` DROP COLUMN `provider_notes`'
        ELSE 'DO 0'
    END
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===== ensure users table has birth_date column =====
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `birth_date` DATE NULL;

-- ===== data normalization =====
UPDATE `users` SET `role` = 'MANAGER' WHERE `role` = 'PROVIDER';
UPDATE `alarm_occurrence` SET `status` = 'MANAGER_NOTIFIED' WHERE `status` = 'PROVIDER_NOTIFIED';
UPDATE `emergency_alert` SET `status` = 'RECEIVED_BY_MANAGER' WHERE `status` = 'RECEIVED_BY_PROVIDER';
UPDATE `emergency_alert` SET `alert_type` = 'MANAGER_REQUEST' WHERE `alert_type` = 'PROVIDER_REQUEST';
