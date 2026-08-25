import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CompanyReview, getReviews } from "./ReviewsController";

const ITEMS_PER_PAGE = 20;

const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
};

const reviewTypeLabel = (type: CompanyReview["review_type"]) => {
  if (type === "playstore") return "Play Store";
  if (type === "appstore") return "App Store";
  return "In-App";
};

const Stars = ({ rating }: { rating: number | null }) => {
  if (!rating) return <span>-</span>;
  return <span style={{ color: "#f7b500" }}>{"★".repeat(rating)}{"☆".repeat(5 - rating)}</span>;
};

const ReviewsView = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const listInnerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!localStorage.getItem("UUID")) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  const fetchReviews = async (page: number) => {
    setLoading(true);
    try {
      const data = await getReviews(page, ITEMS_PER_PAGE);
      setReviews((prev) => (page === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === ITEMS_PER_PAGE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(0);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const el = listInnerRef.current;
      if (!el) return;
      const isNearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
      if (isNearBottom && hasMore && !loading) {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchReviews(nextPage);
      }
    };

    const el = listInnerRef.current;
    el?.addEventListener("scroll", handleScroll);
    return () => el?.removeEventListener("scroll", handleScroll);
  }, [currentPage, hasMore, loading]);

  return (
    <div style={{ padding: "10px", width: "70vw", height: "100vh" }}>
      <div className="card w-100 h-100">
        <div ref={listInnerRef} style={{ height: "100vh", overflowY: "auto", borderRadius: "10px" }}>
          <table className="table table-bordered mb-0" style={{ borderRadius: "10px" }}>
            <thead className="position-sticky top-0 bg-white" style={{ zIndex: 1 }}>
              <tr>
                <th scope="col">Rating</th>
                <th scope="col">Type</th>
                <th scope="col">Comment</th>
                <th scope="col">Platform</th>
                <th scope="col">Date</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <tr key={review.id}>
                    <td><Stars rating={review.rating} /></td>
                    <td>{reviewTypeLabel(review.review_type)}</td>
                    <td style={{ maxWidth: "400px", whiteSpace: "normal", wordBreak: "break-word" }}>
                      {review.comment || "-"}
                    </td>
                    <td>{review.platform === "android" ? "Android" : review.platform === "ios" ? "iOS" : "Web"}</td>
                    <td>{formatDate(review.rating_given_date || review.modified_date)}</td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan={5} className="text-center">
                    No Reviews Found
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
          {loading && <p className="text-center mt-2">Loading...</p>}
        </div>
      </div>
    </div>
  );
};

export default ReviewsView;
