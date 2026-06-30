# Ctrl+Z — AI Mockup Generator Setup Guide (fal.ai)

## Architecture

```
Your React CRM
    ↓ POST /fashn-proxy
Supabase Edge Function  ← FAL_KEY stored securely here
    ↓ forwards to fal.ai
Fashn V1.6 model (hosted on fal.ai)
    ↓ returns mockup image URL
Back to your UI
```

## Step 1 — Get your fal.ai API Key (free to start)

1. Go to https://fal.ai and sign up (Google login works)
2. Dashboard → API Keys → Create new key
3. Copy the key (starts with something like `key-...`)
4. You get **free credits** on signup to test

No monthly subscription. Pay only per generation at **$0.075/image**.

---

## Step 2 — Deploy the Supabase Edge Function

```bash
# Inside your CRM project folder
supabase functions new fashn-proxy

# Paste the contents of index.ts into:
# supabase/functions/fashn-proxy/index.ts

# Set your fal.ai key as a secret
supabase secrets set FAL_KEY=your_fal_key_here

# Deploy
supabase functions deploy fashn-proxy
```

Your function URL:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/fashn-proxy
```

---

## Step 3 — Update MockupGenerator.jsx

Replace the two constants at the top:

```js
const EDGE_FUNCTION_URL = "https://YOUR_PROJECT_REF.supabase.co/functions/v1/fashn-proxy";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
```

---

## Step 4 — Add your own Indian model photos (important)

The default `imageUrl` in MODEL_PRESETS points to a sample image.
For real Indian model results, you need to:

1. Find or photograph Indian models (male/female) in plain T-shirts
2. Upload them to Supabase Storage:
   ```js
   const { data } = await supabase.storage
     .from('models')
     .upload('indian-male-urban.jpg', file);
   ```
3. Get the public URL and replace `imageUrl` in MODEL_PRESETS

**Good free sources for model photos:**
- Unsplash (search "Indian fashion model")
- Pexels (search "Indian model white background")
- Or use photos from Qikink's own model catalog

---

## Step 5 — Add to your CRM

```jsx
// In your router
import MockupGenerator from "./components/MockupGenerator";
<Route path="/mockup" element={<MockupGenerator />} />

// In your sidebar
<Link to="/mockup">🎨 AI Mockup</Link>
```

---

## Testing with curl

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/fashn-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "action": "tryon",
    "payload": {
      "model_image": "https://storage.googleapis.com/falserverless/example_inputs/model.png",
      "garment_image": "https://storage.googleapis.com/falserverless/example_inputs/garment.webp",
      "garment_photo_type": "flat-lay",
      "mode": "balanced"
    }
  }'
```

Response will include a `request_id`. Then poll status:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/fashn-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"action": "status", "payload": {"request_id": "YOUR_REQUEST_ID"}}'
```

When status is COMPLETED, fetch result:

```bash
curl -X POST ... -d '{"action": "result", "payload": {"request_id": "YOUR_REQUEST_ID"}}'
```

---

## Cost summary

| Action | Cost |
|---|---|
| Try-on (V1.6, quality mode) | $0.075 |
| 20 mockups/month | ~$1.50 |
| 50 mockups/month | ~$3.75 |

No monthly fee. No subscription. Pure pay-per-use.

---

## Troubleshooting

**"FAL_KEY not configured"** → Run `supabase secrets set FAL_KEY=...` and redeploy

**"No request ID returned"** → Your FAL_KEY is wrong or expired. Get a new one from fal.ai dashboard.

**Status stuck on IN_QUEUE** → fal.ai has a queue; wait up to 30 seconds. Normal behaviour.

**Image looks wrong** → The model_image needs to be a clear, well-lit photo of a person in a plain T-shirt. Avoid busy backgrounds.

**Garment design not preserved accurately** → Use flat-lay mode with a white background image. PNG with transparent background gives best results.
