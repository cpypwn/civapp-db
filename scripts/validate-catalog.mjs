import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const root = resolve(import.meta.dirname, '..');
const bytes = await readFile(resolve(root, 'catalog.json'));
assert.ok(bytes.length <= 65536, 'catalog exceeds 64 KiB');
const catalog = JSON.parse(bytes);
assert.equal(catalog.format, 'civhomebrew-catalog');
assert.equal(catalog.version, 1);
assert.ok(Array.isArray(catalog.apps) && catalog.apps.length <= 64, 'catalog has too many apps');
const ids = new Set();

async function fetchPackage(url) {
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(url, {redirect: 'manual', signal: AbortSignal.timeout(30000)});
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      assert.ok(redirect < 5, `too many redirects: ${url}`);
      const next = new URL(response.headers.get('location') ?? '', url);
      assert.equal(next.protocol, 'https:', 'package redirected away from HTTPS');
      assert.ok(!next.port || next.port === '443', 'package redirected to a non-HTTPS port');
      url = next;
      continue;
    }
    assert.equal(response.status, 200, `package download failed: ${url}`);
    const chunks = [];
    let size = 0;
    for await (const chunk of response.body) {
      size += chunk.length;
      assert.ok(size <= 12 * 1024 * 1024, 'package exceeds 12 MiB');
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
  throw Error(`too many redirects: ${url}`);
}

for (const app of catalog.apps) {
  assert.ok(app && typeof app === 'object', 'invalid app entry');
  assert.match(app.id, /^[a-z0-9][a-z0-9-]{0,63}$/);
  assert.ok(!ids.has(app.id), `duplicate app ID: ${app.id}`);
  ids.add(app.id);
  assert.ok(typeof app.name === 'string' && app.name.trim() && app.name.length <= 80);
  assert.ok(typeof app.release === 'string' && app.release.length > 0 && app.release.length <= 32);
  assert.ok(typeof app.description === 'string' && app.description.length <= 240);
  assert.ok(Number.isSafeInteger(app.bytes) && app.bytes > 0 && app.bytes <= 12 * 1024 * 1024);
  assert.match(app.sha256, /^[0-9a-f]{64}$/);
  const packageURL = new URL(app.package);
  assert.equal(packageURL.protocol, 'https:');
  assert.ok(!packageURL.port || packageURL.port === '443');
  assert.match(packageURL.pathname, /\.civapp$/);
  if (app.repository) assert.equal(new URL(app.repository).protocol, 'https:');

  let packageBytes;
  const localPrefix = 'https://raw.githubusercontent.com/cpypwn/civapp-db/main/packages/';
  if (app.package.startsWith(localPrefix)) {
    const filename = app.package.slice(localPrefix.length);
    assert.match(filename, /^[A-Za-z0-9._-]+\.civapp$/);
    packageBytes = await readFile(resolve(root, 'packages', filename));
  } else {
    packageBytes = await fetchPackage(app.package);
  }
  assert.equal(packageBytes.length, app.bytes, `wrong size: ${app.id}`);
  assert.equal(createHash('sha256').update(packageBytes).digest('hex'), app.sha256, `wrong SHA-256: ${app.id}`);
  const packaged = JSON.parse(packageBytes.toString('utf8'));
  assert.equal(packaged.format, 'civswitch-app', `wrong package format: ${app.id}`);
  assert.equal(packaged.id, app.id, `wrong package ID: ${app.id}`);
  assert.equal(packaged.metadata?.release, app.release, `wrong package release: ${app.id}`);
  console.log(`${app.name} ${app.release}: verified`);
}

console.log(`catalog: ${catalog.apps.length} apps verified`);
