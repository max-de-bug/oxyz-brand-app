"use client";

import React, { ReactNode } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CarouselProps {
  items: ReactNode[];
  itemsPerView?: number;
  spacing?: number;
  className?: string;
  showNavigation?: boolean;
  showPagination?: boolean;
}

export const Carousel = ({
  items,
  itemsPerView = 2,
  spacing = 16,
  className = "",
  showNavigation = true,
  showPagination = true,
}: CarouselProps) => {
  const navigationPrevRef = React.useRef<HTMLDivElement>(null);
  const navigationNextRef = React.useRef<HTMLDivElement>(null);

  if (!items.length) {
    return (
      <div className="text-center py-6 text-gray-500">No items to display</div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <Swiper
        modules={[Navigation, Pagination]}
        spaceBetween={spacing}
        slidesPerView={itemsPerView}
        navigation={{
          prevEl: navigationPrevRef.current,
          nextEl: navigationNextRef.current,
        }}
        pagination={showPagination ? { clickable: true } : false}
        breakpoints={{
          // when window width is >= 320px
          320: {
            slidesPerView: 1,
            spaceBetween: 10,
          },
          // when window width is >= 480px
          480: {
            slidesPerView: 1,
            spaceBetween: 16,
          },
          // when window width is >= 640px
          640: {
            slidesPerView: itemsPerView,
            spaceBetween: spacing,
          },
        }}
        onBeforeInit={(swiper) => {
          if (
            typeof swiper.params.navigation !== "boolean" &&
            swiper.params.navigation
          ) {
            swiper.params.navigation.prevEl = navigationPrevRef.current;
            swiper.params.navigation.nextEl = navigationNextRef.current;
          }
        }}
        className="w-full"
      >
        {items.map((item, index) => (
          <SwiperSlide key={index}>{item}</SwiperSlide>
        ))}
      </Swiper>

      {showNavigation && items.length > itemsPerView && (
        <>
          <div
            ref={navigationPrevRef}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 rounded-full p-1 shadow-md cursor-pointer"
            style={{ left: "-12px" }}
          >
            <ChevronLeft size={20} className="text-white" />
          </div>
          <div
            ref={navigationNextRef}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-800 hover:bg-gray-700 rounded-full p-1 shadow-md cursor-pointer"
            style={{ right: "-12px" }}
          >
            <ChevronRight size={20} className="text-white" />
          </div>
        </>
      )}
    </div>
  );
};
