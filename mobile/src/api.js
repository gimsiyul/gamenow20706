import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { PROD_API_URL } from './apiConfig';

function getApiBase() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const extraUrl = Constants.expoConfig?.extra?.apiUrl;
  if (extraUrl) return String(extraUrl).replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return PROD_API_URL.replace(/\/$/, '');
    }
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  if (hostUri) {
    const host = String(hostUri).split(':')[0];
    return `http://${host}:3000`;
  }

  if (Platform.OS === 'android') return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

const API_BASE = getApiBase();

async function getJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || '서버 요청에 실패했습니다.');
  }
  return data;
}

export function fetchPopular() {
  return getJson('/api/popular');
}

export function fetchSearch(q) {
  return getJson(`/api/search?q=${encodeURIComponent(q)}`);
}

export function fetchGame(appid) {
  return getJson(`/api/game/${appid}`);
}

export { API_BASE };
