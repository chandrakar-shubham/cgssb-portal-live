-- =========================================================================
-- CGSSBTEST Official Database Schema (MySQL 8.0+ / MariaDB)
-- Character Set: utf8mb4 for full Devnagari / Hindi and LaTeX formula support
-- =========================================================================

CREATE TABLE IF NOT EXISTS questions (
  id VARCHAR(64) PRIMARY KEY,
  unique_question_id VARCHAR(100) UNIQUE,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  exam_year INT,
  subject VARCHAR(150) NOT NULL,
  topic VARCHAR(200) NOT NULL,
  subtopic VARCHAR(200),
  chapter_name VARCHAR(200),
  chapter_id VARCHAR(150),
  difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
  question_type ENUM('mcq', 'matching', 'assertion_reason', 'multi_statement') NOT NULL DEFAULT 'mcq',
  subject_category ENUM('language', 'non_language', 'gs_reasoning') DEFAULT 'non_language',
  question_language ENUM('en', 'hi', 'both', 'bilingual') DEFAULT 'both',
  
  -- Question Stems
  question_text TEXT NOT NULL,
  question_hindi TEXT,
  
  -- Structured Components
  options JSON NOT NULL,
  statements JSON,
  column_a JSON,
  column_b JSON,
  assertion TEXT,
  assertion_hindi TEXT,
  reason TEXT,
  reason_hindi TEXT,
  
  -- Answers & Scoring
  correct_option ENUM('A', 'B', 'C', 'D') NOT NULL,
  model_key VARCHAR(10),
  final_amended_key VARCHAR(10),
  is_cancelled BOOLEAN DEFAULT FALSE,
  marks DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  negative_marks DECIMAL(4,3) NOT NULL DEFAULT 0.333,
  explanation TEXT,
  explanation_hindi TEXT,
  image_url VARCHAR(500),
  diagram_svg MEDIUMTEXT,
  ideal_time_seconds INT DEFAULT 45,
  
  -- Provenance & PYQ Relations
  origin_type ENUM('mock', 'pyq') DEFAULT 'mock',
  pyp_source VARCHAR(255),
  pyp_appearances JSON,
  repeated_in_exams JSON,
  similar_question_ids JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_subject (subject),
  INDEX idx_topic (topic),
  INDEX idx_difficulty (difficulty),
  INDEX idx_origin (origin_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS mock_tests (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 120,
  total_marks DECIMAL(6,2),
  marks_per_question DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  negative_marks_per_question DECIMAL(4,3) NOT NULL DEFAULT 0.333,
  is_pyp BOOLEAN DEFAULT FALSE,
  origin_type ENUM('pyq', 'mock') DEFAULT 'mock',
  is_pro BOOLEAN DEFAULT FALSE,
  pyp_year INT,
  pyp_exam_name VARCHAR(200),
  question_count INT NOT NULL DEFAULT 0,
  attempts_count INT NOT NULL DEFAULT 0,
  passing_percentage DECIMAL(4,1) DEFAULT 45.0,
  is_published BOOLEAN DEFAULT TRUE,
  difficulty_distribution JSON,
  sections JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_test_category (category),
  INDEX idx_test_published (is_published),
  INDEX idx_test_is_pyp (is_pyp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS previous_year_papers (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  authority VARCHAR(100) DEFAULT 'CGSSB',
  exam_category VARCHAR(50) NOT NULL DEFAULT 'CGSSB',
  sub_category VARCHAR(150),
  post_name VARCHAR(150),
  exam_name VARCHAR(200),
  exam_year INT NOT NULL,
  total_questions INT NOT NULL DEFAULT 100,
  duration_minutes INT NOT NULL DEFAULT 120,
  marks DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  negative_marking_ratio VARCHAR(100) DEFAULT '-⅓rd (0.33 Marks)',
  linked_mock_test_id VARCHAR(64),
  is_official_paper BOOLEAN DEFAULT TRUE,
  paper_summary TEXT,
  subjects_weightage JSON,
  download_file_name VARCHAR(255),
  file_size VARCHAR(50) DEFAULT '3.5 MB',
  download_url VARCHAR(500),
  linked_question_ids JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_pyp_year (exam_year),
  INDEX idx_pyp_category (exam_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS test_attempts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  test_id VARCHAR(64) NOT NULL,
  test_title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  total_duration_seconds INT NOT NULL DEFAULT 7200,
  
  responses JSON NOT NULL,
  question_statuses JSON NOT NULL,
  
  score DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  max_score DECIMAL(6,2) NOT NULL DEFAULT 100.00,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  correct_count INT NOT NULL DEFAULT 0,
  incorrect_count INT NOT NULL DEFAULT 0,
  unattempted_count INT NOT NULL DEFAULT 0,
  marked_for_review_count INT NOT NULL DEFAULT 0,
  negative_marks_deducted DECIMAL(6,2) NOT NULL DEFAULT 0.00,
  
  simulated_rank INT DEFAULT 1,
  total_participants INT DEFAULT 1,
  percentile DECIMAL(5,2) DEFAULT 50.00,
  sector_analysis JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_attempt_user (user_id),
  INDEX idx_attempt_test (test_id),
  INDEX idx_attempt_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- NO-CODE CMS & WEBSITE CUSTOMIZATION TABLES
-- =========================================================================

CREATE TABLE IF NOT EXISTS cms_pages (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  meta_title VARCHAR(255),
  meta_description TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  blocks JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_posts (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Exam Notifications',
  featured_image VARCHAR(500),
  excerpt TEXT,
  content MEDIUMTEXT NOT NULL,
  tags JSON,
  author VARCHAR(100) DEFAULT 'CGSSB Editorial Team',
  is_published BOOLEAN DEFAULT TRUE,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_post_slug (slug),
  INDEX idx_post_cat (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_test_series (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(150) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'CGPSC',
  description TEXT,
  badge VARCHAR(50) DEFAULT 'Popular',
  price DECIMAL(8,2) DEFAULT 199.00,
  is_pro BOOLEAN DEFAULT TRUE,
  mock_test_ids JSON NOT NULL,
  is_published BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_series_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cms_settings (
  id INT PRIMARY KEY DEFAULT 1,
  site_name VARCHAR(150) NOT NULL,
  tagline VARCHAR(255),
  logo_url VARCHAR(500),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  contact_email VARCHAR(100),
  copyright_text VARCHAR(255),
  primary_color VARCHAR(30) DEFAULT 'indigo',
  announcement_bar JSON,
  nav_menu JSON,
  footer_links JSON,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

