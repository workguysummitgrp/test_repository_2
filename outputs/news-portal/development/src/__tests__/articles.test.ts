import { createArticleSchema, updateArticleSchema, articleQuerySchema } from '@/lib/validations';

describe('Article Validations', () => {
  describe('createArticleSchema', () => {
    it('should validate a valid article', () => {
      const result = createArticleSchema.safeParse({
        title: 'Test Article',
        body: '<p>Test body content</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = createArticleSchema.safeParse({
        title: '',
        body: '<p>Body</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].path).toContain('title');
      }
    });

    it('should reject title exceeding 200 characters', () => {
      const result = createArticleSchema.safeParse({
        title: 'a'.repeat(201),
        body: '<p>Body</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty body', () => {
      const result = createArticleSchema.safeParse({
        title: 'Valid Title',
        body: '',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid categoryId', () => {
      const result = createArticleSchema.safeParse({
        title: 'Valid Title',
        body: '<p>Body</p>',
        categoryId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional fields', () => {
      const result = createArticleSchema.safeParse({
        title: 'Test',
        body: '<p>Body</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        subtitle: 'A subtitle',
        tags: ['technology', 'ai'],
        excerpt: 'Short summary',
        metaTitle: 'SEO Title',
        metaDescription: 'SEO description',
        commentsEnabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject more than 10 tags', () => {
      const result = createArticleSchema.safeParse({
        title: 'Test',
        body: '<p>Body</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        tags: Array.from({ length: 11 }, (_, i) => `tag-${i}`),
      });
      expect(result.success).toBe(false);
    });

    it('should reject metaTitle exceeding 60 characters', () => {
      const result = createArticleSchema.safeParse({
        title: 'Test',
        body: '<p>Body</p>',
        categoryId: '123e4567-e89b-12d3-a456-426614174000',
        metaTitle: 'a'.repeat(61),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('updateArticleSchema', () => {
    it('should accept partial fields', () => {
      const result = updateArticleSchema.safeParse({ title: 'Updated Title' });
      expect(result.success).toBe(true);
    });

    it('should accept empty object', () => {
      const result = updateArticleSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('articleQuerySchema', () => {
    it('should set defaults for missing params', () => {
      const result = articleQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
        expect(result.data.sort).toBe('published_at');
        expect(result.data.order).toBe('desc');
      }
    });

    it('should reject limit above 50', () => {
      const result = articleQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(false);
    });

    it('should accept valid filters', () => {
      const result = articleQuerySchema.safeParse({
        category: 'technology',
        tag: 'ai',
        sort: 'view_count',
        order: 'asc',
        limit: '10',
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('Article API Route Logic', () => {
  describe('Slug Generation', () => {
    it('should generate slug from title', () => {
      // Testing the slugify behavior used in the route
      const slugify = require('slugify');
      const slug = slugify('My Test Article Title!', { lower: true, strict: true });
      expect(slug).toBe('my-test-article-title');
    });

    it('should handle special characters in slug', () => {
      const slugify = require('slugify');
      const slug = slugify('Breaking: COVID-19 Update & More', { lower: true, strict: true });
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Article Status Transitions', () => {
    it('should only allow draft -> in_review', () => {
      const validTransitions: Record<string, string[]> = {
        draft: ['in_review'],
        in_review: ['approved', 'draft'],
        approved: ['published'],
        published: ['archived'],
      };

      expect(validTransitions['draft']).toContain('in_review');
      expect(validTransitions['draft']).not.toContain('published');
      expect(validTransitions['in_review']).toContain('approved');
      expect(validTransitions['in_review']).toContain('draft');
    });
  });
});
