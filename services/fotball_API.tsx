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

// Rate limiting mechanism
let lastApiCall = 0;
const API_CALL_INTERVAL = 200; 
let pendingRequests = new Map<string, Promise<any>>();

export async function fetchFromApi(endpoint: string, params = "", bypassRateLimit = false) {
    try {
        const url = `${BASE_URL}/${endpoint}${params}`;
        
        // Check if there's already a pending request for this exact URL
        if (!bypassRateLimit && pendingRequests.has(url)) {
            console.log(`Reusing pending request for: ${url}`);
            return await pendingRequests.get(url)!;
        }
        
        // Rate limiting: ensure minimum time between API calls (skip if bypassing)
        if (!bypassRateLimit) {
            const now = Date.now();
            const timeSinceLastCall = now - lastApiCall;
            if (timeSinceLastCall < API_CALL_INTERVAL) {
                const delay = API_CALL_INTERVAL - timeSinceLastCall;
                console.log(`Rate limiting: waiting ${delay}ms before API call`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        const headers = new Headers();
        headers.append('X-Auth-Token', API_KEY!);
        
        // Create the request promise
        const requestPromise = fetch(url, { headers }).then(async res => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const json = await res.json();
            
            if (json.error) return { error: json.error };
            return json;
        }).finally(() => {
            // Remove from pending requests when complete (only if not bypassing)
            if (!bypassRateLimit) {
                pendingRequests.delete(url);
            }
        });
        
        // Store the promise to prevent duplicate requests (only if not bypassing)
        if (!bypassRateLimit) {
            pendingRequests.set(url, requestPromise);
        }
        
        if (!bypassRateLimit) {
            lastApiCall = Date.now();
        }
        
        return await requestPromise;
    } catch (error: any) {
        return { error: error.message || "An unknown error occurred" };
    }
}

export const STATS_ENDPOINTS: Record<string, (id: string) => string> = {
    "Standings": (id) => `competitions/${id}/standings`,
    "Team Stats": (id) => `competitions/${id}/teams`,
    "Top Scorer": (id) => `competitions/${id}/scorers`,
};