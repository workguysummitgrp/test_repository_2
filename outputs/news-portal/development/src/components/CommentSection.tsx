'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

interface Comment {
  id: string;
  body: string;
  author: { id: string; displayName: string; avatarUrl: string | null };
  upvotes: number;
  downvotes: number;
  createdAt: string;
  replies?: Comment[];
}

interface CommentSectionProps {
  articleId: string;
  articleSlug: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function CommentSection({ articleId, articleSlug }: CommentSectionProps) {
  const { data: session } = useSession();
  const { data, mutate, isLoading } = useSWR(
    `/api/v1/comments?articleId=${articleId}&limit=20`,
    fetcher
  );
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const comments: Comment[] = data?.data ?? [];

  const handleSubmit = useCallback(
    async (body: string, parentId?: string) => {
      setSubmitting(true);
      await fetch(`/api/v1/comments?articleId=${articleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, parentId }),
      });
      setSubmitting(false);
      setNewComment('');
      setReplyTo(null);
      setReplyText('');
      mutate();
    },
    [articleId, mutate]
  );

  return (
    <section className="border-t border-neutral-300 pt-8" aria-label="Comments">
      <h2 className="text-h3 mb-6">Comments</h2>

      {/* Comment Form */}
      {session ? (
        <div className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            className="input-field min-h-[80px] resize-y"
            maxLength={5000}
          />
          <button
            onClick={() => handleSubmit(newComment)}
            disabled={submitting || !newComment.trim()}
            className="btn-primary mt-2"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      ) : (
        <div className="mb-8 rounded-md bg-neutral-100 p-4 text-center">
          <Link href={`/auth/login?callbackUrl=/articles/${articleSlug}`} className="text-primary hover:underline">
            Sign in to comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse h-20 bg-neutral-100 rounded-md" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-neutral-500">No comments yet. Be the first to share your thoughts!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <CommentItem
                comment={comment}
                onReply={() => setReplyTo(comment.id)}
              />

              {/* Replies */}
              {comment.replies?.map((reply) => (
                <div key={reply.id} className="ml-8 border-l-2 border-neutral-300 pl-4">
                  <CommentItem comment={reply} />
                </div>
              ))}

              {/* Reply Form */}
              {replyTo === comment.id && session && (
                <div className="ml-8">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="input-field min-h-[60px] resize-y"
                    maxLength={5000}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => handleSubmit(replyText, comment.id)}
                      disabled={submitting || !replyText.trim()}
                      className="btn-primary text-body-sm"
                    >
                      Reply
                    </button>
                    <button onClick={() => setReplyTo(null)} className="btn-secondary text-body-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CommentItem({ comment, onReply }: { comment: Comment; onReply?: () => void }) {
  return (
    <div className="flex gap-3">
      {comment.author.avatarUrl ? (
        <Image
          src={comment.author.avatarUrl}
          alt={comment.author.displayName}
          width={32}
          height={32}
          className="h-8 w-8 rounded-full flex-shrink-0"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
          <span className="text-caption font-bold text-primary">
            {comment.author.displayName[0].toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-medium">{comment.author.displayName}</span>
          <time className="text-caption text-neutral-500">
            {new Date(comment.createdAt).toLocaleDateString()}
          </time>
        </div>
        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">{comment.body}</p>
        <div className="mt-2 flex items-center gap-4 text-caption text-neutral-500">
          <span>{comment.upvotes - comment.downvotes} votes</span>
          {onReply && (
            <button onClick={onReply} className="hover:text-primary">
              Reply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
