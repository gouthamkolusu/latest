import React, { useState, useEffect } from 'react';
import './ProductGallery.css';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

function ProductGallery({ images = [] }) {
  const [mainImage, setMainImage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (images.length > 0) {
      setMainImage(images[0]);
      setIsLoaded(false);
    }
  }, [images]);

  const handleThumbnailClick = (img, idx) => {
    setMainImage(img);
    setPhotoIndex(idx);
    setIsLoaded(false);
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
          />
        ))}
      </div>

      <div className="zoom-image">
        <img
          src={mainImage}
          alt="Main product"
          onClick={() => isLoaded && setIsOpen(true)}
          onLoad={() => setIsLoaded(true)}
          className="main-image"
        />
        {!isLoaded && <div className="loader-box">Loading image...</div>}
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