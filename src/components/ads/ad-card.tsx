import Image from "next/image";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";

import type { PublicFeedAd } from "@/lib/ads/queries";

export function AdCard({
  ad,
  onClick,
  onHover,
  disableNavigation = false,
  showImagePlaceholder = false,
}: {
  ad: PublicFeedAd;
  onClick?: () => void;
  onHover?: () => void;
  disableNavigation?: boolean;
  showImagePlaceholder?: boolean;
}) {
  const t = useTranslations("advertise.card");
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (disableNavigation) {
      event.preventDefault();
      return;
    }
    onClick?.();
  };

  return (
    <article
      onPointerEnter={onHover}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border-base bg-surface/76 shadow-sm shadow-blue-950/5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-surface hover:shadow-xl hover:shadow-blue-950/10"
    >
      <a
        href={ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-disabled={disableNavigation}
        onClick={handleClick}
        className="flex flex-1 flex-col rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
      >
        <div className="flex min-h-[46px] items-center justify-between rounded-t-3xl border-border-base border-b px-5 py-3">
          <span className="font-mono text-[11px] tracking-[0.22em] text-muted-3 uppercase">
            {t("sponsored")}
          </span>
          <ExternalLink className="size-4 text-muted-4 transition group-hover:text-brand" />
        </div>
        <div className="relative h-[210px] max-h-[210px] overflow-hidden bg-background md:h-[190px] md:max-h-[190px] 2xl:h-[210px] 2xl:max-h-[210px]">
          {showImagePlaceholder ? (
            <div className="h-full w-full bg-muted-4/20" />
          ) : (
            <Image
              src={ad.imageUrl}
              alt=""
              fill
              sizes="(min-width: 1536px) 260px, (min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition duration-300 group-hover:scale-[1.02]"
            />
          )}
          <span className="pointer-events-none absolute right-5 bottom-2 font-mono text-[10px] tracking-[0.22em] text-muted-4 uppercase">
            Sponsor
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 border-border-base border-t px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground">
              {ad.title}
            </h3>
            <span className="shrink-0 font-mono text-[10px] tracking-[0.18em] text-muted-4 uppercase">
              Ad
            </span>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-muted-2">
            {ad.description}
          </p>
          <span className="inline-flex w-fit items-center rounded-full border border-border-base bg-background px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] text-muted-2 uppercase">
            Promoted
          </span>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="font-mono text-[10px] tracking-[0.12em] text-muted-3 uppercase">
              #sponsored
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-muted-3 uppercase">
              #partner
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 border-border-base border-t pt-2 font-mono text-[10px] tracking-[0.12em] text-muted-3 uppercase">
            {t("cta")}
          </div>
        </div>
      </a>
      <div className="mt-auto flex min-h-[52px] items-center border-border-base border-t px-5 py-2" />
    </article>
  );
}
