import { R2_CONFIG } from "../config/cf.js";

function sanitizeFileName(fileName = "upload.bin") {
  return String(fileName || "upload.bin")
    .replace(/[/\\\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 160);
}

export async function uploadAssetToR2(input) {
  const formData = new FormData();
  if (!input?.asset?.buffer) {
    throw new Error("uploadAssetToR2 requires an asset with a Buffer.");
  }

  const mimetype = input.asset.mimetype || "application/octet-stream";
  const fileName = sanitizeFileName(input.asset.fileName || "upload.bin");
  console.log(
    `Uploading asset to R2 with filename: ${fileName} and mimetype: ${mimetype}`,
  );
  const blob = new Blob([input.asset.buffer], { type: mimetype });
  formData.append("file", blob, fileName);
  formData.append("folder", input.folder ?? "profiles");

  const response = await fetch(R2_CONFIG.r2.uploadWorkerUrl, {
    method: "POST",
    body: formData,
  });

  const responseText = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok) {
    throw new Error(
      responseText || `Cloudflare upload failed with status ${response.status}`,
    );
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `Upload endpoint did not return JSON. Received content-type: ${
        contentType || "unknown"
      }. Response: ${responseText.slice(0, 180)}`,
    );
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Upload endpoint returned invalid JSON. Response: ${responseText.slice(
        0,
        180,
      )}`,
    );
  }

  if (!data.publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned.");
  }
  return data.publicUrl;
}

export async function deleteAssetFromR2(publicUrl) {
  const trimmedUrl = publicUrl.trim();
  if (!trimmedUrl) {
    return;
  }

  const response = await fetch(trimmedUrl, {
    method: "DELETE",
  });
  const responseText = await response.text();

  if (!response.ok && response.status !== 404) {
    throw new Error(
      responseText || `Cloudflare delete failed with status ${response.status}`,
    );
  }
}

export async function uploadBufferToR2(
  { buffer, mimetype, fileName },
  folder = "blog-covers",
) {
  if (!buffer) return null;

  return uploadAssetToR2({
    asset: {
      buffer,
      mimetype,
      fileName,
    },
    folder,
  });
}
