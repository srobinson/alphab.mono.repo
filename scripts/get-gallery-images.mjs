import fs from "fs/promises";
import path from "path";

// Configuration
const GITHUB_API_URL =
  "https://api.github.com/repos/srobinson/awake-image-storage/contents/optimized";
const OUTPUT_FILE = path.join(process.cwd(), "apps/gallery-web/public/images.json");
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // For higher rate limits, set this in your environment

async function fetchImages() {
  console.log("Fetching image list from GitHub...");

  const headers = {
    Accept: "application/vnd.github.v3+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (GITHUB_TOKEN) {
    headers["Authorization"] = `token ${GITHUB_TOKEN}`;
  }

  try {
    const response = await fetch(GITHUB_API_URL, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API responded with ${response.status}: ${await response.text()}`);
    }

    const files = await response.json();

    if (!Array.isArray(files)) {
      console.error("Unexpected response format from GitHub API:", files);
      throw new Error("Expected an array of files from the GitHub API.");
    }

    const imageObjects = files
      .filter(
        (file) =>
          file.type === "file" && (file.name.endsWith(".jpg") || file.name.endsWith(".png")),
      )
      .map((file) => ({
        full: file.download_url,
        thumbnail: file.download_url.replace("/optimized/", "/optimized/320/"),
      }));

    console.log(`Found ${imageObjects.length} images.`);

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(imageObjects, null, 2));

    console.log(`Successfully wrote image list to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error fetching or writing images:", error);
    process.exit(1);
  }
}

fetchImages();
