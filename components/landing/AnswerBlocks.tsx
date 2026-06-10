import { HOMEPAGE_FAQS } from "@/lib/utils/seo";

export const AnswerBlocks = () => (
  <section className="space-y-4">
    <div className="space-y-2">
      <h2 className="text-3xl font-bold">Direct Answers</h2>
      <p className="max-w-3xl text-sm text-muted">
        Clear facts about Leafwork for users, search engines, and AI answer systems.
      </p>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {HOMEPAGE_FAQS.map((item) => (
        <article key={item.q} className="rounded-brutal border-2 border-ink bg-surface p-4 shadow-brutal">
          <h3 className="text-lg font-bold">{item.q}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.a}</p>
        </article>
      ))}
    </div>
  </section>
);
