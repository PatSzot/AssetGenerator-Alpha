const BASE = 'https://raw.githubusercontent.com/PatSzot/OffsiteAgenda/main/public/';

export async function loadFonts() {
  const faces = [
    new FontFace('Serrif VF', `url(${BASE}SerrifVF.ttf)`),
    new FontFace('Saans', `url(${BASE}Saans-Regular.ttf)`, { weight: '400' }),
    new FontFace('Saans', `url(${BASE}Saans-Medium.ttf)`, { weight: '500' }),
    new FontFace('Saans', `url(${BASE}Saans-Bold.ttf)`, { weight: '700' }),
    new FontFace('Saans Mono', `url(${BASE}SaansMono-Medium.ttf)`, { weight: '500' }),
  ];
  await Promise.all(faces.map(async f => { await f.load(); document.fonts.add(f); }));
}
