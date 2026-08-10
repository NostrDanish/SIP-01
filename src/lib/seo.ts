import { useSeoMeta as useUnheadSeoMeta } from '@unhead/react';

/** Set page title + description (OG/Twitter tags inferred by InferSeoMetaPlugin). */
export function useSeoMeta({ title, description }: { title: string; description: string }) {
  useUnheadSeoMeta({ title, description });
}
