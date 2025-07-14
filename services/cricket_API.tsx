export const API_KEY = process.env.EXPO_PUBLIC_CRICKET_API_KEY;
export const BASE_URL = "https://api.cricapi.com/v1";

export async function fetchCricketApi(endpoint: string, params = "") {
  try {
    const url = `${BASE_URL}/${endpoint}?apikey=${API_KEY}${params}`;
    const res = await fetch(url);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const json = await res.json();
    
    if (json.status !== "success") {
      return { error: json.message || "API call failed" };
    }
    
    return json.data || [];
  } catch (error: any) {
    return { error: error.message || "An unknown error occurred" };
  }
}

export async function fetchMatchScorecard(matchId: string) {
  return fetchCricketApi("match_scorecard", `&id=${matchId}`);
}
