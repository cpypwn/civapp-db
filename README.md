# civapp-db

a public catalog of `.civapp` packages for CivHomebrew on Nintendo Switch 2.

open **Options → Browse apps** in CivHomebrew to see the catalog. press **A** on an app to install, reinstall, or update it. CivHomebrew verifies the download size, SHA-256 hash, app ID, and release before installing. updates are chosen by the user; they do not install automatically.

browse apps currently works with [cpypwn's CivHomebrew fork](https://github.com/cpypwn/CivHomebrew) bundled in mac2jb v0.8.2. upstream [XITRIX/CivHomebrew](https://github.com/XITRIX/CivHomebrew) does not include this feature out of the box.

the catalog is [catalog.json](https://raw.githubusercontent.com/cpypwn/civapp-db/main/catalog.json). CivHomebrew also accepts other HTTPS catalogs through **Browse apps → Y: add source**.

## apps

- **Moonlight** — stream games from a computer running Sunshine
- **SW2NES** — play `.nes` ROMs added through CivHomebrew FTP
- **Jellyfin** — browse and play media from a Jellyfin server

these packages are maintained by their respective projects. add another app to this list when its catalog entry is accepted.

## add or update an app

open a pull request that changes `catalog.json` and adds the app to the list above. link to the app's source and a publicly downloadable `.civapp`. use the author's release asset when one exists instead of copying it into this repository. a catalog entry looks like this:

```json
{
  "id": "example-app",
  "name": "Example App",
  "release": "1.0.0",
  "description": "What the app does and what it needs",
  "repository": "https://github.com/owner/example-app",
  "package": "https://github.com/owner/example-app/releases/download/v1.0.0/example-app.civapp",
  "bytes": 123456,
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
}
```

`repository` is optional; the other fields are required. `id` and `release` must match the values inside the package. use a public HTTPS package URL on port 443 that ends in `.civapp`; every redirect must also use HTTPS. packages must be at most 12 MiB. the catalog supports at most 64 apps and must stay under 64 KiB. keep names under 80 characters, descriptions under 240 characters, and release strings under 32 characters. each ID must be unique.

get the package's exact size and hash with:

```sh
wc -c < example-app.civapp
shasum -a 256 example-app.civapp
```

run `node scripts/validate-catalog.mjs` before opening a pull request. CI runs the same check: it downloads each public package and verifies its size, hash, ID, and release. for an app update, replace the existing entry's release URL, size, and hash.

## pull request format

include the following in the PR description:

```text
app name and ID:
source repository:
public .civapp release URL:
what changed:
CivHomebrew version and console test result:
install or update result from Options → Browse apps → A:
node scripts/validate-catalog.mjs result:
```

publish the `.civapp` before submitting the PR so CI can download it. do not include account data, private network addresses, session tokens, copyrighted game files, or packages you cannot share.
