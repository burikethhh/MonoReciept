const fs = require('fs');
const path = require('path');

const TOKEN = process.argv[2] || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('Error: GitHub token required as argument or GITHUB_TOKEN env var');
  process.exit(1);
}

const OWNER = 'burikethhh';
const REPO = 'MonoReciept';
const TAG = 'v1.0.0';
const TITLE = 'MonoReciept v1.0.0 — Android Kiosk Photobooth';
const APK_PATH = path.join(__dirname, '..', 'MonoReciept-v1.0.0.apk');
const NOTES_PATH = path.join(__dirname, '..', 'RELEASE_NOTES.md');

async function main() {
  console.log(`[1/3] Reading release notes & binary...`);
  const body = fs.readFileSync(NOTES_PATH, 'utf8');
  const stats = fs.statSync(APK_PATH);
  console.log(`APK found: ${APK_PATH} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'MonoReciept-Release-Bot'
  };

  console.log(`[2/3] Checking if release for ${TAG} already exists...`);
  let release;
  try {
    const checkRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/tags/${TAG}`, { headers });
    if (checkRes.ok) {
      release = await checkRes.json();
      console.log(`Found existing release (ID: ${release.id})`);
    }
  } catch (e) {}

  if (!release) {
    console.log(`Creating release ${TAG}...`);
    const createRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tag_name: TAG,
        target_commitish: 'main',
        name: TITLE,
        body: body,
        draft: false,
        prerelease: false
      })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create release: ${createRes.status} ${errText}`);
    }

    release = await createRes.json();
    console.log(`✓ Release created: ${release.html_url}`);
  }

  console.log(`[3/3] Uploading release asset MonoReciept-v1.0.0.apk...`);
  // Check if asset already uploaded
  const existingAsset = release.assets && release.assets.find(a => a.name === 'MonoReciept-v1.0.0.apk');
  if (existingAsset) {
    console.log(`Deleting previous asset (ID: ${existingAsset.id})...`);
    await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/releases/assets/${existingAsset.id}`, {
      method: 'DELETE',
      headers
    });
  }

  const uploadUrl = release.upload_url.replace('{?name,label}', '?name=MonoReciept-v1.0.0.apk');
  const apkStream = fs.createReadStream(APK_PATH);

  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Length': stats.size.toString(),
      'User-Agent': 'MonoReciept-Release-Bot'
    },
    body: fs.readFileSync(APK_PATH),
    duplex: 'half'
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`Failed to upload asset: ${uploadRes.status} ${errText}`);
  }

  const asset = await uploadRes.json();
  console.log(`✓ Asset uploaded successfully!`);
  console.log(`Download URL: ${asset.browser_download_url}`);
  console.log(`Release URL:  ${release.html_url}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
