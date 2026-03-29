// Facebook Graph API & Marketing API Helper
export const FB_API_VERSION = 'v19.0';
export const FB_BASE_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

// ─── API Wrappers ────────────────────────────────────────────────────────────

export async function fbGet<T = Record<string, unknown>>(
  path: string,
  token: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${FB_BASE_URL}${path}`);
  url.searchParams.set('access_token', token);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(`[FB] ${data.error.message} (code ${data.error.code})`);
  return data as T;
}

export async function fbPost<T = Record<string, unknown>>(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = new URL(`${FB_BASE_URL}${path}`);
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(`[FB] ${data.error.message} (code ${data.error.code})`);
  return data as T;
}

export async function fbDelete<T = Record<string, unknown>>(
  path: string,
  token: string
): Promise<T> {
  const url = new URL(`${FB_BASE_URL}${path}`);
  url.searchParams.set('access_token', token);
  const res = await fetch(url.toString(), { method: 'DELETE' });
  const data = await res.json();
  if (data.error) throw new Error(`[FB] ${data.error.message} (code ${data.error.code})`);
  return data as T;
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

export function buildOAuthUrl(redirectUri: string): string {
  const appId = process.env.FACEBOOK_APP_ID!;
  const scopes = [
    'pages_show_list',
    'pages_read_engagement',
    'pages_manage_ads',
    'ads_management',
    'ads_read',
    'business_management',
  ].join(',');
  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', 'fbadsmanager');
  return url.toString();
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{ access_token: string; expires_in?: number }> {
  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const url = new URL(`${FB_BASE_URL}/oauth/access_token`);
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('code', code);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(`[FB OAuth] ${data.error.message}`);
  return data;
}

export async function getLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const appId = process.env.FACEBOOK_APP_ID!;
  const appSecret = process.env.FACEBOOK_APP_SECRET!;
  const url = new URL(`${FB_BASE_URL}/oauth/access_token`);
  url.searchParams.set('grant_type', 'fb_exchange_token');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('client_secret', appSecret);
  url.searchParams.set('fb_exchange_token', shortToken);
  const res = await fetch(url.toString());
  const data = await res.json();
  if (data.error) throw new Error(`[FB Token] ${data.error.message}`);
  return data;
}

// ─── Pages & Posts ───────────────────────────────────────────────────────────

export interface FBPage {
  id: string;
  name: string;
  category: string;
  picture?: { data: { url: string } };
  fan_count?: number;
  access_token: string;
}

export interface FBPost {
  id: string;
  message?: string;
  story?: string;
  full_picture?: string;
  created_time: string;
  permalink_url?: string;
  attachments?: { data: Array<{ media?: { image?: { src: string } }; type: string }> };
  likes?: { summary: { total_count: number } };
  comments?: { summary: { total_count: number } };
  shares?: { count: number };
}

export async function getPages(userToken: string): Promise<FBPage[]> {
  const data = await fbGet<{ data: FBPage[] }>(
    '/me/accounts',
    userToken,
    { fields: 'id,name,category,picture,fan_count,access_token' }
  );
  return data.data || [];
}

export async function getPagePosts(pageId: string, pageToken: string, limit = 20): Promise<FBPost[]> {
  const data = await fbGet<{ data: FBPost[] }>(
    `/${pageId}/posts`,
    pageToken,
    {
      fields: 'id,message,story,full_picture,created_time,permalink_url,attachments,likes.summary(true),comments.summary(true),shares',
      limit: String(limit),
    }
  );
  return data.data || [];
}

export async function getAdAccounts(userToken: string): Promise<Array<{ id: string; name: string; currency: string; account_status: number }>> {
  const data = await fbGet<{ data: Array<{ id: string; name: string; currency: string; account_status: number }> }>(
    '/me/adaccounts',
    userToken,
    { fields: 'id,name,currency,account_status' }
  );
  return data.data || [];
}

// ─── Campaign Creation ────────────────────────────────────────────────────────

export interface CreateAdOptions {
  adAccountId: string;      // format: act_XXXXXXXXXX
  pageId: string;
  pageToken: string;
  postId: string;
  campaignName: string;
  objective: 'OUTCOME_ENGAGEMENT' | 'OUTCOME_TRAFFIC' | 'OUTCOME_AWARENESS';
  budgetType: 'DAILY' | 'LIFETIME';
  budgetAmount: number;     // Thai Baht
  startTime?: string;       // ISO date string
  endTime?: string;
  targeting: TargetingSpec;
}

export interface TargetingSpec {
  geo_locations: { countries?: string[]; cities?: Array<{ key: string; name: string; radius?: number; distance_unit?: string }> };
  age_min?: number;
  age_max?: number;
  genders?: number[];       // 1=male, 2=female
  interests?: Array<{ id: string; name: string }>;
  flexible_spec?: Array<Record<string, unknown>>;
}

export interface CreateAdResult {
  campaignId: string;
  adsetId: string;
  adId: string;
  creativeId: string;
}

export async function createBoostCampaign(opts: CreateAdOptions): Promise<CreateAdResult> {
  const budgetInCents = Math.round(opts.budgetAmount * 100);

  // 1. Create Campaign
  const campaign = await fbPost<{ id: string }>(
    `/${opts.adAccountId}/campaigns`,
    opts.pageToken,
    {
      name: opts.campaignName,
      objective: opts.objective,
      status: 'ACTIVE',
      special_ad_categories: [],
    }
  );

  // 2. Create Ad Set
  const adsetBody: Record<string, unknown> = {
    name: `${opts.campaignName} - AdSet`,
    campaign_id: campaign.id,
    billing_event: 'IMPRESSIONS',
    optimization_goal: opts.objective === 'OUTCOME_TRAFFIC' ? 'LINK_CLICKS' : 'POST_ENGAGEMENT',
    targeting: opts.targeting,
    status: 'ACTIVE',
    promoted_object: { page_id: opts.pageId },
  };
  if (opts.budgetType === 'DAILY') {
    adsetBody.daily_budget = budgetInCents;
  } else {
    adsetBody.lifetime_budget = budgetInCents;
    adsetBody.end_time = opts.endTime;
  }
  if (opts.startTime) adsetBody.start_time = opts.startTime;

  const adset = await fbPost<{ id: string }>(
    `/${opts.adAccountId}/adsets`,
    opts.pageToken,
    adsetBody
  );

  // 3. Create Creative from existing post
  const creative = await fbPost<{ id: string }>(
    `/${opts.adAccountId}/adcreatives`,
    opts.pageToken,
    {
      name: `${opts.campaignName} - Creative`,
      object_story_id: `${opts.pageId}_${opts.postId}`,
    }
  );

  // 4. Create Ad
  const ad = await fbPost<{ id: string }>(
    `/${opts.adAccountId}/ads`,
    opts.pageToken,
    {
      name: `${opts.campaignName} - Ad`,
      adset_id: adset.id,
      creative: { creative_id: creative.id },
      status: 'ACTIVE',
    }
  );

  return {
    campaignId: campaign.id,
    adsetId: adset.id,
    adId: ad.id,
    creativeId: creative.id,
  };
}

// ─── Insights ────────────────────────────────────────────────────────────────

export interface AdInsights {
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  frequency: number;
  date_start: string;
  date_stop: string;
  actions?: Array<{ action_type: string; value: string }>;
}

export async function getCampaignInsights(
  fbCampaignId: string,
  pageToken: string,
  dateRange: 'today' | 'yesterday' | 'last_7d' | 'last_30d' | 'lifetime' = 'lifetime'
): Promise<AdInsights | null> {
  const presets: Record<string, string> = {
    today: 'today',
    yesterday: 'yesterday',
    last_7d: 'last_7_days',
    last_30d: 'last_30_days',
    lifetime: 'maximum',
  };

  const data = await fbGet<{ data: Array<Record<string, string>> }>(
    `/${fbCampaignId}/insights`,
    pageToken,
    {
      fields: 'impressions,reach,clicks,ctr,cpc,spend,frequency,actions',
      date_preset: presets[dateRange],
      level: 'campaign',
    }
  );

  if (!data.data || data.data.length === 0) return null;
  const row = data.data[0];
  return {
    impressions: parseInt(row.impressions || '0'),
    reach: parseInt(row.reach || '0'),
    clicks: parseInt(row.clicks || '0'),
    ctr: parseFloat(row.ctr || '0'),
    cpc: parseFloat(row.cpc || '0'),
    spend: parseFloat(row.spend || '0'),
    frequency: parseFloat(row.frequency || '0'),
    date_start: row.date_start,
    date_stop: row.date_stop,
    actions: row.actions as unknown as AdInsights['actions'],
  };
}

export async function getDailyInsights(
  fbCampaignId: string,
  pageToken: string,
  days = 14
): Promise<AdInsights[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const data = await fbGet<{ data: Array<Record<string, string>> }>(
    `/${fbCampaignId}/insights`,
    pageToken,
    {
      fields: 'impressions,reach,clicks,ctr,cpc,spend,frequency,date_start,date_stop',
      time_increment: '1',
      time_range: JSON.stringify({
        since: startDate.toISOString().split('T')[0],
        until: endDate.toISOString().split('T')[0],
      }),
    }
  );

  return (data.data || []).map(row => ({
    impressions: parseInt(row.impressions || '0'),
    reach: parseInt(row.reach || '0'),
    clicks: parseInt(row.clicks || '0'),
    ctr: parseFloat(row.ctr || '0'),
    cpc: parseFloat(row.cpc || '0'),
    spend: parseFloat(row.spend || '0'),
    frequency: parseFloat(row.frequency || '0'),
    date_start: row.date_start,
    date_stop: row.date_stop,
  }));
}

// ─── Budget Update ────────────────────────────────────────────────────────────

export async function updateAdsetBudget(
  fbAdsetId: string,
  pageToken: string,
  newDailyBudget: number
): Promise<void> {
  await fbPost(`/${fbAdsetId}`, pageToken, {
    daily_budget: Math.round(newDailyBudget * 100),
  });
}

export async function pauseCampaign(fbCampaignId: string, pageToken: string): Promise<void> {
  await fbPost(`/${fbCampaignId}`, pageToken, { status: 'PAUSED' });
}

export async function resumeCampaign(fbCampaignId: string, pageToken: string): Promise<void> {
  await fbPost(`/${fbCampaignId}`, pageToken, { status: 'ACTIVE' });
}
