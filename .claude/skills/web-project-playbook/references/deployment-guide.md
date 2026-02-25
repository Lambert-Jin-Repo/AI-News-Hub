# Deployment Guide Reference

## Universal: The Dockerfile

Every deployment option (except Vercel) starts with the same multi-stage Dockerfile.

```dockerfile
# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# CRITICAL: NEXT_PUBLIC_* vars must be available at build time
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

RUN npm run build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 8080
CMD ["node", "server.js"]
```

**Key points:**
- `output: 'standalone'` in `next.config.ts` is required
- `NEXT_PUBLIC_*` variables are embedded at build time, not runtime
- Non-root user (`nextjs`) for security
- Port 8080 (Cloud Run default; change to 3000 for other platforms)

### .dockerignore

```
node_modules
.next
.git
.env*
!.env.example
Dockerfile
.dockerignore
*.md
docs
.claude
```

---

## Google Cloud Run

### One-Time Setup

```bash
# Enable APIs
gcloud services enable run.googleapis.com artifactregistry.googleapis.com secretmanager.googleapis.com

# Create Artifact Registry repository
gcloud artifacts repositories create my-app \
    --repository-format=docker \
    --location=australia-southeast1

# Create a dedicated service account (don't use default)
gcloud iam service-accounts create my-app-runner \
    --display-name="My App Cloud Run"

# Grant minimum permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:my-app-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Store Secrets in Secret Manager

```bash
echo -n "your-secret-value" | gcloud secrets create SUPABASE_SECRET_KEY \
    --data-file=- --replication-policy="automatic"

# Repeat for each secret
```

### Deploy Workflow (.github/workflows/deploy.yml)

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: australia-southeast1
  SERVICE: my-app
  REPO: my-app

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
          # Or prefer Workload Identity Federation:
          # workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          # service_account: deploy@${{ secrets.GCP_PROJECT_ID }}.iam.gserviceaccount.com

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev

      - name: Build Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}:${{ github.sha }} \
            -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}:latest \
            .

      - name: Push Docker image
        run: |
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}:latest

      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy ${{ env.SERVICE }} \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}:${{ github.sha }} \
            --region ${{ env.REGION }} \
            --platform managed \
            --allow-unauthenticated \
            --port 8080 \
            --memory 512Mi \
            --cpu 1 \
            --min-instances 0 \
            --max-instances 2 \
            --concurrency 40 \
            --timeout 300 \
            --service-account my-app-runner@${{ env.PROJECT_ID }}.iam.gserviceaccount.com \
            --set-secrets "SUPABASE_SECRET_KEY=SUPABASE_SECRET_KEY:latest,CRON_SECRET=CRON_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest" \
            --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }},NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}" \
            --startup-probe-path=/api/health \
            --liveness-probe-path=/api/health

      - name: Clean up old images
        run: |
          gcloud artifacts docker images list \
            ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }} \
            --format="get(DIGEST)" --sort-by="~CREATE_TIME" \
            | tail -n +4 \
            | xargs -I {} gcloud artifacts docker images delete \
              ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/${{ env.REPO }}/${{ env.SERVICE }}@{} \
              --quiet || true
```

### Cloud Run Common Pitfalls

1. **`NEXT_PUBLIC_*` not in build args** — Frontend silently fails. These are baked at build time.
2. **No `--service-account`** — Uses default compute account with `Editor` role (too broad).
3. **No health probe** — Cloud Run can't detect unhealthy instances.
4. **`GOOGLE_APPLICATION_CREDENTIALS` is a file path** — Can't use with `--set-env-vars`. Either use Workload Identity Federation (Cloud Run SA gets TTS permissions directly) or base64-encode the JSON into a secret and decode at runtime.
5. **No `--concurrency` limit** — Heavy background jobs (LLM, TTS) can overload a single instance.
6. **CRON curl without timeout** — GitHub Actions `curl` should use `--max-time 180`.

### Cloud Run Cost Optimization

```
--min-instances 0          # Scale to zero when idle
--max-instances 2          # Cap maximum cost
--cpu-throttling            # Reduce CPU when idle (default)
--memory 512Mi             # Don't over-allocate
--startup-cpu-boost        # Faster cold starts
```

---

## Vercel

### Setup

No Dockerfile needed. Vercel handles build and deployment natively.

```bash
npm i -g vercel
vercel login
vercel link    # Connect to project
```

### Environment Variables

Set in Vercel Dashboard > Settings > Environment Variables, or via CLI:

```bash
vercel env add SUPABASE_SECRET_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL production preview development
```

`NEXT_PUBLIC_*` vars are automatically available at build time on Vercel.

### Deploy

```bash
# Auto-deploy on push to main (recommended)
# Or manual:
vercel --prod
```

### Vercel CRON Jobs (vercel.json)

```json
{
    "crons": [
        {
            "path": "/api/jobs/fetch-news",
            "schedule": "0 0,12 * * *"
        },
        {
            "path": "/api/jobs/summarise",
            "schedule": "30 0,12 * * *"
        },
        {
            "path": "/api/jobs/daily-digest",
            "schedule": "0 22 * * *"
        }
    ]
}
```

Note: Vercel CRON requires the Hobby plan ($20/mo) or higher. Free tier has no CRON.

### Vercel vs Cloud Run

| Factor | Vercel | Cloud Run |
|--------|--------|-----------|
| **Next.js optimization** | Native, best-in-class | Manual via Dockerfile |
| **CRON jobs** | Built-in (paid plans) | External (GitHub Actions, Cloud Scheduler) |
| **Cold starts** | Fast (edge network) | Slower (container boot) |
| **Cost at low traffic** | Free tier generous | Scale-to-zero, ~$0.50-2/mo |
| **Cost at high traffic** | Expensive (per-request) | Cheaper (per-second) |
| **Docker support** | No | Yes |
| **Custom runtime** | Limited | Full control |
| **Secret management** | Env vars only | Secret Manager integration |

**Recommendation:** Use Vercel for rapid iteration and Next.js-specific features. Use Cloud Run for cost control at scale and Docker flexibility.

---

## AWS (ECS Fargate)

### Workflow (simplified)

```yaml
- name: Login to ECR
  run: aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

- name: Build and push
  run: |
    docker build -t $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/my-app:${{ github.sha }} .
    docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/my-app:${{ github.sha }}

- name: Deploy to ECS
  run: |
    aws ecs update-service --cluster my-cluster --service my-app \
      --force-new-deployment
```

AWS requires more setup (ECS cluster, task definition, ALB, target groups, VPC). Use **AWS Copilot** or **SST** to simplify.

### AWS Secrets

Use AWS Secrets Manager or SSM Parameter Store. Reference in task definitions.

---

## Azure Container Apps

### Workflow (simplified)

```yaml
- name: Login to ACR
  run: az acr login --name myregistry

- name: Build and push
  run: |
    docker build -t myregistry.azurecr.io/my-app:${{ github.sha }} .
    docker push myregistry.azurecr.io/my-app:${{ github.sha }}

- name: Deploy to Container Apps
  run: |
    az containerapp update --name my-app --resource-group my-rg \
      --image myregistry.azurecr.io/my-app:${{ github.sha }}
```

Azure Container Apps is the closest equivalent to Cloud Run. Scale-to-zero, managed, container-based.

---

## Self-Hosted (VPS / Bare Metal)

### Basic Setup with Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "8080:8080"
    env_file: .env.production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Deploy via SSH

```yaml
# .github/workflows/deploy.yml
- name: Deploy to VPS
  uses: appleboy/ssh-action@v1
  with:
    host: ${{ secrets.VPS_HOST }}
    username: deploy
    key: ${{ secrets.VPS_SSH_KEY }}
    script: |
      cd /opt/my-app
      git pull origin main
      docker compose build
      docker compose up -d
      docker system prune -f
```

### Reverse Proxy (Nginx or Caddy)

```
# Caddyfile (automatic HTTPS)
myapp.com {
    reverse_proxy localhost:8080
}
```

### Self-Hosted CRON

Use system crontab instead of GitHub Actions:

```cron
0 0,12 * * *  curl -s -H "x-cron-secret: $SECRET" http://localhost:8080/api/jobs/fetch-news
30 0,12 * * * curl -s -H "x-cron-secret: $SECRET" http://localhost:8080/api/jobs/summarise
0 22 * * *    curl -s -H "x-cron-secret: $SECRET" http://localhost:8080/api/jobs/daily-digest
```

---

## Platform Decision Matrix

| Criterion | Vercel | Cloud Run | AWS ECS | Azure CA | Self-Hosted |
|-----------|--------|-----------|---------|----------|-------------|
| Setup effort | Low | Medium | High | Medium | High |
| Next.js integration | Best | Good | Good | Good | Good |
| Scale to zero | Yes | Yes | Yes (Fargate) | Yes | No |
| Custom Docker | No | Yes | Yes | Yes | Yes |
| Free tier | Generous | $0 at idle | 12mo free | $0 at idle | $5/mo VPS |
| CRON built-in | Paid only | No (use Cloud Scheduler or GH Actions) | EventBridge | Timer triggers | System cron |
| Vendor lock-in | High | Low | Medium | Medium | None |

**Quick Decision:**
- Solo project, Next.js, fast iteration → **Vercel**
- Need Docker, CRON, cost control → **Cloud Run**
- Enterprise, multi-service → **AWS ECS** or **Azure CA**
- Full control, fixed budget → **Self-hosted VPS**
