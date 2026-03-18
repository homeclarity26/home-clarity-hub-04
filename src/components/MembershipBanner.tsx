import { differenceInDays, format } from "date-fns";

interface MembershipBannerProps {
  membershipEndDate?: string | null;
  onSendMessage: () => void;
}

const MembershipBanner = ({ membershipEndDate, onSendMessage }: MembershipBannerProps) => {
  if (!membershipEndDate) return null;

  const endDate = new Date(membershipEndDate);
  const daysRemaining = differenceInDays(endDate, new Date());

  // Only show within 90 days of expiry
  if (daysRemaining > 90 || daysRemaining < 0) return null;

  return (
    <div className="bg-accent/15 border border-accent/30 rounded-lg px-6 py-4 flex items-center justify-between flex-wrap gap-3">
      <div>
        <p className="font-sans text-sm text-foreground">
          Your Home Clarity Hub membership renews on{" "}
          <span className="font-medium">{format(endDate, "MMMM d, yyyy")}</span>.
          {daysRemaining <= 30
            ? " Your advisor will be reaching out soon."
            : " Your advisor will be in touch soon."}
        </p>
      </div>
      <button
        onClick={onSendMessage}
        className="px-4 py-2 rounded-md bg-accent text-accent-foreground font-mono text-[10px] uppercase tracking-[0.15em] hover:opacity-90 transition-opacity border-none cursor-pointer whitespace-nowrap"
      >
        Questions? Send a Message
      </button>
    </div>
  );
};

export default MembershipBanner;
