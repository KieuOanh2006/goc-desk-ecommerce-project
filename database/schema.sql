-- Góc Desk | MySQL 8.0.16+ | 40 bảng | Dùng cho database trống.
-- Guest lưu giỏ và bản thiết kế trong localStorage. Member lưu trong MySQL.
-- API lấy user_id từ phiên đăng nhập cho các thao tác riêng của Member.
-- Khi đăng nhập, API gộp giỏ theo biến thể và chỉ xóa giỏ cục bộ sau khi ghi thành công.
-- Design artifact for ERD/reporting; not an applied migration or production database.
-- No personal data or sample credentials are included.
CREATE DATABASE IF NOT EXISTS goc_desk
CHARACTER SET utf8mb4
COLLATE utf8mb4_0900_ai_ci;

USE goc_desk;
CREATE TABLE membership_tiers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(80) NOT NULL,
  tier_rank SMALLINT UNSIGNED NOT NULL,
  qualifying_spend_threshold DECIMAL(12,2) NULL COMMENT 'Leave unset until the group confirms tier thresholds',
  benefits JSON NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_membership_tiers_code (code),
  UNIQUE KEY uq_membership_tiers_rank (tier_rank)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  membership_tier_id BIGINT UNSIGNED NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  phone VARCHAR(30) NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'member' COMMENT 'member, admin, product_content_staff, or order_support_staff; guest has no account row',
  account_status VARCHAR(20) NOT NULL DEFAULT 'active',
  email_verified_at DATETIME NULL,
  points_balance BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Cached spendable balance; point_transactions is the ledger',
  lifetime_qualifying_spend DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'Tier qualification measure, distinct from spendable points',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  KEY ix_users_membership_tier_id (membership_tier_id),
  CONSTRAINT fk_users_membership_tier FOREIGN KEY (membership_tier_id)
    REFERENCES membership_tiers (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Store only SHA-256 token hashes; never store the raw session cookie token.
-- A session is valid only while not revoked and both expiry timestamps are in the future.
-- session_data must contain non-sensitive application state only (no passwords or secrets).
CREATE TABLE auth_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  session_data JSON NULL,
  user_agent VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  idle_expires_at DATETIME NOT NULL,
  absolute_expires_at DATETIME NOT NULL,
  remember_me BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at DATETIME NULL,
  revoked_reason VARCHAR(100) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_sessions_token_hash (token_hash),
  KEY ix_auth_sessions_user_active (user_id, revoked_at, idle_expires_at, absolute_expires_at),
  KEY ix_auth_sessions_expiry_cleanup (idle_expires_at, absolute_expires_at, revoked_at),
  KEY ix_auth_sessions_absolute_expiry (absolute_expires_at, revoked_at),
  CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Email token lifetime is 24 hours; each token is consumed once by the Auth service.
-- Resending must revoke any still-valid token for the same user and purpose first.
CREATE TABLE email_verification_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  purpose ENUM('member_registration', 'staff_invitation') NOT NULL,
  token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email_verification_tokens_token_hash (token_hash),
  KEY ix_email_verification_tokens_lookup (user_id, purpose, consumed_at, revoked_at, expires_at),
  KEY ix_email_verification_tokens_rate_limit (user_id, purpose, created_at),
  CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  parent_category_id BIGINT UNSIGNED NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(1000) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  KEY ix_categories_parent_category_id (parent_category_id),
  CONSTRAINT fk_categories_parent FOREIGN KEY (parent_category_id)
    REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE brands (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE use_cases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_use_cases_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id BIGINT UNSIGNED NOT NULL,
  brand_id BIGINT UNSIGNED NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  short_description VARCHAR(500) NULL,
  description TEXT NULL,
  specifications JSON NULL COMMENT 'Structured category-specific specifications; no separate specs table',
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY ix_products_category_id (category_id),
  KEY ix_products_brand_id (brand_id),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
    REFERENCES brands (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_variants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(80) NOT NULL,
  color_name VARCHAR(60) NOT NULL,
  color_hex CHAR(7) NULL,
  price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2) NULL,
  sale_starts_at DATETIME NULL,
  sale_ends_at DATETIME NULL,
  stock_quantity INT UNSIGNED NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_variants_sku (sku),
  KEY ix_product_variants_product_id (product_id),
  CONSTRAINT fk_product_variants_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE cart_items (
  user_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, variant_id),
  KEY ix_cart_items_variant (variant_id),
  CONSTRAINT ck_cart_items_quantity CHECK (quantity BETWEEN 1 AND 99),
  CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id)
    REFERENCES product_variants (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_images (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  image_url VARCHAR(1000) NOT NULL,
  alt_text VARCHAR(250) NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY ix_product_images_product_id (product_id),
  KEY ix_product_images_variant_id (variant_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_images_variant FOREIGN KEY (variant_id)
    REFERENCES product_variants (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_use_cases (
  product_id BIGINT UNSIGNED NOT NULL,
  use_case_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (product_id, use_case_id),
  CONSTRAINT fk_product_use_cases_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_use_cases_use_case FOREIGN KEY (use_case_id)
    REFERENCES use_cases (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_addresses (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line VARCHAR(300) NOT NULL,
  ward VARCHAR(100) NULL,
  district VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_user_addresses_user_id (user_id),
  CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE password_reset_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_password_reset_tokens_hash (token_hash),
  KEY ix_password_reset_tokens_user_id (user_id),
  CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_views (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NULL,
  viewed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_product_views_user_date (user_id, viewed_at),
  KEY ix_product_views_product_id (product_id),
  CONSTRAINT fk_product_views_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_views_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_product_views_variant FOREIGN KEY (variant_id)
    REFERENCES product_variants (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE shipping_rates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  region_code VARCHAR(40) NOT NULL,
  region_name VARCHAR(120) NOT NULL,
  shipping_fee DECIMAL(12,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_shipping_rates_region_code (region_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(500) NULL,
  discount_type VARCHAR(20) NOT NULL COMMENT 'fixed or percent',
  discount_value DECIMAL(12,2) NOT NULL,
  minimum_order_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  maximum_discount_amount DECIMAL(12,2) NULL,
  valid_from DATETIME NOT NULL,
  valid_until DATETIME NOT NULL,
  total_usage_limit INT UNSIGNED NULL,
  per_user_usage_limit SMALLINT UNSIGNED NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  shipping_rate_id BIGINT UNSIGNED NULL,
  order_number VARCHAR(40) NOT NULL,
  order_status VARCHAR(30) NOT NULL DEFAULT 'pending_confirmation',
  payment_method VARCHAR(40) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  customer_name VARCHAR(120) NOT NULL COMMENT 'Recipient snapshot',
  customer_email VARCHAR(254) NULL COMMENT 'Contact snapshot',
  customer_phone VARCHAR(30) NOT NULL COMMENT 'Contact snapshot',
  shipping_address_line VARCHAR(300) NOT NULL COMMENT 'Address snapshot',
  shipping_ward VARCHAR(100) NULL,
  shipping_district VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  subtotal_amount DECIMAL(12,2) NOT NULL,
  voucher_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  points_discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  customer_note VARCHAR(1000) NULL,
  placed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_number (order_number),
  KEY ix_orders_user_date (user_id, placed_at),
  KEY ix_orders_status_date (order_status, placed_at),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_shipping_rate FOREIGN KEY (shipping_rate_id)
    REFERENCES shipping_rates (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id BIGINT UNSIGNED NULL,
  product_name_snapshot VARCHAR(180) NOT NULL,
  sku_snapshot VARCHAR(80) NOT NULL,
  color_name_snapshot VARCHAR(60) NOT NULL,
  unit_price_snapshot DECIMAL(12,2) NOT NULL,
  quantity SMALLINT UNSIGNED NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY ix_order_items_order_id (order_id),
  KEY ix_order_items_product_id (product_id),
  KEY ix_order_items_variant_id (variant_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id)
    REFERENCES product_variants (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE payment_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  provider VARCHAR(60) NOT NULL,
  provider_transaction_id VARCHAR(120) NULL,
  gateway_event_id VARCHAR(120) NULL COMMENT 'Unique callback event key for duplicate-event recognition',
  idempotency_key VARCHAR(120) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'VND',
  status VARCHAR(20) NOT NULL COMMENT 'pending, succeeded, failed, or cancelled',
  response_code VARCHAR(60) NULL,
  failure_message VARCHAR(500) NULL,
  initiated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payment_transactions_provider_txn (provider_transaction_id),
  UNIQUE KEY uq_payment_transactions_gateway_event (gateway_event_id),
  UNIQUE KEY uq_payment_transactions_idempotency (idempotency_key),
  KEY ix_payment_transactions_order_id (order_id),
  CONSTRAINT fk_payment_transactions_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE order_status_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL COMMENT 'NULL for system-generated change',
  previous_status VARCHAR(30) NULL,
  new_status VARCHAR(30) NOT NULL,
  note VARCHAR(500) NULL,
  changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_order_status_history_order_date (order_id, changed_at),
  CONSTRAINT fk_order_status_history_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_order_status_history_user FOREIGN KEY (changed_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE user_vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  voucher_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'available',
  issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NULL,
  redeemed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_vouchers_user_voucher (user_id, voucher_id),
  KEY ix_user_vouchers_voucher_id (voucher_id),
  CONSTRAINT fk_user_vouchers_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_vouchers_voucher FOREIGN KEY (voucher_id)
    REFERENCES vouchers (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Chủ đơn được xác định qua orders.user_id. Khi áp voucher, API kiểm tra
-- chủ đơn, mã được cấp, thời hạn và giới hạn lượt dùng trong giao dịch tạo đơn.
CREATE TABLE voucher_usages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id BIGINT UNSIGNED NOT NULL,
  user_voucher_id BIGINT UNSIGNED NULL COMMENT 'NULL when a public voucher is used without an issued copy',
  order_id BIGINT UNSIGNED NOT NULL,
  discount_amount DECIMAL(12,2) NOT NULL,
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_voucher_usages_order (order_id),
  UNIQUE KEY uq_voucher_usages_user_voucher (user_voucher_id),
  KEY ix_voucher_usages_voucher_id (voucher_id),
  CONSTRAINT fk_voucher_usages_voucher FOREIGN KEY (voucher_id)
    REFERENCES vouchers (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_voucher_usages_user_voucher FOREIGN KEY (user_voucher_id)
    REFERENCES user_vouchers (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_voucher_usages_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE loyalty_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(60) NOT NULL,
  name VARCHAR(140) NOT NULL,
  rule_type VARCHAR(40) NOT NULL,
  parameters JSON NOT NULL COMMENT 'Configuration only; populate ratios/thresholds after group approval',
  valid_from DATETIME NULL,
  valid_until DATETIME NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_loyalty_rules_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE rewards (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  voucher_id BIGINT UNSIGNED NULL,
  name VARCHAR(140) NOT NULL,
  description VARCHAR(500) NULL,
  reward_type VARCHAR(30) NOT NULL,
  points_cost BIGINT UNSIGNED NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  KEY ix_rewards_voucher_id (voucher_id),
  CONSTRAINT fk_rewards_voucher FOREIGN KEY (voucher_id)
    REFERENCES vouchers (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE reward_redemptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  reward_id BIGINT UNSIGNED NOT NULL,
  voucher_id BIGINT UNSIGNED NULL,
  points_spent BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at DATETIME NULL,
  PRIMARY KEY (id),
  KEY ix_reward_redemptions_user_date (user_id, redeemed_at),
  KEY ix_reward_redemptions_reward_id (reward_id),
  CONSTRAINT fk_reward_redemptions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reward_redemptions_reward FOREIGN KEY (reward_id)
    REFERENCES rewards (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_reward_redemptions_voucher FOREIGN KEY (voucher_id)
    REFERENCES vouchers (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE point_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  order_id BIGINT UNSIGNED NULL,
  reward_redemption_id BIGINT UNSIGNED NULL,
  transaction_type VARCHAR(30) NOT NULL COMMENT 'earn, redeem, refund, or adjustment',
  points_delta BIGINT NOT NULL COMMENT 'Signed ledger change; ledger is authoritative for balance history',
  description VARCHAR(500) NULL,
  created_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_point_transactions_user_date (user_id, created_at),
  KEY ix_point_transactions_order_id (order_id),
  KEY ix_point_transactions_redemption_id (reward_redemption_id),
  CONSTRAINT fk_point_transactions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_point_transactions_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_point_transactions_redemption FOREIGN KEY (reward_redemption_id)
    REFERENCES reward_redemptions (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_point_transactions_actor FOREIGN KEY (created_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'Member who submitted the review',
  rating TINYINT UNSIGNED NOT NULL,
  title VARCHAR(160) NULL,
  comment TEXT NULL,
  moderation_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  admin_response TEXT NULL,
  responded_by_user_id BIGINT UNSIGNED NULL,
  responded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT ck_product_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uq_product_reviews_product_user (product_id, user_id),
  KEY ix_product_reviews_status_date (moderation_status, created_at),
  CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_product_reviews_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_product_reviews_responder FOREIGN KEY (responded_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE support_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  contact_name VARCHAR(120) NOT NULL,
  contact_email VARCHAR(254) NOT NULL,
  contact_phone VARCHAR(30) NULL,
  category VARCHAR(40) NOT NULL,
  subject VARCHAR(180) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  admin_response TEXT NULL,
  responded_by_user_id BIGINT UNSIGNED NULL,
  responded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_support_requests_status_date (status, created_at),
  KEY ix_support_requests_user_id (user_id),
  CONSTRAINT fk_support_requests_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_requests_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_support_requests_responder FOREIGN KEY (responded_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE newsletter_subscriptions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'subscribed',
  subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_subscriptions_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE article_categories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL,
  description VARCHAR(500) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_article_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE articles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  article_category_id BIGINT UNSIGNED NULL,
  author_user_id BIGINT UNSIGNED NULL,
  title VARCHAR(220) NOT NULL,
  slug VARCHAR(240) NOT NULL,
  content_type VARCHAR(20) NOT NULL COMMENT 'article, video, or 3d content',
  body LONGTEXT NULL,
  media_url VARCHAR(1000) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_articles_slug (slug),
  KEY ix_articles_category_status (article_category_id, status),
  CONSTRAINT fk_articles_category FOREIGN KEY (article_category_id)
    REFERENCES article_categories (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_articles_author FOREIGN KEY (author_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE website_contents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  content_key VARCHAR(100) NOT NULL,
  content_type VARCHAR(30) NOT NULL COMMENT 'banner, video, policy, FAQ, or other managed page content',
  title VARCHAR(220) NULL,
  body LONGTEXT NULL,
  media_url VARCHAR(1000) NULL,
  metadata JSON NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  updated_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_website_contents_key (content_key),
  CONSTRAINT fk_website_contents_editor FOREIGN KEY (updated_by_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE room_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  slug VARCHAR(160) NOT NULL,
  description VARCHAR(500) NULL,
  room_config JSON NULL COMMENT 'Room dimensions and template presentation settings',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_room_templates_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE furniture_assets (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  asset_code VARCHAR(60) NOT NULL,
  name VARCHAR(140) NOT NULL,
  furniture_type VARCHAR(40) NOT NULL,
  renderer_type VARCHAR(20) NOT NULL COMMENT 'procedural or glb',
  renderer_key VARCHAR(120) NOT NULL,
  model_url VARCHAR(1000) NULL COMMENT 'Optional external asset for file-based models',
  dimensions JSON NOT NULL COMMENT 'Approximate width, depth, and height for scene placement',
  default_color CHAR(7) NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_furniture_assets_code (asset_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE room_template_furniture (
  room_template_id BIGINT UNSIGNED NOT NULL,
  furniture_asset_id BIGINT UNSIGNED NOT NULL,
  position_x DECIMAL(8,3) NOT NULL DEFAULT 0,
  position_z DECIMAL(8,3) NOT NULL DEFAULT 0,
  rotation DECIMAL(8,4) NOT NULL DEFAULT 0,
  is_present BOOLEAN NOT NULL DEFAULT TRUE,
  color_hex CHAR(7) NULL,
  PRIMARY KEY (room_template_id, furniture_asset_id),
  CONSTRAINT fk_room_template_furniture_room FOREIGN KEY (room_template_id)
    REFERENCES room_templates (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_room_template_furniture_asset FOREIGN KEY (furniture_asset_id)
    REFERENCES furniture_assets (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE product_3d_models (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  renderer_type VARCHAR(20) NOT NULL COMMENT 'procedural or glb',
  renderer_key VARCHAR(120) NOT NULL,
  model_url VARCHAR(1000) NULL,
  width DECIMAL(8,3) NOT NULL,
  depth DECIMAL(8,3) NOT NULL,
  height DECIMAL(8,3) NOT NULL,
  surface_type VARCHAR(20) NOT NULL DEFAULT 'desk',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_3d_models_product (product_id),
  CONSTRAINT fk_product_3d_models_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE saved_setups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  room_template_id BIGINT UNSIGNED NOT NULL COMMENT 'Exactly one room template per saved setup',
  name VARCHAR(140) NOT NULL,
  notes VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_saved_setups_user_date (user_id, updated_at),
  CONSTRAINT fk_saved_setups_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_saved_setups_room FOREIGN KEY (room_template_id)
    REFERENCES room_templates (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Mỗi dòng là một vật thể trong bản thiết kế. Hai vật thể cùng SKU có thể có vị trí và góc riêng.
CREATE TABLE setup_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  saved_setup_id BIGINT UNSIGNED NOT NULL,
  variant_id BIGINT UNSIGNED NOT NULL,
  position_x DECIMAL(8,3) NOT NULL DEFAULT 0,
  position_z DECIMAL(8,3) NOT NULL DEFAULT 0,
  surface_type VARCHAR(20) NOT NULL DEFAULT 'desk',
  rotation DECIMAL(8,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_setup_items_setup_variant (saved_setup_id, variant_id),
  CONSTRAINT fk_setup_items_setup FOREIGN KEY (saved_setup_id)
    REFERENCES saved_setups (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_setup_items_variant FOREIGN KEY (variant_id)
    REFERENCES product_variants (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE setup_furniture (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  saved_setup_id BIGINT UNSIGNED NOT NULL,
  furniture_asset_id BIGINT UNSIGNED NOT NULL,
  is_present BOOLEAN NOT NULL DEFAULT TRUE,
  position_x DECIMAL(8,3) NOT NULL DEFAULT 0,
  position_z DECIMAL(8,3) NOT NULL DEFAULT 0,
  rotation DECIMAL(8,4) NOT NULL DEFAULT 0,
  color_hex CHAR(7) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_setup_furniture_setup_asset (saved_setup_id, furniture_asset_id),
  CONSTRAINT fk_setup_furniture_setup FOREIGN KEY (saved_setup_id)
    REFERENCES saved_setups (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_setup_furniture_asset FOREIGN KEY (furniture_asset_id)
    REFERENCES furniture_assets (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
