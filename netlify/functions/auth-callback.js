// Netlify Function: GitHub OAuth callback
// Exchanges the authorization code for an access token and redirects back to the CMS

const https = require('https');

function exchangeCode(clientId, clientSecret, code) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
    });

    const options = {
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Failed to parse GitHub response'));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

exports.handler = async function (event, context) {
  const code = event.queryStringParameters?.code;

  if (!code) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing authorization code' }),
    };
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OAuth credentials not configured' }),
    };
  }

  try {
    const result = await exchangeCode(clientId, clientSecret, code);

    if (result.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.error_description || result.error }),
      };
    }

    const accessToken = result.access_token;

    // Redirect back to the CMS with the token
    const siteUrl = process.env.URL || 'http://localhost:8888';
    return {
      statusCode: 302,
      headers: {
        Location: `${siteUrl}/cms/?token=${accessToken}`,
        'Cache-Control': 'no-cache',
      },
      body: '',
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to exchange code: ' + err.message }),
    };
  }
};
