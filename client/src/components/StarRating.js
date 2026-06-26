// src/components/StarRating.js
import React, { useState } from 'react';
import './StarRating.css';

function StarRating({ rating, setRating }) {
  const [hover, setHover] = useState(null);

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : ''}`}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(null)}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default StarRating;
