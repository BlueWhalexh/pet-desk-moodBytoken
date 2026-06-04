# petdex CLI

The CLI behind pet-desk-moodBytoken. It installs Petdex Desktop, wires local agent hooks, and lets users wake the desktop pet from their agent with `/petdesk`.

- **Gallery & docs:** <https://petdex.crafter.run>
- **Repo:** <https://github.com/crafter-station/petdex>
- **Hatch a new pet:** <https://petdex.crafter.run/create>

## Install

`pet-desk-moodbytoken` is not published to npm yet. Until the first publish, install from source:

```sh
git clone https://github.com/BlueWhalexh/pet-desk-moodBytoken.git
cd pet-desk-moodBytoken/packages/petdex-cli
bun install
bun run build
npm install -g .
petdesk --help
```

After the npm package is published:

```sh
# One-shot via npx (no global install)
npx -y pet-desk-moodbytoken@latest --help

# Or install globally. This exposes the petdesk command.
npm install -g pet-desk-moodbytoken
petdesk --help
```

Requires Node.js 20+ (also runs on Bun).

`npx` downloads the package into npm's temporary cache and runs its declared `bin`. It does not permanently install `petdesk` into your PATH. If you only used `npx -y pet-desk-moodbytoken@latest init`, use `npx -y pet-desk-moodbytoken@latest doctor` for later checks, or install globally first.

Maintainers can publish with:

```sh
bun install
bun run build
npm login
npm publish --access public
```

`npm publish --dry-run` currently succeeds and packages `README.md`, `dist/petdex.js`, and `package.json`; a real publish requires an authenticated npm account.

## Quick start

```sh
npx -y pet-desk-moodbytoken@latest init          # install desktop, starter pet, hooks, and /petdesk
petdesk install aka-shiba           # install a pet by slug
petdesk submit ~/.codex/pets/aka-shiba
```

After `init`, open Codex / Claude Code / Gemini CLI / OpenCode and run `/petdesk`.

`aka-shiba` is the preferred starter pet for this fork. If it is unavailable in the online manifest, the installer falls back to the first available pet so the desktop still has something to render.

Windows users can run the Node CLI with `npx` as long as Node.js 20+ is installed. Full desktop behavior depends on a matching `win32` desktop release asset and the target agent's hook support; macOS is the currently most verified path.

## Commands

| Command | Description |
| --- | --- |
| `petdesk login` | Authenticate via Clerk OAuth + PKCE (browser callback). Tokens stored in OS keychain. |
| `petdesk logout` | Clear local credentials. |
| `petdesk whoami` | Print the signed-in user's identity. |
| `petdesk init` | Install/start desktop, install a starter pet, and wire local agent hooks + `/petdesk`. |
| `petdesk list` | List approved pets in the gallery. |
| `petdesk install <slug>` | Install a pet into `~/.codex/pets/<slug>/`. |
| `petdesk submit <path>` | Submit a pet folder, zip, or parent of pets (bulk). |
| `petdesk --version` | Print the CLI version. |

## How `submit` works

The CLI accepts three input shapes:

```sh
petdesk submit ~/.codex/pets/aka-shiba  # single folder (must contain pet.json + spritesheet.{webp,png})
petdesk submit ~/Downloads/aka-shiba.zip
petdesk submit ~/.codex/pets            # parent folder: every subfolder containing pet.json is submitted
```

Per submission the CLI:

1. Builds a clean zip in memory from `pet.json` + `spritesheet.{webp,png}`.
2. Calls `POST /api/cli/submit` with a Clerk OAuth bearer to get presigned R2 PUT URLs (60s TTL).
3. PUTs the three files to Cloudflare R2 directly. No body passes through Petdex servers.
4. Calls `POST /api/cli/submit/register` to record the submission as `pending`. Identity comes from the verified token, never from the body.

A spinner shows progress per pet; a summary lists failures with reasons. Slugs auto-deduplicate (`aka-shiba` → `aka-shiba-2` → `aka-shiba-3` → …) so submissions never fail on collisions.

## Validation rules

- `pet.json` and `spritesheet.webp` (or `.png`) must exist at the root.
- Spritesheet ≥ 256×256. Recommended **1536×1872** (8×9 frame grid).
- Rate limit: **10 submissions / 24h** per user. Admins bypass.

## Configuration

Override the defaults with environment variables when pointing at a non-production deployment:

```sh
PETDEX_URL=https://your-host.example.com \
CLERK_ISSUER=https://clerk.your-host.example.com \
CLERK_OAUTH_CLIENT_ID=public_client_id \
petdesk login
```

## Authentication details

- OAuth 2.0 Authorization Code with **PKCE** (S256). Public client, no secrets stored on your machine.
- Localhost callback on a random port (`http://127.0.0.1:0/callback`).
- Tokens stored in the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service). Falls back to a `chmod 600` file if a keychain is unavailable.
- Access tokens auto-refresh using the stored refresh token; you stay signed in until you `petdesk logout`.

The flow uses the [`@clerk/cli-auth`](https://github.com/Railly/clerk-cli-auth-example) reference implementation, vendored into this package.

## How to make a pet (creation lives inside Codex)

This CLI distributes pets. It does not generate them. To create one:

1. Open the **Codex desktop app** (download at <https://openai.com/codex>).
2. Go to **Skills** in the top navbar → install **Hatch Pet**.
3. In a Codex chat, type `/petdesk` after setup to control the desktop pet. For pet creation, use the Hatch Pet skill flow described in the gallery docs.
4. Codex generates the spritesheet and animations into `~/.codex/pets/<slug>/`.
5. Submit it: `petdesk submit ~/.codex/pets/<slug>`.

The full step-by-step (with tips on what makes a great pet) lives at <https://petdex.crafter.run/create>.

## Mood sprite skill

This fork adds a local skill at `.agents/skills/petdex-mood-sprite/` for generating or validating token-mood art.

The desktop also shows a weighted token usage percentage above the pet, such as `57%`. It is enabled by default and can be turned off in Settings with `Usage percent`, or by setting `showUsagePercent` to `false` in `~/.petdex/preferences.json`. By default the sampler uses all supported local agent sources; set `PETDEX_USAGE_MOOD_SOURCE=codex` or `PETDEX_USAGE_MOOD_SOURCE=claude-code` before starting the desktop when you want a single-agent percentage.

Ask your agent:

```text
Use the petdex-mood-sprite skill for ~/.petdex/pets/my-pet.
Generate energetic, normal, tired, exhausted, and dying mood idle sprites.
Each output must be a transparent 1152x208 WebP row with 6 frames.
Do not fake mood with opacity, tint, brightness, blur, or CSS filters.
```

For renderer smoke tests, the skill can create deterministic mock postures:

```sh
node .agents/skills/petdex-mood-sprite/scripts/generate-mood-sprites.mjs \
  my-pet \
  --mock-postures
```

For real artwork, ask the agent/image model for a 5 row x 6 column mood sheet, then standardize it:

```sh
node .agents/skills/petdex-mood-sprite/scripts/postprocess-ai-mood-sheet.mjs \
  --input /path/to/generated-5x6-green-screen-sheet.png \
  --slug my-pet
```

## Failure modes

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Not signed in` | No tokens or session expired | `petdesk login` |
| `presign 401` | Bearer rejected by Clerk userinfo | `petdesk logout && petdesk login` |
| `presign 429` | 10/24h rate limit hit | Wait 24h or open a [submit-fallback issue](https://github.com/crafter-station/petdex/issues/new?labels=submit-fallback) |
| `register 400 invalid_spritesheet` | Sprite < 256×256 | Regenerate with bigger dims (recommend 1536×1872) |
| `register 400 missing_field` | Folder missing `pet.json` or `spritesheet.{webp,png}` | Inspect folder contents, re-export from Codex if needed |
| `R2 PUT 403` | Presigned URL expired (60s TTL) | Retry the failed submission. CLI auto-presigns fresh URLs |

## Common install issues

The CLI is a single bundled JS file with no native dependencies.
install path is just `fetch a JSON manifest, write two files to
~/.codex/pets/<slug>/`. Most "stuck" reports trace to one of these:

| Symptom | Cause | Fix |
| --- | --- | --- |
| Hangs at `Need to install the following packages: pet-desk-moodbytoken@x` | `npx`'s own confirmation prompt, not a hang. Press `y` or auto-confirm | `npx -y pet-desk-moodbytoken@latest install <slug>` |
| `npm ERR! engine Unsupported engine` | Node < 20 | Upgrade Node to 20+ (`nvm install 20` is the easiest path) |
| `manifest fetch 5xx` / network timeout | Slow connection or corporate/national firewall blocking `petdex.crafter.run` | Set a proxy: `HTTPS_PROXY=http://your.proxy:port npx -y pet-desk-moodbytoken@latest install <slug>` |
| `EACCES: permission denied … ~/.codex/pets/` | Pets dir owned by another user | `sudo chown -R "$USER" ~/.codex` or remove the dir and retry |
| Windows: `'sh' is not recognized` | CLI version older than 0.1.1 piped through `curl … \| sh` | Upgrade: `npm i -g pet-desk-moodbytoken@latest` or `npx -y pet-desk-moodbytoken@latest install <slug>` |

The CLI bundles `@clack/prompts`, `picocolors`, and `jszip` into the
shipped JS. There is no separate dependency-install step on your
machine. If something appears to be stuck on "installing
dependencies", it's almost always npm's own progress bar for the
`petdex` package itself, not a sub-dependency tree.

## License

MIT, same as the [Petdex repo](https://github.com/crafter-station/petdex).
