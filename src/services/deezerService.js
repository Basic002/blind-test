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

/**
 * Get tracks by theme ID or custom playlist
 */
async function getTracksForTheme(themeId, customPlaylistId = null) {
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
  parsePlaylistId,
  getTracksForTheme,
  cleanTitle
};
