# emergID

A privacy-conscious emergency medical identification system using NFC tags. A first responder taps your NFC tag, and your critical medical information appears instantly in their browser. No app. No account info. No personal data stored.

## How It Works

1. Generate a random account number on the web app -- no name, email, or personal info required
2. Enter your medical information (allergies, medications, conditions, etc.)
3. Write the generated URL to an NFC tag using any NFC writing app
4. When a first responder taps the tag, the URL opens in their browser and displays your medical card

## Privacy & Security Model

emergID is designed so that **even the person hosting the server cannot read user data**.

- **Accountless model** -- inspired by Mullvad VPN. Your identity is a random account number. No email, no name, nothing personally identifiable is ever collected.
- **Split data model** -- your name lives only on the physical NFC tag label. The server stores only decontextualized medical data.
- **Envelope encryption** -- each account has a unique 256-bit data encryption key (DEK). All medical fields are AES-256-GCM encrypted. The DEK is itself encrypted under two separate credentials (account number and token), neither of which is stored on the server.
- **Hashed credentials** -- account numbers and tokens are stored only as SHA-256 hashes. A full database breach exposes nothing readable.
- **Auto-deletion** -- accounts are permanently deleted after 365 days of inactivity (no account portal login). No warning is possible since there is no contact info on file.

### What the database contains

| Data | How it's stored |
|------|-----------------|
| Account number | SHA-256 hash only |
| Token | SHA-256 hash only |
| Medical fields | AES-256-GCM ciphertext |
| Data encryption key | Encrypted under account number AND token (envelope encryption) |
| Access log | Timestamps only -- no IP, device, or location |

### The two credentials

| | Account number | Token URL |
|---|---|---|
| Purpose | Account access (update data, view log, reroll token, destroy account) | Read-only emergency access |
| Lives on | Owner's password manager or written storage | The physical NFC tag |
| Stored on server as | SHA-256 hash | SHA-256 hash |
| Security model | Never in circulation | Cryptographically unguessable (128-bit random) |

---

## Self-Hosting

### Prerequisites

- Docker and Docker Compose, **or**
- A Railway account (Hobby plan required for persistent storage)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | **Yes** | Random string used to sign session cookies and encrypt the DEK in transit. Generate with `openssl rand -hex 32`. **You must set this in production.** |
| `NEXT_PUBLIC_BASE_URL` | **Yes** | The public URL of your deployment (e.g. `https://emergid.example.com`). Token URLs written to NFC tags use this domain. Must include `https://`. |
| `DATABASE_PATH` | No | Path to the SQLite database file. Defaults to `./emergid.db`. Set to a persistent volume path in containerized deployments. |

### Option 1: Docker Compose

```bash
# Download the compose file
curl -O https://raw.githubusercontent.com/codefruitio/emergid/main/docker-compose.yml

# Create .env file
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env
echo "NEXT_PUBLIC_BASE_URL=https://your-domain.com" >> .env

# Start
docker compose up -d
```

The app will be available at `http://localhost:9494`. Put it behind a reverse proxy (nginx, Caddy, Traefik) with HTTPS for production use -- **token URLs must be served over HTTPS**.

To update:

```bash
docker compose pull
docker compose up -d
```

Data is stored in a Docker volume (`emergid-data`) and persists across updates. The image is automatically published to [Docker Hub](https://hub.docker.com/r/codefruitio/emergid) on every push to main.

### Option 2: Railway

1. Fork this repo on GitHub
2. Go to [railway.com](https://railway.com) and create a new project from your fork
3. Add a **Volume**: right-click the project canvas, select New > Volume, set mount path to `/data`
4. Set environment variables in the Variables tab:
   - `DATABASE_PATH` = `/data/emergid.db`
   - `SESSION_SECRET` = *(output of `openssl rand -hex 32`)*
5. Generate a public domain: Settings > Networking > Generate Domain
6. Add one more variable: `NEXT_PUBLIC_BASE_URL` = `https://your-app.up.railway.app`

Railway auto-deploys on push to main. The Dockerfile handles the build and migrations run automatically on startup.

---

## NFC Tag Setup

After creating your account and entering your medical info:

1. Copy the token URL shown at the end of setup
2. Open an NFC writing app (e.g. NFC Tools on iOS/Android)
3. Write the URL as a URI record to your NFC tag
4. Label the tag visibly: **"TAP FOR MEDICAL INFO"**
5. Write your name on the tag label -- your name is not stored on the server

### Tag placement

Wear the tag on your person (wristband, keychain, medical alert band) so a first responder can tap it with their own phone. A locked iPhone requires the owner to unlock before opening NFC links, so the responder's phone needs to do the tapping.

### Platform compatibility

| Platform | Behavior |
|----------|----------|
| iPhone (iOS 13+) | Tapping tag shows a banner notification; tapping the banner opens the URL in Safari |
| iPhone (lock screen) | Banner appears but requires unlock to open |
| Android | URL opens automatically on tap; lock screen behavior varies by manufacturer |

---

## Important Notes for Users

- **Save your account number.** It is shown once at creation and cannot be recovered. There is no email reset, no support ticket, no fallback. Treat it like a crypto wallet seed phrase.
- **Log in at least once every 365 days** to keep your record active. Expired accounts are permanently and silently deleted.
- **Updating medical info** does not require reprogramming your NFC tag. The URL stays the same unless you reroll the token.
- **Rerolling the token** invalidates the old URL immediately. You must reprogram your NFC tag with the new URL. Do this if you suspect your URL has been copied or shared.

---

## Development

```bash
npm install
npx tsx src/lib/db/migrate.ts   # Create the database
npm run dev                      # Start dev server at http://localhost:3000
```

### Tech Stack

- **Next.js** (App Router) -- API routes and server-rendered medical card in one deployable unit
- **SQLite** via better-sqlite3 -- single-file database, no external services needed
- **Drizzle ORM** -- TypeScript ORM with migration support
- **Tailwind CSS** -- responsive, mobile-first styling
- **Node.js crypto** -- AES-256-GCM, SHA-256, PBKDF2 (100K iterations)

---

## License

MIT
