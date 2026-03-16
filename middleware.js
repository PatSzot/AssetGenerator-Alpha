// Vercel Edge Middleware — injects per-template Open Graph tags for social crawlers.
// Regular browser requests pass through untouched (normal SPA behaviour).

const CRAWLER_RE =
  /facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|googlebot|bingbot|yandex|applebot|embedly|quora|pinterest|vkshare|xing|rockmelt|W3C_Validator/i

const META = {
  quote: {
    title:       'Quote Block — GTMGen',
    description: 'Generate branded quote assets for AirOps.',
    image:       '/og/quote.jpg',
  },
  richquote: {
    title:       'Rich Quote — GTMGen',
    description: 'Generate branded rich quote assets for AirOps.',
    image:       '/og/richquote.jpg',
  },
  titlecard: {
    title:       'Title Card — GTMGen',
    description: 'Generate branded title card assets for AirOps.',
    image:       '/og/titlecard.jpg',
  },
  twitter: {
    title:       'Twitter Post — GTMGen',
    description: 'Generate branded Twitter post assets for AirOps.',
    image:       '/og/twitter.jpg',
  },
  certificate: {
    title:       'Certificate — GTMGen',
    description: 'Generate and batch-export AirOps graduation certificates.',
    image:       '/og/certificate.jpg',
  },
  ijoined: {
    title:       'I Joined — GTMGen',
    description: 'Generate branded "I Joined AirOps" assets.',
    image:       '/og/ijoined.jpg',
  },
}

function ogHtml(origin, { title, description, image }) {
  const absImage = `${origin}${image}`
  return `<!doctype html>
<html lang="en"><head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${absImage}" />
  <meta property="og:image:width" content="1920" />
  <meta property="og:image:height" content="1080" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${absImage}" />
</head><body></body></html>`
}

export const config = {
  matcher: ['/quote', '/richquote', '/titlecard', '/twitter', '/certificate', '/ijoined'],
}

export default function middleware(request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!CRAWLER_RE.test(ua)) return // not a crawler — pass through to SPA

  const { origin, pathname } = new URL(request.url)
  const slug = pathname.slice(1)
  const meta = META[slug]
  if (!meta) return

  return new Response(ogHtml(origin, meta), {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}
