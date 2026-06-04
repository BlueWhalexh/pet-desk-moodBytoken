"use client";

import { useState } from "react";

import {
  Check,
  Copy,
  Download,
  Film,
  Info,
  Package,
  Play,
  Sticker,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { WeChatIcon, WhatsAppIcon } from "@/components/icons/wechat-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  slug: string;
  displayName: string;
};

type Status = "idle" | "working" | "done" | "error";

export function SaveAsSticker({ slug, displayName }: Props) {
  const locale = useLocale();
  const t = useTranslations("sticker");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const isZh = locale === "zh";
  const stickerWebp = `/api/pets/${slug}/sticker`;
  const stickerGif = `/api/pets/${slug}/sticker?format=gif`;
  const stickerPng = `/api/pets/${slug}/sticker?format=png`;
  const wastickersUrl = `/api/pets/${slug}/wastickers`;

  function flashDone() {
    setStatus("done");
    setTimeout(() => setStatus("idle"), 2000);
    setOpen(false);
  }

  function flashError() {
    setStatus("error");
    setTimeout(() => setStatus("idle"), 2500);
  }

  function downloadFile(url: string, filename: string) {
    setStatus("working");
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      flashDone();
    } catch {
      flashError();
    }
  }

  function downloadAnimated() {
    downloadFile(`${stickerWebp}?download=1`, `${slug}-sticker.webp`);
  }

  function downloadGif() {
    downloadFile(`${stickerGif}&download=1`, `${slug}-sticker.gif`);
  }

  function downloadStaticPng() {
    downloadFile(`${stickerPng}&download=1`, `${slug}-sticker.png`);
  }

  function downloadPack() {
    downloadFile(wastickersUrl, `${slug}-petdex-stickers.zip`);
  }

  async function copyToClipboard() {
    setStatus("working");
    try {
      const res = await fetch(stickerPng);
      const blob = await res.blob();
      const item = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([item]);
      flashDone();
    } catch {
      try {
        await navigator.clipboard.writeText(
          `${window.location.origin}${stickerWebp}`,
        );
        flashDone();
      } catch {
        flashError();
      }
    }
  }

  function previewSticker() {
    window.open(stickerWebp, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  const ctaClasses = isZh
    ? "bg-[#07C160] hover:bg-[#06ae56] dark:bg-[#0a7d4d] dark:hover:bg-[#0c8c57]"
    : "bg-[#25D366] hover:bg-[#1EBE5D] dark:bg-[#168649] dark:hover:bg-[#1c9a55]";

  return (
    <div className="relative inline-block">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              aria-label={displayName}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium text-white shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 ${ctaClasses}`}
            />
          }
        >
          {isZh ? (
            <WeChatIcon className="w-4 h-4 text-white" />
          ) : (
            <WhatsAppIcon className="w-4 h-4 text-white" />
          )}
          {t("ctaShort")}
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={6}
          className="w-80 rounded-lg border border-border bg-popover p-0 shadow-xl"
        >
          <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
            {isZh ? t("hintWeChat") : t("hintGeneric")}
          </div>

          <DropdownMenuItem
            closeOnClick={false}
            onClick={downloadAnimated}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            {status === "working" ? (
              <Play className="w-4 h-4 animate-pulse text-amber-400" />
            ) : status === "done" ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Play className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                {t("downloadAnimated")}
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold leading-none text-amber-300">
                  {t("recommendedTag")}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {t("downloadAnimatedDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="opacity-40" />

          <DropdownMenuItem
            closeOnClick={false}
            onClick={downloadGif}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            {status === "working" ? (
              <Film className="w-4 h-4 animate-pulse text-purple-400" />
            ) : (
              <Film className="w-4 h-4 text-purple-400" />
            )}
            <div className="flex-1">
              <div className="font-medium">{t("downloadGif")}</div>
              <div className="text-xs text-muted-foreground">
                {t("downloadGifDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="opacity-40" />

          <DropdownMenuItem
            closeOnClick={false}
            onClick={downloadPack}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            {status === "working" ? (
              <Package className="w-4 h-4 animate-pulse text-[#25D366]" />
            ) : status === "done" ? (
              <Check className="w-4 h-4 text-[#25D366]" />
            ) : (
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
            )}
            <div className="flex-1">
              <div className="font-medium">{t("downloadPack")}</div>
              <div className="text-xs text-muted-foreground">
                {t("downloadPackDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator className="opacity-40" />

          <DropdownMenuItem
            closeOnClick={false}
            onClick={downloadStaticPng}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{t("downloadPng")}</div>
              <div className="text-xs text-muted-foreground">
                {t("downloadPngDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => void copyToClipboard()}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            <Copy className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{t("copyImage")}</div>
              <div className="text-xs text-muted-foreground">
                {t("copyImageDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={previewSticker}
            className="flex items-center gap-3 px-3 py-2 text-sm text-left"
          >
            <Sticker className="w-4 h-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{t("preview")}</div>
              <div className="text-xs text-muted-foreground">
                {t("previewDesc")}
              </div>
            </div>
          </DropdownMenuItem>

          <div className="mt-1 space-y-1.5 border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
            {isZh && (
              <div className="flex items-start gap-2">
                <WeChatIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#07C160]" />
                <span>{t("howToWeChat")}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <WhatsAppIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#25D366]" />
              <span>{t("howToWhatsApp")}</span>
            </div>
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
              <span>{t("desktopNote")}</span>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {status === "error" && (
        <div className="absolute right-0 top-full z-30 mt-2 rounded-md bg-red-500 px-3 py-2 text-xs text-white shadow-lg">
          {t("errorGeneric")}
        </div>
      )}

      <span className="sr-only">{displayName}</span>
    </div>
  );
}
