import { createClient } from "@supabase/supabase-js";
import ReviewForm from "@/components/ReviewForm";

type Review = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  created_at: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getApprovedReviews(productId: string): Promise<Review[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];
  // Row Level Security only lets visitors read APPROVED reviews
  const { data, error } = await createClient(url, key, {
    auth: { persistSession: false },
  })
    .from("product_reviews")
    .select("id, name, rating, title, body, verified, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("Reviews: could not load:", error.message);
    return [];
  }
  return data as Review[];
}

const Stars = ({ value }: { value: number }) => (
  <span
    role="img"
    aria-label={`${value} out of 5 stars`}
    className="text-gold-deep"
  >
    {"★".repeat(value)}
    <span className="text-stone">{"★".repeat(5 - value)}</span>
  </span>
);

export default async function ProductReviews({
  productId,
}: {
  productId: string;
}) {
  // Sample products have ids like "1", which can't have reviews
  if (!UUID_RE.test(productId)) return null;
  const reviews = await getApprovedReviews(productId);

  return (
    <section
      aria-labelledby="reviews-heading"
      className="mx-auto max-w-7xl px-5 pb-16 pt-4 sm:px-6 sm:pb-24"
    >
      <h2
        id="reviews-heading"
        className="font-serif text-3xl font-light text-ink sm:text-4xl"
      >
        Reviews
      </h2>

      <div className="mt-8 grid gap-12 lg:grid-cols-2">
        <div>
          {reviews.length === 0 ? (
            <p className="text-muted">
              No reviews yet. Be the first to share what you think.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {reviews.map((r) => (
                <li
                  key={r.id}
                  className="py-6 first:pt-0"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <Stars value={r.rating} />
                    {r.verified && (
                      <span className="text-xs text-muted">
                        Verified purchase
                      </span>
                    )}
                  </div>
                  {r.title && (
                    <p className="mt-2 text-[15px] text-ink">{r.title}</p>
                  )}
                  <p className="mt-1 whitespace-pre-line leading-relaxed text-muted">
                    {r.body}
                  </p>
                  <p className="mt-3 text-sm text-muted">
                    {r.name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-ZA", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      timeZone: "Africa/Johannesburg",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-4 text-lg text-ink">Write a review</h3>
          <ReviewForm productId={productId} />
        </div>
      </div>
    </section>
  );
}
