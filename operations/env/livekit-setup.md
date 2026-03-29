# LiveKit Cloud Setup - Trust Agent Desktop

LiveKit powers real-time voice sessions between users and hired agent roles.
This guide covers setting up LiveKit Cloud (hosted) - not self-hosted.

## 1. Create a LiveKit Cloud Account

1. Go to https://cloud.livekit.io
2. Sign up with your email or GitHub account
3. You will land on the LiveKit Cloud dashboard after verification

## 2. Create a Project

1. In the dashboard, click "New Project"
2. Name it `trust-agent-production` (or `trust-agent-dev` for development)
3. Select the region closest to your users (e.g., `us-east` for US-based)
4. The project will be provisioned in a few seconds

## 3. Get API Credentials

1. In your project dashboard, go to "Settings" > "Keys"
2. Click "Add new key"
3. Copy the **API Key** (starts with `API...`)
4. Copy the **API Secret** (shown once - save it securely)
5. Note the **Server URL** shown at the top of your project dashboard
   - Format: `wss://<project-name>.livekit.cloud`

## 4. Set Environment Variables

Add these to your `.env` file:

```
LIVEKIT_API_KEY=APIxxxxxxxxxx
LIVEKIT_API_SECRET=your-secret-here
LIVEKIT_SERVER_URL=wss://trust-agent-production.livekit.cloud
```

For the frontend (Vite), also set:

```
VITE_LIVEKIT_SERVER_URL=wss://trust-agent-production.livekit.cloud
```

## 5. Test the Connection

Run the test script:

```bash
cd operations/env
bash livekit-test.sh
```

This will:
- Verify env vars are set
- Generate a test access token using the server SDK
- Confirm the credentials are valid

## 6. How It Works in Trust Agent

1. User starts a voice session with a hired agent role
2. Frontend calls `POST /livekit/token` with userId, hireId, roomName
3. Server validates auth, generates a LiveKit access token with room grants
4. Frontend connects to LiveKit Cloud using the token and server URL
5. Audio is streamed to the agent-runtime voice pipeline via LiveKit tracks
6. Agent audio responses are published back through LiveKit

Room naming convention: `session-{hireId}-{timestamp}`

## 7. Pricing Notes

**LiveKit Cloud Free Tier:**
- 50 participant-minutes per month (no credit card required)
- Sufficient for development and testing
- A 1-on-1 voice session (user + agent) uses 2 participant-minutes per minute

**Paid Plans:**
- Pay-as-you-go: ~$0.004/participant-minute after free tier
- Volume discounts available for higher usage
- See https://livekit.io/pricing for current rates

**Estimating costs for Trust Agent:**
- Each voice session = 2 participants (user + agent runtime)
- 10-minute session = 20 participant-minutes
- Free tier covers ~2.5 hours of voice sessions per month
- At scale: 1,000 hours/month ~ $480/month

## 8. Troubleshooting

**"Invalid API key" error:**
- Verify LIVEKIT_API_KEY matches exactly what is shown in the dashboard
- Ensure no extra whitespace or quotes around the value

**"Connection refused" or timeout:**
- Check LIVEKIT_SERVER_URL starts with `wss://`
- Confirm the project is active in the LiveKit Cloud dashboard

**Token generation fails:**
- Ensure `livekit-server-sdk` is installed: `npm ls livekit-server-sdk`
- Verify LIVEKIT_API_SECRET is the full secret, not truncated
