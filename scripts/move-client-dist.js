const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const sourceDir = path.join(rootDir, "client", "dist");
const targetDir = path.join(rootDir, "dist");

function isRetryableFsError(error) {
  return ["EPERM", "EBUSY", "ENOTEMPTY", "EXDEV"].includes(error?.code);
}

function removeDirWithRetries(dirPath, retries = 5) {
  for (let i = 0; i < retries; i += 1) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      if (!fs.existsSync(dirPath)) return;
    } catch (error) {
      if (!isRetryableFsError(error)) throw error;
    }
  }

  if (fs.existsSync(dirPath)) {
    throw new Error(`[move-client-dist] Failed to remove directory: ${dirPath}`);
  }
}

function moveClientDistToRoot() {
  if (!fs.existsSync(sourceDir)) {
    console.warn(`[move-client-dist] Source not found: ${sourceDir}`);
    return;
  }

  if (fs.existsSync(targetDir)) {
    removeDirWithRetries(targetDir);
  }

  try {
    fs.renameSync(sourceDir, targetDir);
    console.log(`[move-client-dist] Moved ${sourceDir} -> ${targetDir}`);
  } catch (error) {
    if (!isRetryableFsError(error)) {
      throw error;
    }

    // Windows may lock rename on busy folders. Fall back to copy + delete.
    fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
    removeDirWithRetries(sourceDir);
    console.log(`[move-client-dist] Copied ${sourceDir} -> ${targetDir}`);
  }
}

moveClientDistToRoot();
