import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";
import type { OccurrenceSearchItem } from "@/features/occurrences/api";

interface TourCardProps {
  item: OccurrenceSearchItem;
  className?: string;
}

export function TourCard({ item, className = "" }: TourCardProps) {
  const { tour, occurrence, ratingSummary } = item;

  return (
    <div
      className={[
        "rounded-xl overflow-hidden bg-white shadow-sm border border-border flex-shrink-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative h-40 w-full bg-primary">
        {tour.coverImageUrl ? (
          <Image
            src={tour.coverImageUrl}
            alt={tour.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 256px, 320px"
          />
        ) : (
          <div
            data-testid="tour-card-placeholder"
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary to-primary-dark"
          >
            <span className="font-display text-sm font-bold tracking-widest text-white/60 uppercase">
              Tourwave
            </span>
          </div>
        )}
        {ratingSummary && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-semibold text-white">
              {ratingSummary.avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-display text-base font-bold leading-tight text-foreground line-clamp-2">
          {tour.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-muted">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="text-xs truncate">{tour.locationText}</span>
        </div>
        <p className="mt-2 text-sm font-semibold text-primary-dark">
          {formatMoney(occurrence.price.amount, occurrence.price.currency)}
        </p>
      </div>
    </div>
  );
}
