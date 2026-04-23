// Netlify Function: Start GitHub OAuth flow
// Redirects the user to GitHub's authorization page

exports.handler = async function (event, context) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const redirectUri = process.env.URL
    ? `${process.env.URL}/.netlify/functions/auth-callback`
    : 'http://localhost:8888/.netlify/functions/auth-callback';

  if (!clientId) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GITHUB_OAUTH_CLIENT_ID not configured' }),
    };
  }

  const scope = 'repo'; // Full repo access for reading/writing content
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}`;

  return {
    statusCode: 302,
    headers: {
      Location: authUrl,
      'Cache-Control': 'no-cache',
    },
    body: '',
  };
};
