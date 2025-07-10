import React from 'react';
import './StarRating.css';

function StarRating({ rating, setRating }) {
  const handleClick = (star) => setRating(star);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => setRating(star)}
          onMouseLeave={() => setRating(rating)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default StarRating;
