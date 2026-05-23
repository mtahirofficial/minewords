# Cloudflare R2 Upload Worker

This Worker provides the `POST /upload` endpoint expected by the React Native app.

## What it does

- accepts `multipart/form-data`
- reads the `file` field
- optionally reads the `folder` field
- uploads the file into an R2 bucket
- returns JSON:

```json
{ "publicUrl": "https://your-public-base-url/folder/file.jpg" }
```

## Important security note

Do not place your R2 API key or secret in the mobile app.

The credentials you shared should be rotated in Cloudflare, then added only to your Worker/server environment if needed. This Worker uses an R2 bucket binding, which is the safer Cloudflare-native approach and does not require putting those secrets into source files.

## Setup

1. Create an R2 bucket in Cloudflare.
2. Update `worker/wrangler.toml`:
   - set `bucket_name`
   - set `PUBLIC_BASE_URL`
3. Install worker dependencies:

```powershell
cd worker
npm install
```

4. Login to Wrangler:

```powershell
npx wrangler login
```

5. Deploy:

```powershell
npm run deploy
```

6. Copy the deployed Worker URL into:

`src/config/appConfig.ts`

```ts
uploadWorkerUrl: 'https://your-worker.your-subdomain.workers.dev/upload'
```

## If you want public image URLs

`PUBLIC_BASE_URL` should point to a public domain that serves your bucket objects, for example:

- an R2 custom domain
- a public bucket domain you configured in Cloudflare

## Request format

The mobile app sends:

- `file`: uploaded image file
- `folder`: `profile-photos` or `gallery`
