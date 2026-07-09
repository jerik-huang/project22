-- ====================================================
-- 用户管理系统 - 数据库初始化脚本
-- 适用 MySQL 8.0+
--
-- 使用方法(注意字符集,避免中文乱码):
--   mysql --default-character-set=utf8mb4 -u root -p < init.sql
--
-- 文件本身为 UTF-8 编码。Windows 下若 mysql 客户端默认使用
-- GBK,必须显式指定 --default-character-set=utf8mb4,否则
-- 示例数据中的中文会出现乱码。
-- ====================================================

CREATE DATABASE IF NOT EXISTS `user_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `user_db`;

-- 若表已存在先删除(首次部署可保留,二次执行会清空数据,请谨慎)
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键,自增ID',
  `username`   VARCHAR(50)  NOT NULL COMMENT '登录名',
  `email`      VARCHAR(100) NOT NULL COMMENT '邮箱',
  `password_hash` VARCHAR(255) DEFAULT NULL COMMENT '密码哈希(bcrypt)',
  `gender`     ENUM('male','female','other') NOT NULL DEFAULT 'other' COMMENT '性别',
  `nickname`   VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
  `phone`      VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  KEY `idx_gender` (`gender`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 示例数据
INSERT INTO `users` (`username`, `email`, `gender`, `nickname`, `phone`) VALUES
  ('zhangsan', 'zhangsan@example.com', 'male',   '张三', '13800138000'),
  ('lisi',     'lisi@example.com',     'female', '李四', '13900139000'),
  ('wangwu',   'wangwu@example.com',   'male',   '王五', NULL);
