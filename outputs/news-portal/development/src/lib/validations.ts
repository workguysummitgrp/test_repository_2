import { z } from 'zod';

// --- Article Schemas ---

export const createArticleSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional(),
  body: z.string().min(1),
  categoryId: z.string().uuid(),
  tags: z.array(z.string().max(60)).max(10).optional(),
  featuredImageId: z.string().uuid().optional(),
  excerpt: z.string().max(250).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
  commentsEnabled: z.boolean().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleQuerySchema = z.object({
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().uuid().optional(),
  status: z.enum(['draft', 'in_review', 'approved', 'published', 'archived']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  sort: z.enum(['published_at', 'view_count', 'created_at']).default('published_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// --- Auth Schemas ---

export const registerSchema = z.object({
  email: z.string().email().max(255),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// --- Comment Schemas ---

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
  parentId: z.string().uuid().optional(),
});

export const commentQuerySchema = z.object({
  articleId: z.string().uuid(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
});

// --- Category Schemas ---

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  displayOrder: z.number().int().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// --- Search Schema ---

export const searchSchema = z.object({
  q: z.string().min(2).max(200),
  category: z.string().optional(),
  author: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  sort: z.enum(['relevance', 'newest', 'oldest', 'views']).default('relevance'),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

// --- User Profile Schema ---

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().max(500).optional(),
});

// --- Bookmark Schema ---

export const bookmarkSchema = z.object({
  articleId: z.string().uuid(),
});

// --- Media Upload Schema ---

export const mediaUploadSchema = z.object({
  altText: z.string().max(255).optional(),
});

// --- Admin Schemas ---

export const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'reviewer', 'editor', 'moderator', 'reader']),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  role: z.enum(['admin', 'reviewer', 'editor', 'moderator', 'reader']).optional(),
  status: z.enum(['active', 'pending_verification', 'suspended', 'deleted']).optional(),
  search: z.string().optional(),
});

export const analyticsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  period: z.enum(['day', 'week', 'month']).default('week'),
});
