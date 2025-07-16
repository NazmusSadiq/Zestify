import os, requests

API_KEY = "8511ddac058c4982b7c64722e71b77ee"
HEADERS = {"X-Auth-Token": API_KEY}
TEAM_ID = 418  # Inter Miami's v4 team ID (update if wrong)

# 1️⃣ Get team squad
t = requests.get(
    f"https://api.football-data.org/v4/teams/{TEAM_ID}",
    headers=HEADERS
)
t.raise_for_status()
squad = t.json().get("squad", [])

# 2️⃣ Find Messi’s ID
messi = next((p for p in squad if p["name"] == "Lionel Messi"), None)
if not messi:
    print("❌ Messi not found in that team’s squad.")
    exit(1)

messi_id = messi["id"]
print(f"✅ Found Messi with ID {messi_id}")

# 3️⃣ Fetch Messi’s matches
m = requests.get(
    f"https://api.football-data.org/v4/persons/{messi_id}/matches",
    headers=HEADERS
)
m.raise_for_status()
matches = m.json().get("matches", [])
print(f"⚽ Messi has played {len(matches)} matches in this query.")
