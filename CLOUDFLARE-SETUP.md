# Setting Up Your Cloudflare Worker — The Meridian

Hi Jaci! This guide walks you through activating the piece of your site that
protects your audio files. Don't let the technical-sounding words intimidate
you — I'll explain what everything actually *means* as we go.

---

## First, the big picture — what are we doing and why?

Your site has three services talking to each other:

- **Firebase** — handles your user accounts (sign up, sign in, sign out)
- **Cloudflare R2** — stores your audio track files (10 GB free, no bandwidth fees)
- **Cloudflare Worker** — acts as a secure "gatekeeper" between the two

Here's how it works when someone wants to listen to a track:

1. The listener signs in on your site (Firebase handles this)
2. Their browser asks your Cloudflare Worker: *"Can I have this audio file?"*
3. The Worker checks: *"Is this person actually signed in? Yes? OK."*
4. The Worker creates a **temporary link** directly to the audio file in R2
5. The link automatically expires after **2 hours**
6. The listener can play the track — but the link dies after 2 hours

This means your audio files are never publicly accessible. No account = no access.

---

## What are "secrets" and why do they matter?

Think of secrets like the keys to your house. You wouldn't tape them to the
front door for everyone to see. Your R2 access keys are especially sensitive —
they can read, write, and delete files in your storage.

The safe way to handle this: Cloudflare has a locked vault where you store your
keys privately. Your worker code simply says *"go get the key from the vault"*
— the actual key value never appears in your code or on GitHub.

You have four keys to store in that vault:

| What it's called        | What it actually is |
|-------------------------|---------------------|
| `FIREBASE_PROJECT_ID`   | The name of your Firebase project — `meridian-caf0d` |
| `R2_ACCOUNT_ID`         | Your Cloudflare account ID |
| `R2_ACCESS_KEY_ID`      | The Access Key ID from your R2 API token |
| `R2_SECRET_ACCESS_KEY`  | The Secret from your R2 API token (the long string) |

---

## Before you start — what you need

You'll need a **terminal** (also called a command prompt or command line).
- On a **Mac**: press Command + Space, type "Terminal", hit Enter
- On **Windows**: press the Windows key, type "cmd", hit Enter

You also need **Node.js** installed. To check if you have it, type this in
your terminal and press Enter:
```
node --version
```
If you see a version number like `v18.0.0`, you're good. If you get an error,
download Node.js for free from **nodejs.org** (click the big green "LTS" button).

---

## Step 1 — Install Wrangler (Cloudflare's helper tool)

Wrangler is a free tool made by Cloudflare that lets you manage your worker
from your terminal. Think of it as a remote control for your Cloudflare account.

In your terminal, type this and press Enter:
```
npm install -g wrangler
```

If you get a "permission denied" error, use this instead:
```
sudo npm install -g wrangler
```

You'll see a bunch of text scroll by — that's normal. When it stops, type:
```
wrangler --version
```
If you see a version number, it worked!

---

## Step 2 — Log in to your Cloudflare account

Type this and press Enter:
```
wrangler login
```

A browser window will open asking you to log in to Cloudflare. Sign in with
your normal Cloudflare username and password, then click **Allow** when it asks
for permission. Your terminal will confirm you're logged in.

---

## Step 3 — Find your Cloudflare Account ID

You'll need this for one of the secrets below.

1. Go to **dash.cloudflare.com** and log in
2. Click on any domain in your account (or just go to the main dashboard)
3. On the right side of the page you'll see **Account ID** — it's a long string
   of letters and numbers like `b0af59d37fa2ba8753ae0f65860807dc`
4. Copy it and keep it somewhere handy

---

## Step 4 — Create your R2 API Token

This gives the Worker permission to access your audio files. Think of it as
creating a special key that only opens the audio storage cabinet.

1. Go to **dash.cloudflare.com** and log in
2. Click **R2** in the left sidebar
3. Click **Manage R2 API Tokens** (top right of the R2 page)
4. Click **Create API Token**
5. Give it a name — something like `meridian-audio-reader`
6. Under **Permissions**, select **Object Read Only**
   (the Worker only needs to *read* files, not write or delete them)
7. Under **Specify bucket(s)**, select your `meridian-audio` bucket
8. Click **Create API Token**

You'll see a page with two values — **this is the only time you'll see them**,
so copy them right now before clicking away:

- **Access Key ID** — looks like a short string of letters and numbers
- **Secret Access Key** — a much longer string

Paste both into a notes app or password manager before proceeding.

---

## Step 5 — Navigate to your website folder

You need to tell your terminal where your website files live. Type `cd ` (with
a space after it), then drag your website folder directly into the terminal
window — it will fill in the path automatically. Press Enter.

For example it might look like:
```
cd /Users/Jaci/Documents/The-Meridian-Protocols.github.io-main
```

---

## Step 6 — Create your wrangler.toml file

This file tells Cloudflare basic information about your worker. In your
website folder, create a new text file called `wrangler.toml` and paste
this exactly into it:

```toml
name = "meridian-worker"
main = "meridian-worker.js"
compatibility_date = "2024-01-01"
```

Save the file. That's it — just those three lines. This file stays on your
computer only and will never be uploaded to GitHub (it's already in the
ignore list).

---

## Step 7 — Store your four secrets safely

Now you'll put your four keys into Cloudflare's secure vault, one at a time.
For each command below: type it in your terminal, press Enter, then paste the
value when it asks you. You won't see what you paste (that's intentional,
for security) — just paste and press Enter.

**Secret 1 — Firebase Project ID:**
```
wrangler secret put FIREBASE_PROJECT_ID
```
When prompted, paste: `meridian-caf0d`

---

**Secret 2 — Cloudflare Account ID:**
```
wrangler secret put R2_ACCOUNT_ID
```
When prompted, paste the Account ID you found in Step 3.

---

**Secret 3 — R2 Access Key ID:**
```
wrangler secret put R2_ACCESS_KEY_ID
```
When prompted, paste the **Access Key ID** you got in Step 4.

---

**Secret 4 — R2 Secret Access Key:**
```
wrangler secret put R2_SECRET_ACCESS_KEY
```
When prompted, paste the **Secret Access Key** you got in Step 4.

---

## Step 8 — Deploy your worker

This is the final step — it sends your worker code up to Cloudflare's servers.
Type this and press Enter:

```
wrangler deploy
```

When it finishes, it will show you a URL that looks something like:
`https://meridian-worker.YOUR-NAME.workers.dev`

Your worker URL is: `https://meridian-worker.architectmeridian.workers.dev`

**That's it! Your worker is live.** 🎉

---

## Uploading audio files to R2

Your audio files need to be uploaded to your R2 bucket (`meridian-audio`)
before the worker can serve them. Here's how:

1. Go to **dash.cloudflare.com** and log in
2. Click **R2** in the left sidebar
3. Click on your `meridian-audio` bucket
4. Click **Upload** and upload your MP3 files

Your files need to be in a folder called `full` inside the bucket. So an
audio file called `RL001.mp3` should be uploaded so its path inside the
bucket is `full/RL001.mp3`.

To create the folder structure: when uploading, in the destination path field,
type `full/` before the filename.

---

## A note about your Firebase file

You may have noticed that your `meridian-firebase.js` file contains some
keys too. Those are completely safe to be on GitHub — Firebase designed them
that way. They're more like a "username" than a password. The real protection
for your Firebase data comes from the rules you set inside your Firebase
Console, not from hiding those keys.

One optional extra step for peace of mind: in your Firebase Console, go to
**Authentication → Settings → Authorized Domains** and make sure only
`the-meridian-protocols.github.io` is listed. This means Firebase will only
accept sign-ins from your actual website.

---

## Something went wrong?

The most common issues and what they mean:

- **"command not found: wrangler"** — Node.js wasn't installed correctly.
  Try closing your terminal, reopening it, and running the npm install step again.

- **"error: not authenticated"** — Run `wrangler login` again.

- **"no such file or directory"** — You're in the wrong folder.
  Make sure you did Step 5 and navigated to your website folder first.

- **Audio won't play / "Could not generate audio URL"** — The R2 secrets
  may not be set correctly. Re-run the `wrangler secret put` commands
  from Step 7 to re-enter the values.

- **Anything else** — Feel free to share the exact error message and I can
  help you work through it.

---

## Quick reference — the four secrets

Keep these somewhere safe (like a password manager), as you may need them again:

| Secret name             | Where to find it |
|-------------------------|------------------|
| `FIREBASE_PROJECT_ID`   | Always: `meridian-caf0d` |
| `R2_ACCOUNT_ID`         | Cloudflare Dashboard → right sidebar → Account ID |
| `R2_ACCESS_KEY_ID`      | Cloudflare → R2 → Manage R2 API Tokens |
| `R2_SECRET_ACCESS_KEY`  | Cloudflare → R2 → Manage R2 API Tokens (only shown once!) |
