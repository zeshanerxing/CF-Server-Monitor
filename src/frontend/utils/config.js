let apiBases = []
let wsBase = null
let title = ''
let backgroundImage = ''

const stripTrailingSlash = (s) => String(s || '').replace(/\/+$/, '')

const computeWsBase = (origin) => {
  try {
    const u = new URL(origin)
    const wsProto = u.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${wsProto}//${u.host}`
  } catch (_) {
    return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  }
}

const setApiBases = (values) => {
  apiBases = values.map(v => stripTrailingSlash(v)).filter(v => v)
  if (apiBases.length === 0) {
    apiBases = [stripTrailingSlash(window.location.origin)]
  }
  wsBase = computeWsBase(apiBases[0])
  window.__APP_API_BASES__ = apiBases
  window.__APP_WS_BASE__ = wsBase
}

export const initConfig = async () => {
  setApiBases([window.location.origin])
  try {
    const res = await fetch(`./config.json?t=${Date.now()}`, {
      cache: 'no-cache',
      credentials: 'omit'
    })
    if (res && res.ok) {
      const data = await res.json()
      if (data && Array.isArray(data.apiBase)) {
        setApiBases(data.apiBase.filter(u => typeof u === 'string' && u.trim()))
      }
      if (data && typeof data.title === 'string') {
        title = data.title.trim()
      }
      if (data && typeof data.backgroundImage === 'string') {
        backgroundImage = data.backgroundImage.trim()
      }
    }
  } catch (e) {
    // Network or parse failure -> keep the current-origin fallback
  }
  return apiBases
}

export const getApiBases = () => {
  if (apiBases.length > 0) return apiBases
  if (window.__APP_API_BASES__?.length > 0) return window.__APP_API_BASES__
  return [stripTrailingSlash(window.location.origin)]
}

export const getWsBase = () => {
  if (wsBase) return wsBase
  if (window.__APP_WS_BASE__) return window.__APP_WS_BASE__
  return computeWsBase(getApiBases()[0])
}

export const hasMultipleApiBases = () => {
  return getApiBases().length > 1
}

export const getTitle = () => {
  return title
}

export const getBackgroundImage = () => {
  return backgroundImage
}

export default { initConfig, getApiBases, getWsBase, hasMultipleApiBases, getTitle, getBackgroundImage }
