# Deploying Sahayak Backend to Render

This guide explains how to deploy the **Sahayak FastAPI Backend** on [Render](https://render.com).

---

## Option 1: Automatic Deployment using Render Blueprint (Recommended)

1. Push your repository changes to GitHub:
   ```bash
   git add .
   git commit -m "Add Render deployment configuration and Dockerfile"
   git push origin main
   ```
2. Go to your [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** in the top right and select **Blueprint**.
4. Connect your GitHub repository (`https://github.com/Tushar2007-ux/Bosc`).
5. Render will automatically detect `render.yaml`.
6. When prompted for `ANTHROPIC_API_KEY`, enter your key (`sk-ant-...`).
7. Click **Apply**. Render will build and deploy the web service automatically.

---

## Option 2: Manual Web Service Setup on Render

If you prefer to configure the service manually on Render:

1. Click **New +** → **Web Service**.
2. Select your repository.
3. Configure the following settings:
   - **Name**: `sahayak-backend`
   - **Region**: `Oregon (US West)` or `Singapore`
   - **Root Directory**: `backend`
   - **Runtime**: `Python` *(or `Docker`)*
   - **Build Command**: `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
4. Under **Environment Variables**, add the variables listed below.

---

## Environment Variables Reference

| Key | Value / Description | Default / Example |
|---|---|---|
| `ENVIRONMENT` | Deployment environment | `production` |
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` ([Get one here](https://console.anthropic.com/settings/keys)) |
| `ANTHROPIC_MODEL` | Claude model name | `claude-sonnet-5` |
| `ANTHROPIC_MAX_TOKENS` | Max tokens per response | `700` |
| `ANTHROPIC_EFFORT` | Reasoning effort | `low` |
| `DATA_GOV_IN_API_KEY` | data.gov.in Agmarknet API key | `579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b` |
| `CROP_MODEL_PATH` | Relative path to ONNX model | `models/crop_disease.onnx` |
| `DATABASE_URL` | Database connection URL | `sqlite:///./sahayak.db` |
| `CORS_ORIGINS` | Allowed origins (wildcard or comma-separated) | `*` or `https://your-frontend.vercel.app` |

---

## Connecting the Frontend to the Deployed Backend

Once your backend is deployed, Render provides a URL (e.g. `https://sahayak-backend.onrender.com`).

Set this in your frontend environment:
```env
NEXT_PUBLIC_API_BASE_URL=https://sahayak-backend.onrender.com
```

### Verification

Test your deployed backend health endpoint:
```bash
curl https://<your-service-name>.onrender.com/api/health
# Response: {"status":"ok"}
```
