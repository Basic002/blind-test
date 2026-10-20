const { getTracksForTheme } = require('../src/services/deezerService');

async function testRapMode() {
  console.log('--- TEST DU NOUVEAU CATALOGUE RAP FRANÇAIS (TOUTES ÉPOQUES) ---');

  const tracks = await getTracksForTheme('rap-fr');
  console.log(`✅ Total de titres récupérés : ${tracks.length}`);

  if (tracks.length < 50) {
    throw new Error(`Trop peu de morceaux trouvés : ${tracks.length}`);
  }

  // Check eras
  const classics = tracks.filter(t => /iam|ntm|fonky|sniper|lunatic|rohff|113/i.test(t.artist));
  const middleEra = tracks.filter(t => /booba|orelsan|nekfeu|kaaris|lacrim|jul|damso|pnl/i.test(t.artist));
  const modernEra = tracks.filter(t => /ninho|gazo|sdm|werenoi|tiakola|plk|maes|freeze corleone|favé/i.test(t.artist));

  console.log(`- Classiques 90s/2000s (IAM, NTM, Fonky Family, Sniper...) : ${classics.length} titres`);
  console.log(`- Ère 2010s / All-Time (Booba, PNL, Damso, Orelsan, Nekfeu, Jul...) : ${middleEra.length} titres`);
  console.log(`- Nouveautés & 2020s (Ninho, Gazo, SDM, Werenoi, Tiakola, PLK...) : ${modernEra.length} titres`);

  if (classics.length === 0 || modernEra.length === 0) {
    throw new Error('Une des époques manque dans le catalogue !');
  }

  // Check valid audio previews
  const validPreviews = tracks.filter(t => t.preview && t.preview.startsWith('http'));
  console.log(`- Titres avec extraits audio 30s fonctionnels : ${validPreviews.length}/${tracks.length}`);

  if (validPreviews.length !== tracks.length) {
    throw new Error('Certains morceaux n\'ont pas d\'extrait audio valide !');
  }

  console.log('\n✅ Le mode Rap Français couvre parfaitement toutes les générations !');
}

testRapMode().catch(err => {
  console.error('❌ Échec du test :', err);
  process.exit(1);
});
