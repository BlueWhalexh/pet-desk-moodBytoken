import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";

type SponsorButtonProps = {
  variant?: "nav" | "pill" | "inline";
};

const SPONSOR_URL = "https://github.com/sponsors/Railly";

export function SponsorButton({ variant = "pill" }: SponsorButtonProps) {
  const t = useTranslations("footer");
  const className =
    variant === "nav"
      ? "inline-flex items-center gap-1.5 transition hover:text-rose-600"
      : variant === "inline"
        ? "inline-flex items-center gap-1.5 underline underline-offset-4 transition hover:text-rose-600"
        : "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-rose-300/60 bg-rose-50/70 px-4 text-sm font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-100";

  return (
    <a
      href={SPONSOR_URL}
      target="_blank"
      rel="noreferrer"
      className={className}
      aria-label={t("sponsorAria")}
    >
      <Heart className="size-4" />
      {t("sponsor")}
    </a>
  );
}
