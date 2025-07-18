const LASTFM_API_KEY = "230590d668df5533f830cbdf7920f94f";

interface TrackImage {
  "#text": string;
  size: string;
}

interface BaseItem {
  name: string;
  image: TrackImage[];
}

interface Track extends BaseItem {
  artist: {
    name: string;
  };
  listeners?: string;
  playcount?: string;
  duration?: string;
  wiki?: {
    summary: string;
  };
  wikiImage?: string; // Added property
}

interface Artist extends BaseItem {
  listeners: string;
  bio?: {
    summary: string;
  };
  stats?: {
    listeners: string;
    playcount: string;
  };
}

interface Album extends BaseItem {
  artist: {
    name: string;
  };
  playcount?: string;
  listeners?: string;
  wiki?: {
    summary: string;
  };
  wikiImage?: string; // Added property
}

interface SearchResult {
  name: string;
  artist: string;
  image: TrackImage[];
}

interface GenreContent {
  topArtists: Artist[];
  topTracks: Track[];
  topAlbums: Album[];
}

export const searchTracks = async (query: string) => {
  try {
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(
        query
      )}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.results.trackmatches.track;
  } catch (error) {
    console.error("Error searching tracks:", error);
    return [];
  }
};

export const getTrackDetails = async (trackName: string, artistName: string) => {
  try {
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=track.getInfo&track=${encodeURIComponent(
        trackName
      )}&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.track;
  } catch (error) {
    console.error("Error fetching track details:", error);
    return null;
  }
};

export const getArtistDetails = async (artistName: string) => {
  try {
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=${encodeURIComponent(
        artistName
      )}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.artist;
  } catch (error) {
    console.error("Error fetching artist details:", error);
    return null;
  }
};

export const getAlbumDetails = async (albumName: string, artistName: string) => {
  try {
    const response = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&album=${encodeURIComponent(
        albumName
      )}&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await response.json();
    return data.album;
  } catch (error) {
    console.error("Error fetching album details:", error);
    return null;
  }
};

export const getItemDetails = async (type: "artist" | "album" | "track", name: string, artist?: string) => {
  switch (type) {
    case "artist":
      return getArtistDetails(name);
    case "album":
      return artist ? getAlbumDetails(name, artist) : null;
    case "track":
      return artist ? getTrackDetails(name, artist) : null;
    default:
      return null;
  }
};

export const getGenreContent = async (genre: string): Promise<GenreContent | null> => {
  try {
    // Fetch top artists
    const artistsResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=tag.gettopartists&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
    );
    const artistsData = await artistsResponse.json();

    // Fetch top tracks
    const tracksResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
    );
    const tracksData = await tracksResponse.json();

    // Fetch top albums
    const albumsResponse = await fetch(
      `http://ws.audioscrobbler.com/2.0/?method=tag.gettopalbums&tag=${genre}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
    );
    const albumsData = await albumsResponse.json();

    return {
      topArtists: artistsData.topartists.artist,
      topTracks: tracksData.tracks.track,
      topAlbums: albumsData.albums.album,
    };
  } catch (error) {
    console.error("Error fetching genre content:", error);
    return null;
  }
};

export const getImageUrl = (images: TrackImage[]) => {
  const DEFAULT_IMAGE = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";
  if (!images || images.length === 0) return DEFAULT_IMAGE;
  const image = images.find(img => img.size === "extralarge") || 
               images.find(img => img.size === "large") || 
               images.find(img => img.size === "medium") || 
               images[0];
  return image["#text"] || DEFAULT_IMAGE;
};

export async function getMusicImageFromWiki(name: string): Promise<string | null> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(name)}&prop=pageimages&pithumbsize=500&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      for (const pageId in pages) {
        const page = pages[pageId];
        if (page.thumbnail && page.thumbnail.source) {
          return page.thumbnail.source;
        }
      }
    }
    return null;
  } catch (e) {
    console.error("Error fetching image from Wikipedia:", e);
    return null;
  }
}

export type {
  Album, Artist, BaseItem, GenreContent, SearchResult, Track, TrackImage
};

