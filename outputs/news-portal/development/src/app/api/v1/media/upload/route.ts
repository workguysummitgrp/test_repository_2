import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mediaUploadSchema } from '@/lib/validations';
import { successResponse, errorResponse, internalError } from '@/lib/api-response';
import { requireAuthRole, isErrorResponse } from '@/lib/session';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB

// POST /api/v1/media/upload — upload media (editor+)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthRole('editor');
    if (isErrorResponse(auth)) return auth;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const altText = formData.get('altText') as string | null;

    if (!file) {
      return errorResponse(400, 'VALIDATION_ERROR', 'File is required');
    }

    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return errorResponse(415, 'UNSUPPORTED_MEDIA_TYPE', `Allowed types: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}`);
    }

    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
    if (file.size > maxSize) {
      return errorResponse(413, 'PAYLOAD_TOO_LARGE', `File exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() ?? 'bin';
    const hash = crypto.randomBytes(16).toString('hex');
    const filename = `${hash}.${ext}`;

    // In production: upload to S3
    // const s3Url = await uploadToS3(file, filename);
    const s3Url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/uploads/${filename}`;
    const thumbnailUrl = isImage ? s3Url.replace('/uploads/', '/thumbnails/') : null;

    const media = await prisma.mediaAsset.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: BigInt(file.size),
        url: s3Url,
        thumbnailUrl,
        altText,
        uploadedBy: auth.id,
      },
    });

    return successResponse({
      id: media.id,
      filename: media.filename,
      originalName: media.originalName,
      mimeType: media.mimeType,
      sizeBytes: Number(media.sizeBytes),
      url: media.url,
      thumbnailUrl: media.thumbnailUrl,
      altText: media.altText,
      createdAt: media.createdAt,
    });
  } catch (error) {
    console.error('[POST /api/v1/media/upload]', error);
    return internalError();
  }
}
