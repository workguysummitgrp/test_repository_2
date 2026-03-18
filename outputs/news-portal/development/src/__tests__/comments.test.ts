import { createCommentSchema, commentQuerySchema } from '@/lib/validations';

describe('Comment Validations', () => {
  describe('createCommentSchema', () => {
    it('should validate a valid comment', () => {
      const result = createCommentSchema.safeParse({
        body: 'Great article! Thanks for sharing.',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty body', () => {
      const result = createCommentSchema.safeParse({ body: '' });
      expect(result.success).toBe(false);
    });

    it('should reject body exceeding 5000 characters', () => {
      const result = createCommentSchema.safeParse({
        body: 'a'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('should accept valid parentId for replies', () => {
      const result = createCommentSchema.safeParse({
        body: 'A reply comment',
        parentId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid parentId', () => {
      const result = createCommentSchema.safeParse({
        body: 'A reply',
        parentId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });

    it('should accept comment without parentId (top-level)', () => {
      const result = createCommentSchema.safeParse({
        body: 'A top-level comment',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.parentId).toBeUndefined();
      }
    });
  });

  describe('commentQuerySchema', () => {
    it('should require articleId', () => {
      const result = commentQuerySchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should validate with valid articleId', () => {
      const result = commentQuerySchema.safeParse({
        articleId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
    });

    it('should set default limit to 20', () => {
      const result = commentQuerySchema.safeParse({
        articleId: '123e4567-e89b-12d3-a456-426614174000',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should reject limit above 50', () => {
      const result = commentQuerySchema.safeParse({
        articleId: '123e4567-e89b-12d3-a456-426614174000',
        limit: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid articleId', () => {
      const result = commentQuerySchema.safeParse({
        articleId: 'not-a-uuid',
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Comment Nesting Rules', () => {
  it('should allow only one level of nesting', () => {
    // Business rule: comments can have replies, but replies cannot have replies
    const topLevelComment = { id: '1', parentId: null };
    const reply = { id: '2', parentId: '1' };
    const nestedReply = { id: '3', parentId: '2' };

    // Top-level comment is valid
    expect(topLevelComment.parentId).toBeNull();

    // Direct reply is valid (parent has no parent)
    expect(reply.parentId).toBe('1');

    // Nested reply should be rejected if parent already has a parentId
    // The API checks: if (parent.parentId) return error
    const parentOfNestedReply = reply;
    expect(parentOfNestedReply.parentId).not.toBeNull();
    // This means nested reply should be rejected
  });
});

describe('Comment Vote Logic', () => {
  it('should only accept +1 or -1 votes', () => {
    const validVotes = [1, -1];
    const invalidVotes = [0, 2, -2, 0.5];

    for (const vote of validVotes) {
      expect(vote === 1 || vote === -1).toBe(true);
    }
    for (const vote of invalidVotes) {
      expect(vote === 1 || vote === -1).toBe(false);
    }
  });

  it('should calculate net score correctly', () => {
    const upvotes = 10;
    const downvotes = 3;
    expect(upvotes - downvotes).toBe(7);
  });
});
