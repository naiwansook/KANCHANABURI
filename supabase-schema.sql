-- =====================================================
-- Facebook Ad Manager - Database Schema
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. user_logins - Authentication
-- =====================================================
CREATE TABLE IF NOT EXISTS user_logins (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO user_logins (username, password_hash, display_name, role)
VALUES ('admin', 'admin123', 'ผู้ดูแลระบบ', 'owner')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- 2. fb_connections - Facebook Account Connections
-- =====================================================
CREATE TABLE IF NOT EXISTS fb_connections (
  id BIGSERIAL PRIMARY KEY,
  user_login_id BIGINT REFERENCES user_logins(id) ON DELETE CASCADE,
  fb_user_id TEXT NOT NULL,
  fb_user_name TEXT,
  user_access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  ad_account_id TEXT,
  ad_account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. fb_pages - Facebook Pages
-- =====================================================
CREATE TABLE IF NOT EXISTS fb_pages (
  id BIGSERIAL PRIMARY KEY,
  connection_id BIGINT REFERENCES fb_connections(id) ON DELETE CASCADE,
  page_id TEXT NOT NULL UNIQUE,
  page_name TEXT NOT NULL,
  page_category TEXT,
  page_picture TEXT,
  page_access_token TEXT NOT NULL,
  fan_count BIGINT DEFAULT 0,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ad_campaigns - Ad Campaigns
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id BIGSERIAL PRIMARY KEY,
  page_id TEXT NOT NULL,
  page_name TEXT,
  fb_campaign_id TEXT,
  fb_adset_id TEXT,
  fb_ad_id TEXT,
  fb_creative_id TEXT,
  post_id TEXT NOT NULL,
  post_message TEXT,
  post_image_url TEXT,
  post_created_time TIMESTAMPTZ,
  campaign_name TEXT NOT NULL,
  objective TEXT DEFAULT 'OUTCOME_ENGAGEMENT',
  status TEXT DEFAULT 'ACTIVE',
  budget_type TEXT DEFAULT 'DAILY',
  budget_amount DECIMAL(12,2) NOT NULL,
  spent_amount DECIMAL(12,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  targeting JSONB DEFAULT '{}',
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,
  cpc DECIMAL(12,4) DEFAULT 0,
  frequency DECIMAL(6,2) DEFAULT 0,
  ai_score INTEGER DEFAULT 0,
  ai_recommendation TEXT,
  ai_recommendation_type TEXT,
  ai_analyzed_at TIMESTAMPTZ,
  created_by BIGINT REFERENCES user_logins(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ad_performances - Daily Performance
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_performances (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  ctr DECIMAL(8,4) DEFAULT 0,
  cpc DECIMAL(12,4) DEFAULT 0,
  spend DECIMAL(12,2) DEFAULT 0,
  frequency DECIMAL(6,2) DEFAULT 0,
  actions JSONB DEFAULT '[]',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- =====================================================
-- 6. ad_recommendations - AI History
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_recommendations (
  id BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  recommendation_type TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  recommendation_th TEXT NOT NULL,
  recommendation_detail TEXT,
  metrics_snapshot JSONB DEFAULT '{}',
  acted_on BOOLEAN DEFAULT FALSE,
  acted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_page_id ON ad_campaigns(page_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_created_at ON ad_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_performances_campaign_date ON ad_performances(campaign_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_recommendations_campaign ON ad_recommendations(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fb_pages_page_id ON fb_pages(page_id);
