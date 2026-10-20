const { THEMES } = require('../config/themes');

// In-memory cache for playlists: { [playlistId]: { timestamp, tracks, title } }
const playlistCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

/**
 * Clean up title to avoid spoiling or making it too long
 */
function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*\(remaster(ed)?(\s*\d+)?\)/gi, '')
    .replace(/\s*\(version\s+[^)]+\)/gi, '')
    .replace(/\s*-\s*remaster(ed)?(\s*\d+)?/gi, '')
    .trim();
}

/**
 * Fetch tracks from Deezer API for a given playlist ID
 */
async function fetchPlaylistTracks(playlistId) {
  const cached = playlistCache.get(playlistId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  const url = `https://api.deezer.com/playlist/${playlistId}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Erreur Deezer API (${response.status})`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'Erreur lors du chargement de la playlist');
  }

  if (!data.tracks || !data.tracks.data || data.tracks.data.length === 0) {
    throw new Error('La playlist ne contient aucun morceau exploitable');
  }

  // Filter only tracks with valid preview 30s audio
  const validTracks = data.tracks.data
    .filter(track => track.preview && track.preview.length > 0)
    .map(track => ({
      id: track.id,
      title: cleanTitle(track.title_short || track.title),
      fullTitle: track.title,
      artist: track.artist ? track.artist.name : 'Inconnu',
      preview: track.preview,
      cover: track.album ? (track.album.cover_big || track.album.cover_medium) : null
    }));

  if (validTracks.length < 4) {
    throw new Error('La playlist doit contenir au moins 4 morceaux avec extraits audio');
  }

  const result = {
    id: playlistId,
    title: data.title,
    tracks: validTracks,
    timestamp: Date.now()
  };

  playlistCache.set(playlistId, result);
  return result;
}

/**
 * Parse a Deezer playlist ID from a raw string or URL
 */
function parsePlaylistId(input) {
  if (!input) return null;
  const str = input.toString().trim();
  // If it's a URL like https://www.deezer.com/fr/playlist/12345678
  const match = str.match(/playlist\/(\d+)/i);
  if (match) return match[1];
  // If it's just numbers
  if (/^\d+$/.test(str)) return str;
  return null;
}

const { ANIME_CATALOG } = require('../config/animeCatalog');
const { DISNEY_CATALOG } = require('../config/disneyCatalog');

let cachedAnimeTracks = null;
let cachedDisneyTracks = null;

async function fetchAnimeCatalog() {
  if (cachedAnimeTracks && cachedAnimeTracks.length > 0) {
    return cachedAnimeTracks;
  }

  const trackPromises = ANIME_CATALOG.map(async (item) => {
    try {
      const res = await fetch(`https://api.deezer.com/track/${item.id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.preview) return null;

      return {
        id: String(item.id),
        anime: item.anime,
        title: item.title,
        fullTitle: `${item.title} (${item.anime})`,
        artist: item.artist,
        preview: data.preview,
        cover: data.album ? (data.album.cover_big || data.album.cover_medium) : null,
        isAnime: true
      };
    } catch (e) {
      return null;
    }
  });

  const resolved = await Promise.all(trackPromises);
  cachedAnimeTracks = resolved.filter(Boolean);
  return cachedAnimeTracks;
}

async function fetchDisneyCatalog() {
  if (cachedDisneyTracks && cachedDisneyTracks.length > 0) {
    return cachedDisneyTracks;
  }

  const trackPromises = DISNEY_CATALOG.map(async (item) => {
    try {
      const res = await fetch(`https://api.deezer.com/track/${item.id}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.preview) return null;

      return {
        id: String(item.id),
        disney: item.disney,
        title: item.title,
        fullTitle: `${item.title} (${item.disney})`,
        artist: item.artist,
        preview: data.preview,
        cover: data.album ? (data.album.cover_big || data.album.cover_medium) : null,
        isDisney: true
      };
    } catch (e) {
      return null;
    }
  });

  const resolved = await Promise.all(trackPromises);
  cachedDisneyTracks = resolved.filter(Boolean);
  return cachedDisneyTracks;
}

// Curated playlist IDs covering all eras of French Rap (90s, 2000s, 2010s, 2020s & recent hits)
const RAP_FR_PLAYLISTS = [
  '1999435002', // Rap Français Classiques (IAM, NTM, Fonky Family, Booba débuts, Rohff, Sniper, 113...)
  '11355471784', // Rap FR All Time (PNL, Damso, Nekfeu, SCH, Orelsan, Freeze Corleone, Lunatic, Kaaris, Dinos...)
  '10692649262', // Bangers Rap FR (PLK, Maes, Ninho, Gazo, Luv Resval, Koba LaD, Naps...)
  '9563400362',  // Rapstars : années 2020 (Werenoi, SDM, Tiakola, Gazo, PLK, Favé...)
  '3272614282'   // Rapstars Actuel (les plus gros hits récents 2023-2026)
];

let cachedRapFrTracks = null;

async function fetchRapFrTracks() {
  if (cachedRapFrTracks && cachedRapFrTracks.length > 0) {
    return cachedRapFrTracks;
  }

  const responses = await Promise.all(
    RAP_FR_PLAYLISTS.map(id =>
      fetch(`https://api.deezer.com/playlist/${id}`)
        .then(r => r.json())
        .catch(err => {
          console.error(`Erreur chargement playlist rap ${id}:`, err.message);
          return null;
        })
    )
  );

  const seenIds = new Set();
  const seenKeys = new Set();
  const tracks = [];

  for (const p of responses) {
    if (!p || !p.tracks || !p.tracks.data) continue;
    for (const t of p.tracks.data) {
      if (!t.preview || t.preview.length === 0) continue;
      if (seenIds.has(t.id)) continue;

      const title = cleanTitle(t.title_short || t.title);
      const artist = t.artist ? t.artist.name : 'Inconnu';
      const key = `${artist.toLowerCase()}:::${title.toLowerCase()}`.replace(/\s+/g, ' ').trim();
      if (seenKeys.has(key)) continue;

      seenIds.add(t.id);
      seenKeys.add(key);

      tracks.push({
        id: String(t.id),
        title,
        fullTitle: t.title,
        artist,
        preview: t.preview,
        cover: t.album ? (t.album.cover_big || t.album.cover_medium) : null
      });
    }
  }

  if (tracks.length < 4) {
    throw new Error('Impossible de charger les morceaux de Rap Français');
  }

  cachedRapFrTracks = tracks;
  return cachedRapFrTracks;
}

/**
 * Get tracks by theme ID or custom playlist
 */
async function getTracksForTheme(themeId, customPlaylistId = null) {
  if (themeId === 'anime') {
    return await fetchAnimeCatalog();
  }
  if (themeId === 'disney') {
    return await fetchDisneyCatalog();
  }
  if (themeId === 'rap-fr') {
    return await fetchRapFrTracks();
  }

  let targetPlaylistId = null;

  if (themeId === 'custom' && customPlaylistId) {
    targetPlaylistId = parsePlaylistId(customPlaylistId);
    if (!targetPlaylistId) {
      throw new Error('ID ou URL de playlist Deezer invalide');
    }
  } else {
    const theme = THEMES.find(t => t.id === themeId);
    if (!theme) {
      throw new Error(`Thème introuvable : ${themeId}`);
    }
    targetPlaylistId = theme.playlistId;
  }

  const playlist = await fetchPlaylistTracks(targetPlaylistId);
  return playlist.tracks;
}

module.exports = {
  fetchPlaylistTracks,
  fetchAnimeCatalog,
  fetchDisneyCatalog,
  fetchRapFrTracks,
  parsePlaylistId,
  getTracksForTheme,
  cleanTitle
};
