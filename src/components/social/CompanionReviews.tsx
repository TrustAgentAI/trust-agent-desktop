import React from 'react';
import { Star, MessageSquare, Send } from 'lucide-react';
import { api } from '@/lib/api';

interface ReviewData {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  authorName: string;
}

interface ReviewsResponse {
  reviews: ReviewData[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
  totalReviews: number;
  roleName: string;
  companionName: string;
}

interface Props {
  roleSlug: string;
  hireId?: string; // If provided, shows submit form
}

export function CompanionReviews({ roleSlug, hireId }: Props) {
  const [data, setData] = React.useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [showForm, setShowForm] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [reviewText, setReviewText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [submitMsg, setSubmitMsg] = React.useState<string | null>(null);

  async function fetchReviews(p: number = 1) {
    try {
      const result = await api.get<ReviewsResponse>(
        `/trpc/reviews.getReviews?input=${encodeURIComponent(JSON.stringify({ roleSlug, page: p, limit: 10 }))}`
      );
      setData(result);
    } catch {
      // empty state
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    fetchReviews(page);
  }, [roleSlug, page]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hireId || rating < 1 || reviewText.length < 10) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await api.post('/trpc/reviews.submitReview', {
        hireId,
        rating,
        reviewText,
        isPublic: true,
      });
      setSubmitMsg('Review submitted!');
      setShowForm(false);
      setRating(0);
      setReviewText('');
      fetchReviews(1);
    } catch (err) {
      setSubmitMsg((err as Error).message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-white/5 rounded w-1/3" />
        <div className="h-20 bg-white/5 rounded" />
        <div className="h-20 bg-white/5 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with average rating */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Reviews</h3>
          {data && (
            <div className="flex items-center gap-1.5 text-sm text-white/60">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= Math.round(data.averageRating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>
              <span>
                {data.averageRating.toFixed(1)} ({data.totalReviews} review
                {data.totalReviews !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        {hireId && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Write a review
          </button>
        )}
      </div>

      {/* Submit form */}
      {showForm && hireId && (
        <form
          onSubmit={handleSubmit}
          className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 space-y-3"
        >
          <div>
            <label className="text-sm text-white/60 block mb-1">Your rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-white/20'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-white/60 block mb-1">Your review</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="What has your experience been like?"
              className="w-full bg-white/[0.05] border border-white/[0.1] rounded-lg p-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:border-emerald-400/50"
              rows={3}
              minLength={10}
              maxLength={2000}
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting || rating < 1 || reviewText.length < 10}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-white/40 hover:text-white/60"
            >
              Cancel
            </button>
          </div>
          {submitMsg && (
            <p
              className={`text-sm ${
                submitMsg.includes('submitted') ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {submitMsg}
            </p>
          )}
        </form>
      )}

      {/* Reviews list */}
      {data && data.reviews.length > 0 ? (
        <div className="space-y-3">
          {data.reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${
                          s <= review.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white/50">{review.authorName}</span>
                </div>
                <span className="text-xs text-white/30">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{review.reviewText}</p>
            </div>
          ))}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm ${
                    p === page
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/[0.03] text-white/40 hover:text-white/60'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 text-white/30 text-sm">
          No reviews yet. Be the first to share your experience!
        </div>
      )}
    </div>
  );
}
