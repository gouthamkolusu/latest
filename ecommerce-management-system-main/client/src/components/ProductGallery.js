// src/components/ProductGallery.js
import React, { useState, useEffect } from 'react';
import './ProductGallery.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

function ProductGallery({ images = [] }) {
  const [mainImage, setMainImage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (images.length > 0) {
      setMainImage(images[0]);
    }
  }, [images]);

  const handleThumbnailClick = (img, idx) => {
    setMainImage(img);
    setPhotoIndex(idx);
  };

  if (!images.length) return <p>No images available</p>;

  return (
    <div className="product-gallery">
      <div className="thumbnails">
        {images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`thumb-${idx}`}
            onClick={() => handleThumbnailClick(img, idx)}
            className={mainImage === img ? 'active' : ''}
            loading="lazy"
          />
        ))}
      </div>

      <div className="zoom-image">
        <img
          src={mainImage}
          alt="Main product"
          onClick={() => setIsOpen(true)}
          className="main-image"
          loading="lazy"
        />
      </div>

      {isOpen && (
        <Lightbox
          open={isOpen}
          close={() => setIsOpen(false)}
          slides={images.map((img) => ({ src: img }))}
          index={photoIndex}
          on={{ view: ({ index }) => setPhotoIndex(index) }}
        />
      )}
    </div>
  );
}

export default ProductGallery;
