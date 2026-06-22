const APPEARANCE_FIELDS = ['site_title', 'custom_bg', 'custom_head', 'custom_script'];
const SITE_FIELDS = ['is_public', 'show_price', 'show_expire', 'show_bw', 'show_tf', 'show_long_history', 'tg_notify', 'tg_bot_token', 'tg_chat_id', 'turnstile_enabled', 'turnstile_site_key', 'turnstile_secret_key', 'jwt_secret', 'username', 'password', 'cloudflare_account_id', 'cloudflare_token', 'custom_ct', 'custom_cu', 'custom_cm', 'custom_bd', 'cleanup_skip_count', 'expire_reminder'];

const defaults = {
  site_title: 'Cloudflare Server Monitor',
  custom_bg: '',
  custom_head: '',
  custom_script: '',
  is_public: 'true',
  show_price: 'true',
  show_expire: 'true',
  show_bw: 'true',
  show_tf: 'true',
  show_long_history: 'false',
  tg_notify: 'false',
  tg_bot_token: '',
  tg_chat_id: '',
  cleanup_skip_count: '0',
  turnstile_enabled: 'false',
  turnstile_site_key: '',
  turnstile_secret_key: '',
  cloudflare_account_id: '',
  cloudflare_token: '',
  custom_ct: 'gd-ct-dualstack.ip.zstaticcdn.com',
  custom_cu: 'gd-cu-dualstack.ip.zstaticcdn.com',
  custom_cm: 'gd-cm-dualstack.ip.zstaticcdn.com',
  custom_bd: 'lf3-ips.zstaticcdn.com',
  expire_reminder: 'false'
};

function tryParseJSON(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

const SITE_SETTINGS_TTL = 60 * 1000;
let cachedSiteSettings = null;
let siteSettingsCacheExpiry = 0;

export async function loadSiteSettings(db) {
  const now = Date.now();
  if (cachedSiteSettings && now < siteSettingsCacheExpiry) {
    debug('读取site settings缓存');
    return cachedSiteSettings;
  }
  debug('从数据库加载site settings');

  const result = { ...defaults };
  let hasSite = false;

  try {
    const siteRow = await db.prepare(
      "SELECT value FROM settings WHERE key = 'site_options'"
    ).first();
    if (siteRow) {
      const parsed = tryParseJSON(siteRow.value);
      if (parsed) {
        hasSite = true;
        for (const field of SITE_FIELDS) {
          if (parsed[field] !== undefined) {
            result[field] = parsed[field];
          }
        }
      }
    }

    if (!hasSite) {
      const { results } = await db.prepare('SELECT * FROM settings').all();
      if (results && results.length > 0) {
        results.forEach(r => {
          if (SITE_FIELDS.includes(r.key)) {
            result[r.key] = r.value;
          }
        });
      }
    }
  } catch (e) {
    console.error('加载站点设置失败:', e);
  }

  cachedSiteSettings = result;
  siteSettingsCacheExpiry = now + SITE_SETTINGS_TTL;
  return result;
}

export function clearSiteSettingsCache() {
  cachedSiteSettings = null;
  siteSettingsCacheExpiry = 0;
}

export async function loadSettings(db) {
  const result = { ...defaults };
  let hasAppearance = false;
  let hasSite = false;

  try {
    const appearanceRow = await db.prepare(
      "SELECT value FROM settings WHERE key = 'appearance_options'"
    ).first();
    if (appearanceRow) {
      const parsed = tryParseJSON(appearanceRow.value);
      if (parsed) {
        hasAppearance = true;
        for (const field of APPEARANCE_FIELDS) {
          if (parsed[field] !== undefined) {
            result[field] = parsed[field];
          }
        }
      }
    }

    const siteRow = await db.prepare(
      "SELECT value FROM settings WHERE key = 'site_options'"
    ).first();
    if (siteRow) {
      const parsed = tryParseJSON(siteRow.value);
      if (parsed) {
        hasSite = true;
        for (const field of SITE_FIELDS) {
          if (parsed[field] !== undefined) {
            result[field] = parsed[field];
          }
        }
      }
    }

    if (!hasAppearance || !hasSite) {
      const { results } = await db.prepare('SELECT * FROM settings').all();
      if (results && results.length > 0) {
        results.forEach(r => {
          if (!hasAppearance && APPEARANCE_FIELDS.includes(r.key)) {
            result[r.key] = r.value;
          }
          if (!hasSite && SITE_FIELDS.includes(r.key)) {
            result[r.key] = r.value;
          }
        });
      }
    }
  } catch (e) {
    console.error('加载设置失败:', e);
  }

  return result;
}

let isDebugEnabled = false;

export function setDebug(debug) {
  isDebugEnabled = debug === 1 || debug === '1' || debug === true;
  if(isDebugEnabled) console.log('DEBUG模式:', isDebugEnabled);
}

export function debug(...args) {
  if (isDebugEnabled) {
    console.debug('[DEBUG]', ...args);
  }
}
