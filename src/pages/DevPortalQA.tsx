import HCRLogo from "@/components/brand/HCRLogo";
import NavyHeader from "@/components/portal/NavyHeader";
import PageImageSlot from "@/components/report/PageImageSlot";

/**
 * Developer-only QA page — renders the new HCR shell pieces in isolation at
 * mobile + desktop widths so we can eyeball the rollout without clicking
 * through the portal. Mounted at /dev/portal-qa.
 */
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-16">
    <p className="font-sans text-[10px] uppercase tracking-[0.18em] font-semibold text-muted-foreground mb-3">
      {title}
    </p>
    <div className="border border-border rounded bg-card overflow-hidden">{children}</div>
  </section>
);

const DevPortalQA = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1040px] mx-auto px-6 md:px-10 py-12">
        <div className="mb-12">
          <p className="font-sans text-[10px] uppercase tracking-[0.25em] font-semibold text-muted-foreground mb-2">
            Developer Preview
          </p>
          <h1 className="font-display text-4xl text-foreground">HCR Portal QA</h1>
          <p className="font-sans text-sm text-muted-foreground mt-2">
            Renders the shared HCR shell pieces in isolation.
          </p>
        </div>

        <Section title="HCR Logo: sizes">
          <div className="flex items-start gap-10 p-8 bg-card">
            <HCRLogo size="sm" />
            <HCRLogo size="md" />
            <HCRLogo size="lg" />
          </div>
          <div className="p-8 bg-primary">
            <HCRLogo size="md" variant="light" />
          </div>
        </Section>

        <Section title="Navy section header">
          <NavyHeader
            backLabel="Exterior"
            eyebrow="Exterior · Roofing Assembly"
            title="Roofing Assembly"
          />
        </Section>

        <Section title="Page image slot: empty placeholder">
          <div className="p-8 bg-card">
            <PageImageSlot caption="Property photos" />
          </div>
        </Section>

        <Section title="Page image slot: with gallery">
          <div className="p-8 bg-card">
            <PageImageSlot
              images={[
                "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1280",
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1280",
              ]}
              caption="Property photos"
            />
          </div>
        </Section>
      </div>
    </div>
  );
};

export default DevPortalQA;
