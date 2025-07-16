export const API_KEY_1 = process.env.EXPO_PUBLIC_CRICKET_API_KEY;
export const API_KEY_2 = process.env.EXPO_PUBLIC_CRICKET_API_KEY2;
export const API_KEY_3 = process.env.EXPO_PUBLIC_CRICKET_API_KEY3;
export const API_KEY_4 = process.env.EXPO_PUBLIC_CRICKET_API_KEY4;
export const BASE_URL = "https://api.cricapi.com/v1";

export async function fetchCricketApi(endpoint: string, params = "") {
  const tryFetch = async (apiKey: string) => {
    const url = `${BASE_URL}/${endpoint}?apikey=${apiKey}${params}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json = await res.json();
    return json;
  };

  const apiKeys = [API_KEY_1, API_KEY_2, API_KEY_3, API_KEY_4].filter(Boolean);
  let lastError = null;
  for (let i = 0; i < apiKeys.length; i++) {
    try {
      const json = await tryFetch(apiKeys[i] || "");
      if (json.status === "success") {
        return json.data || [];
      } else {
        lastError = json.message || json.reason || "API call failed";
      }
    } catch (err: any) {
      lastError = err.message || "API call failed";
    }
  }
  return { error: lastError || "All API keys failed" };
}

export async function fetchMatchScorecard(matchId: string) {
  return fetchCricketApi("match_scorecard", `&id=${matchId}`);
}
