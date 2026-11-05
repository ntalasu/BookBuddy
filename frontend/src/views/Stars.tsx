// Shows a 1-5 star rating, e.g. ★★★★☆
function Stars({ rating, size = "text-base" }: { rating: number; size?: string }) {
  return (
    <span className={size} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rating ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  )
}

export default Stars
