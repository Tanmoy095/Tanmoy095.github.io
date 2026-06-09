const GITHUB_API = 'https://api.github.com';

export function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || 'Tanmoy095';
  const repo = process.env.GITHUB_REPO || 'Tanmoy095.github.io';
  const branch = process.env.GITHUB_BRANCH || 'main';
  if (!token) throw new Error('GITHUB_TOKEN is not configured on the server');
  return { token, owner, repo, branch };
}

export async function githubRequest(path, options = {}) {
  const { token, owner, repo } = getGitHubConfig();
  const url = path.startsWith('http')
    ? path
    : `${GITHUB_API}/repos/${owner}/${repo}/contents/${path.replace(/^\//, '')}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    throw new Error(data?.message || `GitHub API error (${response.status})`);
  }
  return data;
}
