import ImageKit from 'imagekit';
import fs from 'fs/promises';
import path from 'path';

let imagekitClient = null;

export const getImageKitClient = () => {
  if (imagekitClient) return imagekitClient;

  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (publicKey && privateKey && urlEndpoint) {
    imagekitClient = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
    console.log('[ImageKit] Initialized ImageKit SDK with provided credentials.');
  } else {
    console.warn('[ImageKit] Warning: ImageKit credentials not fully provided in .env. Falling back to local storage.');
  }

  return imagekitClient;
};

/**
 * Uploads a file buffer either to ImageKit or saves locally if credentials missing
 * @param {Object} params
 * @param {Buffer} params.buffer
 * @param {string} params.fileName
 * @param {string} params.folder
 * @returns {Promise<{ fileId: string, url: string, isLocal: boolean }>}
 */
export const uploadDocument = async ({ buffer, fileName, folder = 'careerpath/documents' }) => {
  const client = getImageKitClient();

  if (client) {
    try {
      const response = await client.upload({
        file: buffer.toString('base64'),
        fileName,
        folder,
        useUniqueFileName: true,
      });

      return {
        fileId: response.fileId,
        url: response.url,
        thumbnailUrl: response.thumbnailUrl || response.url,
        isLocal: false,
      };
    } catch (err) {
      console.error('[ImageKit] Upload failed, falling back to local storage:', err.message);
    }
  }

  // Local storage fallback
  const uploadsDir = path.resolve('uploads');
  await fs.mkdir(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const filePath = path.join(uploadsDir, safeName);
  await fs.writeFile(filePath, buffer);

  const localUrl = `/uploads/${safeName}`;
  return {
    fileId: `local-${safeName}`,
    url: localUrl,
    thumbnailUrl: localUrl,
    isLocal: true,
  };
};
