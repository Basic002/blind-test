const { THEMES } = require('../config/themes');
const { ANIME_CATALOG } = require('../config/animeCatalog');
const { DISNEY_CATALOG } = require('../config/disneyCatalog');

const playlistCache = new Map();
const trackPreviewCache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 8;

let cachedAnimeData = null;
let cachedDisneyData = null;
let cachedRapFrData = null;
let cachedRockData = null;

function cleanTitle(rawTitle) {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*\(remaster(ed)?(\s*\d+)?\)/gi, '')
    .replace(/\s*\(version\s+[^)]+\)/gi, '')
    .replace(/\s*-\s*remaster(ed)?(\s*\d+)?/gi, '')
    .trim();
}

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

  const validTracks = data.tracks.data
    .filter(track => track.preview && track.preview.length > 0)
    .map(track => ({
      id: String(track.id),
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

function parsePlaylistId(input) {
  if (!input) return null;
  const str = input.toString().trim();
  const match = str.match(/playlist\/(\d+)/i);
  if (match) return match[1];
  if (/^\d+$/.test(str)) return str;
  return null;
}

async function fetchAnimeCatalog() {
  if (cachedAnimeData) return cachedAnimeData;
  cachedAnimeData = ANIME_CATALOG.map(item => ({
    id: String(item.id),
    anime: item.anime,
    title: item.title,
    fullTitle: `${item.title} (${item.anime})`,
    artist: item.artist,
    isAnime: true
  }));
  return cachedAnimeData;
}

async function fetchDisneyCatalog() {
  if (cachedDisneyData) return cachedDisneyData;
  cachedDisneyData = DISNEY_CATALOG.map(item => ({
    id: String(item.id),
    disney: item.disney,
    title: item.title,
    fullTitle: `${item.title} (${item.disney})`,
    artist: item.artist,
    isDisney: true
  }));
  return cachedDisneyData;
}

const RAP_FR_PLAYLISTS = [
  '1999435002',
  '11355471784',
  '10692649262',
  '9563400362',
  '3272614282'
];

async function fetchRapFrTracks() {
  if (cachedRapFrData && Date.now() - cachedRapFrData.timestamp < CACHE_TTL_MS) {
    return cachedRapFrData.tracks;
  }

  const responses = await Promise.all(
    RAP_FR_PLAYLISTS.map(id =>
      fetch(`https://api.deezer.com/playlist/${id}`)
        .then(r => r.json())
        .catch(() => null)
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

  cachedRapFrData = { tracks, timestamp: Date.now() };
  return tracks;
}

const ROCK_PLAYLISTS = [
  '1306931615',
  '2655390504',
  '61217294'
];

async function fetchRockTracks() {
  if (cachedRockData && Date.now() - cachedRockData.timestamp < CACHE_TTL_MS) {
    return cachedRockData.tracks;
  }

  const responses = await Promise.all(
    ROCK_PLAYLISTS.map(id =>
      fetch(`https://api.deezer.com/playlist/${id}`)
        .then(r => r.json())
        .catch(() => null)
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
    throw new Error('Impossible de charger les morceaux de Rock/Métal');
  }

  cachedRockData = { tracks, timestamp: Date.now() };
  return tracks;
}

async function getFreshTrackPreview(trackId) {
  if (!trackId) return null;
  const strId = String(trackId);
  const cached = trackPreviewCache.get(strId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.url;
  }

  try {
    const res = await fetch(`https://api.deezer.com/track/${strId}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.preview) return null;

    trackPreviewCache.set(strId, {
      url: data.preview,
      expiresAt: Date.now() + 1000 * 60 * 8
    });
    return data.preview;
  } catch (err) {
    return null;
  }
}

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
  if (themeId === 'rock') {
    return await fetchRockTracks();
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
  fetchRockTracks,
  getFreshTrackPreview,
  parsePlaylistId,
  getTracksForTheme,
  cleanTitle
};
