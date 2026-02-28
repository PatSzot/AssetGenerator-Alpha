export async function loadFonts() {
  const faces = [
    new FontFace('Serrif VF', 'url(/SerrifVF.ttf)'),
    new FontFace('Saans', 'url(/Saans-Regular.ttf)', { weight: '400' }),
    new FontFace('Saans', 'url(/Saans-Medium.ttf)', { weight: '500' }),
    new FontFace('Saans', 'url(/Saans-SemiBold.ttf)', { weight: '600' }),
    new FontFace('Saans', 'url(/Saans-Bold.ttf)', { weight: '700' }),
    new FontFace('Saans Mono', 'url(/SaansMono-Medium.ttf)', { weight: '500' }),
    new FontFace('Floralia', 'url(/Floralia.ttf)'),
  ];
  await Promise.all(faces.map(async f => { await f.load(); document.fonts.add(f); }));

  // Certificate script fonts (Google Fonts — optional, fail gracefully)
  const certFaces = [
    new FontFace('Monsieur La Doulaise', 'url(https://fonts.gstatic.com/s/monsieurladoulaise/v20/_Xmz-GY4rjmCbQfc-aPRaa4pqV340p7EZm5ZyEA242Tz.woff2)'),
    new FontFace('Mrs Saint Delafield',  'url(https://fonts.gstatic.com/s/mrssaintdelafield/v14/v6-IGZDIOVXH9xtmTZfRagunqBw5WC62QKknL-mYF20.woff2)'),
  ];
  await Promise.allSettled(certFaces.map(async f => {
    try { await f.load(); document.fonts.add(f); } catch (_) {}
  }));
}
