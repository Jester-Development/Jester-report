CREATE TABLE `jester_reports` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `player_id` VARCHAR(255) NOT NULL,
    `player_name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `report_text` TEXT NOT NULL,
    `status` VARCHAR(50) DEFAULT 'open',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `jester_report_messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `report_id` INT NOT NULL,
    `sender_id` VARCHAR(255) NOT NULL,
    `sender_name` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_admin` TINYINT(1) DEFAULT 0,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`report_id`) REFERENCES `jester_reports`(`id`) ON DELETE CASCADE
);