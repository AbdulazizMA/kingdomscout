import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../middleware/errorHandler';
import { downloadImage, downloadPropertyImages, imageExists, getLocalImageUrl } from '../services/imageProxy';

const router = Router();

// Proxy an image - downloads and caches it locally
router.get('/proxy', asyncHandler(async (req: Request, res: Response) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    const localUrl = await downloadImage(url);
    if (localUrl) {
      res.json({ localUrl, originalUrl: url });
    } else {
      res.status(500).json({ error: 'Failed to download image' });
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy image' });
  }
}));

// Download images for a specific property
router.post('/download/:propertyId', asyncHandler(async (req: Request, res: Response) => {
  const { propertyId } = req.params;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      mainImageUrl: true,
      imageUrls: true
    }
  });

  if (!property) {
    return res.status(404).json({ error: 'Property not found' });
  }

  const { localMainImage, localImages } = await downloadPropertyImages(
    property.id,
    property.mainImageUrl,
    property.imageUrls as string[]
  );

  // Update property with local image URLs
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      localMainImageUrl: localMainImage,
      localImageUrls: localImages
    }
  });

  res.json({
    propertyId,
    localMainImage,
    localImagesCount: localImages.length
  });
}));

// Batch download images for properties that don't have local copies
router.post('/download-batch', asyncHandler(async (req: Request, res: Response) => {
  const { limit = 50 } = req.body;

  // Find properties with images that haven't been downloaded locally
  const properties = await prisma.property.findMany({
    where: {
      mainImageUrl: { not: null },
      localMainImageUrl: null
    },
    select: {
      id: true,
      mainImageUrl: true,
      imageUrls: true
    },
    take: Math.min(limit, 100)
  });

  let downloaded = 0;
  let failed = 0;

  for (const property of properties) {
    try {
      const { localMainImage, localImages } = await downloadPropertyImages(
        property.id,
        property.mainImageUrl,
        property.imageUrls as string[]
      );

      if (localMainImage) {
        await prisma.property.update({
          where: { id: property.id },
          data: {
            localMainImageUrl: localMainImage,
            localImageUrls: localImages
          }
        });
        downloaded++;
      } else {
        failed++;
      }

      // Small delay to avoid overwhelming the source
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to download images for property ${property.id}:`, error);
      failed++;
    }
  }

  res.json({
    processed: properties.length,
    downloaded,
    failed
  });
}));

// Get download statistics
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const [total, withRemoteImages, withLocalImages] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { mainImageUrl: { not: null } } }),
    prisma.property.count({ where: { localMainImageUrl: { not: null } } })
  ]);

  res.json({
    totalProperties: total,
    withRemoteImages,
    withLocalImages,
    pendingDownload: withRemoteImages - withLocalImages
  });
}));

export { router as imagesRouter };
