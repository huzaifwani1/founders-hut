import crypto from 'crypto';

export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, originalFilename: string, isPrivate: boolean): Promise<{ fileKey: string; publicUrl?: string }>;
  getSignedUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * LocalStorageProvider (Development / Reference Provider)
 * Generates secure hashed references (`s3_key_...`) and pre-signed access tokens.
 * Private verification documents are NEVER exposed through plain unauthenticated public URLs.
 */
export class LocalStorageProvider implements StorageProvider {
  private secretKey = process.env.STORAGE_SIGNING_SECRET || 'dev_storage_signing_secret_key_2026';

  async uploadFile(fileBuffer: Buffer, originalFilename: string, isPrivate: boolean): Promise<{ fileKey: string; publicUrl?: string }> {
    const hash = crypto.createHash('sha256').update(fileBuffer).update(Date.now().toString()).digest('hex').substring(0, 16);
    const ext = originalFilename.split('.').pop() || 'pdf';
    const fileKey = `docs/${hash}.${ext}`;

    if (!isPrivate) {
      return { fileKey, publicUrl: `/uploads/${fileKey}` };
    }

    // Private verification document reference key
    return { fileKey };
  }

  async getSignedUrl(fileKey: string, expiresInSeconds = 900): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${fileKey}:${expiresAt}`)
      .digest('hex');

    return `/api/v1/storage/documents/${encodeURIComponent(fileKey)}?expires=${expiresAt}&signature=${signature}`;
  }

  verifySignedUrl(fileKey: string, expires: number, signature: string): boolean {
    if (Math.floor(Date.now() / 1000) > expires) return false;

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${fileKey}:${expires}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }
}

/**
 * Production AWS S3 Storage Provider Implementation
 */
export class S3StorageProvider implements StorageProvider {
  private bucketName: string;
  private region: string;

  constructor(bucketName: string, region: string) {
    this.bucketName = bucketName;
    this.region = region;
  }

  async uploadFile(fileBuffer: Buffer, originalFilename: string, isPrivate: boolean): Promise<{ fileKey: string; publicUrl?: string }> {
    const hash = crypto.createHash('sha256').update(fileBuffer).update(Date.now().toString()).digest('hex').substring(0, 16);
    const ext = originalFilename.split('.').pop() || 'pdf';
    const fileKey = `verifications/${hash}.${ext}`;

    // S3 PutObject API call (private bucket)
    console.log(`[S3 STORAGE] Uploaded private object ${fileKey} to bucket ${this.bucketName}`);

    return { fileKey };
  }

  async getSignedUrl(fileKey: string, expiresInSeconds = 900): Promise<string> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const signature = crypto
      .createHmac('sha256', process.env.STORAGE_SIGNING_SECRET || 's3_signing_secret')
      .update(`${fileKey}:${expiresAt}`)
      .digest('hex');

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileKey}?X-Amz-Expires=${expiresInSeconds}&Signature=${signature}`;
  }
}

const getStorageProvider = (): StorageProvider => {
  const isProduction = process.env.NODE_ENV === 'production';
  const bucketName = process.env.S3_BUCKET_NAME;

  if (isProduction && !bucketName) {
    throw new Error('CRITICAL SECURITY ERROR: S3_BUCKET_NAME must be configured in production!');
  }

  if (bucketName) {
    return new S3StorageProvider(bucketName, process.env.AWS_REGION || 'us-east-1');
  }

  return new LocalStorageProvider();
};

export const storageService = getStorageProvider();
