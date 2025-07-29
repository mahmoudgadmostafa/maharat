import React, { useState, useRef, useEffect } from 'react';

const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y0ZjRmNCIvPgogIDx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5sb2FkaW5nLi4uPC90ZXh0Pgo8L3N2Zz4K',
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = (e) => {
    setIsLoaded(true);
    onLoad && onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    onError && onError(e);
  };

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} {...props}>
      {!isInView ? (
        <img
          src={placeholder}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />
      ) : (
        <>
          {!isLoaded && !hasError && (
            <img
              src={placeholder}
              alt={alt}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                isLoaded ? 'opacity-0' : 'opacity-100'
              }`}
            />
          )}
          
          <img
            src={hasError ? placeholder : src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isLoaded && !hasError ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        </>
      )}
    </div>
  );
};

export default LazyImage;

