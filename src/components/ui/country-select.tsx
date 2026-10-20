"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { countries } from "@/content/site";
import { usePathname, useRouter } from "@/i18n/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { track } from "@/lib/analytics";

/**
 * Country picker. Switching country switches the active locale, keeping the
 * visitor on the same page. Countries without a dedicated locale keep the
 * current one so the price and copy stay coherent.
 */
export function CountrySelect({ className, compact = false }: { className?: string; compact?: boolean }) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const active = countries.find((c) => c.locale === locale) ?? countries[0];

  function onChange(next: string) {
    const target = countries.find((c) => c.code === next);
    if (!target) return;

    track({ name: "country_change", props: { country: target.code } });

    if (target.locale === locale) return;

    startTransition(() => {
      router.replace(pathname, { locale: target.locale });
    });
  }

  return (
    <Select value={active.code} onValueChange={onChange} disabled={isPending}>
      <SelectTrigger
        aria-label={t("countryAria")}
        className={
          compact
            ? "h-9 w-auto gap-2 border-transparent bg-transparent px-2 text-ink-2 hover:border-line hover:bg-surface-2 hover:text-ink [&>svg]:hidden"
            : "h-9 w-auto gap-2 border-transparent bg-transparent px-2.5 text-ink-2 hover:border-line hover:bg-surface-2 hover:text-ink [&>svg]:hidden"
        }
      >
        <Globe className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        <SelectValue>{compact ? active.code : `${active.code} · ${active.name}`}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {countries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            <span className="w-6 shrink-0 text-xs font-medium tracking-[0.06em] text-ink-3">
              {country.code}
            </span>
            {country.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
