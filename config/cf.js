const R2_CONFIG = {
  r2: {
    uploadWorkerUrl: "https://minewords.hmtahirs1.workers.dev/upload",
  },
};

function hasCloudflareUploadConfig() {
  return (
    APP_CONFIG?.r2?.uploadWorkerUrl != null &&
    APP_CONFIG.r2.uploadWorkerUrl !== "YOUR_CLOUDFLARE_UPLOAD_WORKER_URL"
  );
}
module.exports = { R2_CONFIG, hasCloudflareUploadConfig };
