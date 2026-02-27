export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })

  const match = url.match(/\/status\/(\d+)/)
  if (!match) return res.status(400).json({ error: 'Could not extract tweet ID from URL' })

  const tweetId = match[1]
  const token = process.env.TWITTER_BEARER_TOKEN
  if (!token) return res.status(500).json({ error: 'TWITTER_BEARER_TOKEN not configured' })

  const apiUrl = `https://api.twitter.com/2/tweets/${tweetId}` +
    `?tweet.fields=public_metrics,created_at` +
    `&expansions=author_id` +
    `&user.fields=name,username,profile_image_url`

  const resp = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = await resp.json()
  if (!resp.ok || data.errors) {
    return res.status(resp.ok ? 400 : resp.status).json({
      error: data.errors?.[0]?.detail || data.title || 'Twitter API error',
    })
  }

  const user = data.includes?.users?.[0] ?? {}
  res.status(200).json({
    text:    data.data.text,
    author:  { name: user.name, username: user.username, profileImageUrl: user.profile_image_url },
    metrics: data.data.public_metrics,
  })
}
