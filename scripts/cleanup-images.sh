#!/usr/bin/env bash
# Artifact Registry cleanup — keep only the last 3 images
# Called from the deploy workflow after a successful deployment

set -euo pipefail

REGION="${REGION:-australia-southeast1}"
PROJECT_ID="${PROJECT_ID:-$GCP_PROJECT_ID}"
REPO="ai-news-hub"
IMAGE="ai-news-hub"
KEEP=3

FULL_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE}"

echo "Cleaning up old images from ${FULL_PATH} (keeping last ${KEEP})..."

# List all image digests sorted by upload time (newest first)
DIGESTS=$(gcloud artifacts docker images list "${FULL_PATH}" \
  --format="value(version)" \
  --sort-by="~CREATE_TIME" 2>/dev/null || true)

if [ -z "$DIGESTS" ]; then
  echo "No images found — skipping cleanup."
  exit 0
fi

# Skip the first $KEEP entries, delete the rest
COUNT=0
while IFS= read -r digest; do
  COUNT=$((COUNT + 1))
  if [ "$COUNT" -le "$KEEP" ]; then
    echo "Keeping: ${digest}"
    continue
  fi
  echo "Deleting: ${digest}"
  gcloud artifacts docker images delete "${FULL_PATH}@${digest}" \
    --quiet --delete-tags 2>/dev/null || true
done <<< "$DIGESTS"

echo "Cleanup complete."
