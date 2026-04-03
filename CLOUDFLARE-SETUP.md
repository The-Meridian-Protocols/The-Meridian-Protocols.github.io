# Setting Up Your Cloudflare Worker — The Meridian

Hi Jaci! This guide walks you through activating the piece of your site that
protects your audio files. Don't let the technical-sounding words intimidate
you — I'll explain what everything actually *means* as we go.

---

## First, the big picture — what are we doing and why?

Your site has three services talking to each other:

- **Firebase** — handles your user accounts (sign up, sign in, sign out)
- **Supabase** — stores your actual audio track files
- **Cloudflare Worker** — acts as a secure "gatekeeper" between the two

Here's how it works when someone wants to listen to a track:

1. The listener signs in on your site (Firebase handles this)
2. Their browser asks your Cloudflare Worker: *"Can I have this audio file?"*
3. The Worker checks: *"Is this person actually signed in? Yes? OK."*
4. The Worker asks Supabase for a **temporary link** to the audio file
5. Supabase hands back a link that automatically expires after **2 hours**
6. The listener can play the track — but the link dies after 2 hours

This means your audio files are never publicly accessible. No account = no access.

---

## What are "secrets" and why do they matter?

Think of secrets like the keys to your house. You wouldn't tape them to the
front door for everyone to see. Your Supabase key is especially sensitive —
it's a master key that can access everything in your Supabase account.

The safe way to handle this: Cloudflare has a locked vault where you store your
keys privately. Your worker code simply says *"go get the key from the vault"*
— the actual key value never appears in your code or on GitHub.

You have three keys to store in that vault:

| What it's called       | What it actually is |
|------------------------|---------------------|
| `FIREBASE_PROJECT_ID`  | The name of your Firebase project — `meridian-caf0d` |
| `SUPABASE_URL`         | The web address of your Supabase project |
| `SUPABASE_SERVICE_KEY` | Your Supabase master key (the long string of letters and numbers) |

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

## Step 3 — Navigate to your website folder

You need to tell your terminal where your website files live. Type `cd ` (with
a space after it), then drag your website folder directly into the terminal
window — it will fill in the path automatically. Press Enter.

For example it might look like:
```
cd /Users/Jaci/Documents/The-Meridian-Protocols.github.io-main
```

---

## Step 4 — Create your wrangler.toml file

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

## Step 5 — Store your three secrets safely

Now you'll put your three keys into Cloudflare's secure vault, one at a time.
For each command below: type it in your terminal, press Enter, then paste the
value when it asks you. You won't see what you paste (that's intentional,
for security) — just paste and press Enter.

**Secret 1 — Firebase Project ID:**
```
wrangler secret put FIREBASE_PROJECT_ID
```
When prompted, paste: `meridian-caf0d`

---

**Secret 2 — Supabase URL:**
```
wrangler secret put SUPABASE_URL
```
When prompted, paste: `https://xcunrbdtanmdkfavmabi.supabase.co`

---

**Secret 3 — Supabase Service Key:**
```
wrangler secret put SUPABASE_SERVICE_KEY
```
When prompted, paste your Supabase service role key. To find it:
1. Go to **supabase.com** and open your project
2. Click **Project Settings** (the gear icon in the left sidebar)
3. Click **API**
4. Under "Project API keys", find the row that says **service_role**
5. Click the eye icon to reveal it, then copy and paste it into your terminal

---

## Step 6 — Deploy your worker

This is the final step — it sends your worker code up to Cloudflare's servers.
Type this and press Enter:

```
wrangler deploy
```

When it finishes, it will show you a URL that looks something like:
`https://meridian-worker.YOUR-NAME.workers.dev`

Copy that URL and keep it somewhere — you may need it later if you ever
want to check that the worker is running.

**That's it! Your worker is live.** 🎉

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
  Make sure you did Step 3 and navigated to your website folder first.

- **Anything else** — Feel free to share the exact error message and I can
  help you work through it.

---

## Quick reference — the three secrets

Keep these somewhere safe (like a password manager), as you may need them again:

| Secret name            | Where to find it |
|------------------------|------------------|
| `FIREBASE_PROJECT_ID`  | Always: `meridian-caf0d` |
| `SUPABASE_URL`         | Supabase → Project Settings → API → Project URL |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → service_role key |
