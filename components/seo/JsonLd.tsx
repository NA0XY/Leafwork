import type { JsonLdSchema } from "@/lib/utils/seo";
import { serializeJsonLd } from "@/lib/utils/seo";

type JsonLdProps = {
  id: string;
  schema: JsonLdSchema | JsonLdSchema[];
};

export const JsonLd = ({ id, schema }: JsonLdProps) => (
  <script
    id={id}
    type="application/ld+json"
    suppressHydrationWarning
    dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
  />
);
