import { useEffect, useState } from 'react';
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';

import { useTranslation } from 'react-i18next';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const images = [
  { src: '/images/slideshow/esterno.webp', alt: 'slideshow.outside' },
  { src: '/images/slideshow/sopra.webp', alt: 'slideshow.topView' },
  { src: '/images/slideshow/giochi.webp', alt: 'slideshow.briscola' },
  { src: '/images/slideshow/giochi_2.webp', alt: 'slideshow.peaceSign' },
  { src: '/images/slideshow/giochi_3.webp', alt: 'slideshow.boardGames' },
  { src: '/images/slideshow/biliardino.webp', alt: 'slideshow.foosball' },
  { src: '/images/slideshow/ping_pong.webp', alt: 'slideshow.pingPong' },
  { src: '/images/slideshow/playstation.webp', alt: 'slideshow.playstation' },
];

interface ImageCarouselProps {
  className?: string;
}

const ImageCarousel = ({ className = '' }: ImageCarouselProps) => {
  const [isClient, setIsClient] = useState(false);

  const { t } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <Swiper
        modules={[Navigation, Pagination, Autoplay, EffectFade]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        effect="fade"
        className="md:rounded-xl overflow-hidden shadow-xl"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="relative pb-[56.25%] h-0">
              <img
                src={image.src}
                alt={image.alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading={index > 0 ? 'lazy' : 'eager'}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 slide-caption">
                <h3 className="text-white text-lg font-medium drop-shadow-lg">
                  {t(image.alt)}
                </h3>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageCarousel;
