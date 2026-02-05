import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';

const IMAGES_DIR = path.join(__dirname, '../../public/images/properties');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

function getImageHash(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

function getLocalPath(url: string): string {
  const hash = getImageHash(url);
  const ext = path.extname(new URL(url).pathname) || '.jpg';
  return path.join(IMAGES_DIR, `${hash}${ext}`);
}

export function getLocalImageUrl(originalUrl: string | null): string | null {
  if (!originalUrl) return null;

  const hash = getImageHash(originalUrl);
  const ext = path.extname(new URL(originalUrl).pathname) || '.jpg';
  return `/images/properties/${hash}${ext}`;
}

export function imageExists(url: string): boolean {
  const localPath = getLocalPath(url);
  return fs.existsSync(localPath);
}

export async function downloadImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const localPath = getLocalPath(url);

      // Check if already exists
      if (fs.existsSync(localPath)) {
        resolve(getLocalImageUrl(url));
        return;
      }

      const protocol = url.startsWith('https') ? https : http;

      const file = fs.createWriteStream(localPath);

      protocol.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://sa.aqar.fm/'
        }
      }, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(localPath);
            downloadImage(redirectUrl).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(localPath);
          resolve(null);
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(getLocalImageUrl(url));
        });

        file.on('error', (err) => {
          fs.unlinkSync(localPath);
          console.error('File write error:', err);
          resolve(null);
        });
      }).on('error', (err) => {
        fs.unlinkSync(localPath);
        console.error('Download error:', err);
        resolve(null);
      });

    } catch (error) {
      console.error('Image download error:', error);
      resolve(null);
    }
  });
}

export async function downloadPropertyImages(propertyId: string, mainImageUrl: string | null, imageUrls: string[] = []): Promise<{
  localMainImage: string | null;
  localImages: string[];
}> {
  const localImages: string[] = [];
  let localMainImage: string | null = null;

  // Download main image
  if (mainImageUrl) {
    localMainImage = await downloadImage(mainImageUrl);
  }

  // Download additional images
  for (const url of imageUrls.slice(0, 10)) { // Limit to 10 images
    const localUrl = await downloadImage(url);
    if (localUrl) {
      localImages.push(localUrl);
    }
  }

  return { localMainImage, localImages };
}
