// supabase/functions/fashn-proxy/index.ts
// Deploy: supabase functions deploy fashn-proxy
// Secret: supabase secrets set FAL_KEY=your_fal_key_here
//
// fal.ai hosts Fashn V1.6 — same model, no monthly subscription needed.
// Get your key at: https://fal.ai/dashboard/keys

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const FAL_QUEUE = "https://queue.fal.run";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const ALLOWED_ACTIONS = ["tryon", "status", "result"];

serve(async (req: Request) => {

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (!action || !ALLOWED_ACTIONS.includes(action)) {
      return new Response(JSON.stringify({ error: `Invalid action. Must be one of: ${ALLOWED_ACTIONS.join(", ")}` }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const falKey = Deno.env.get("FAL_KEY");
    if (!falKey) {
      return new Response(JSON.stringify({ error: "FAL_KEY not configured on server." }), {
        status: 500, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const authHeader = { "Authorization": `Key ${falKey}`, "Content-Type": "application/json" };
    let url: string;
    let method = "POST";
    let requestBody: string | undefined;

    if (action === "tryon") {
      url = `${FAL_QUEUE}/fal-ai/fashn/tryon/v1.6`;
      requestBody = JSON.stringify({
        model_image: payload.model_image,
        garment_image: payload.garment_image,
        garment_photo_type: payload.garment_photo_type || "auto",
        mode: payload.mode || "balanced",
        num_samples: 1,
      });
    } else if (action === "status") {
      if (!payload.request_id) {
        return new Response(JSON.stringify({ error: "request_id required." }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      url = `${FAL_QUEUE}/fal-ai/fashn/tryon/v1.6/requests/${payload.request_id}/status`;
      method = "GET";
    } else {
      // result
      if (!payload.request_id) {
        return new Response(JSON.stringify({ error: "request_id required." }), {
          status: 400, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
      url = `${FAL_QUEUE}/fal-ai/fashn/tryon/v1.6/requests/${payload.request_id}`;
      method = "GET";
    }

    const falRes = await fetch(url, {
      method,
      headers: authHeader,
      ...(requestBody ? { body: requestBody } : {}),
    });

    const data = await falRes.json();

    return new Response(JSON.stringify(data), {
      status: falRes.status,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
