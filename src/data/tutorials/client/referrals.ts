import { Tutorial } from "../types";

export const clientReferrals: Tutorial[] = [
  {
    id: "client-referral-program",
    category: "Referrals",
    title: "How the Referral Program Works",
    description: "Earn credit by referring friends and family to Home Clarity Hub.",
    audience: "client",
    steps: [
      { title: "Go to Referrals", body: "Navigate to the Referrals section (you may find it under the 'More' menu in your tabs)." },
      { title: "Understand the program", body: "When someone you refer signs up for Home Clarity Hub, you receive a credit toward your membership." },
      { title: "View your referrals", body: "The Referrals page shows all your referrals with their status: Pending (they haven't signed up yet), Converted (they joined), or Expired." },
      { title: "Track your credits", body: "See how much credit you've earned and how it applies to your next billing cycle." },
    ],
    tip: "The best referrals come from sharing your own experience. Tell friends about a specific way HBC has helped your home — that personal touch is more convincing than any sales pitch.",
    keywords: ["referral", "program", "credit", "earn", "reward", "refer"],
  },
  {
    id: "client-share-referral",
    category: "Referrals",
    title: "How to Share Your Referral Link & Earn Credit",
    description: "Copy and share your unique referral link to get started.",
    audience: "client",
    steps: [
      { title: "Find your link", body: "On the Referrals page, your unique referral link is displayed with a 'Copy' button." },
      { title: "Copy the link", body: "Click Copy to save it to your clipboard." },
      { title: "Share with friends", body: "Send it via text, email, or social media to anyone who might benefit from a professional home assessment." },
      { title: "They sign up", body: "When your friend clicks the link and signs up for HBC, the referral is tracked automatically." },
      { title: "You earn credit", body: "Once they become an active member, your credit is applied to your account and reflected in your billing." },
    ],
    tip: "Share your referral link right after a friend compliments your home or asks about a project you've completed. That's when interest is highest.",
    keywords: ["share", "link", "copy", "referral", "send", "friend", "invite"],
  },
];
