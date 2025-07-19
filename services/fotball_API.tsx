export const API_KEY = process.env.EXPO_PUBLIC_FOOTBALL_API_KEY;
export const BASE_URL = "https://api.football-data.org/v4";

export const COMPETITIONS = [
    { id: "PL", name: "Premier League" },
    { id: "PD", name: "La Liga" },
    { id: "SA", name: "Serie A" },
    { id: "BL1", name: "Bundesliga" },
    { id: "FL1", name: "Ligue 1" },
    { id: "CL", name: "UCL" },
];

export const MATCHES_COMPETITIONS = [
    { id: "SUBSCRIBED", name: "Subscribed" },
    ...COMPETITIONS,
];

export const STATS_OPTIONS = [
    "Standings",
    "Team Stats",
    "Top Scorer",
];

export async function fetchFromApi(endpoint: string, params = "") {
    try {
        const url = `${BASE_URL}/${endpoint}${params}`;
        const headers = new Headers();
        headers.append('X-Auth-Token', API_KEY!);
        
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const json = await res.json();

        if (json.error) return { error: json.error };
        
        return json;
    } catch (error: any) {
        return { error: error.message || "An unknown error occurred" };
    }
}

export const STATS_ENDPOINTS: Record<string, (id: string) => string> = {
    "Standings": (id) => `competitions/${id}/standings`,
    "Team Stats": (id) => `competitions/${id}/teams`,
    "Top Scorer": (id) => `competitions/${id}/scorers`,
};