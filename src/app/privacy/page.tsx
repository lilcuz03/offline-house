import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessLines } from "@/lib/business";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "How Offline House collects, uses and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

/*
 * DRAFT written for South Africa's Protection of Personal Information Act
 * (POPIA). Read it, make sure it matches what the site really does, and have
 * it reviewed before launch. Business details come from src/lib/business.ts.
 */
const UPDATED = "20 October 2026";
const name = BUSINESS.tradingName;

const link = "text-ink underline underline-offset-4 hover:text-gold-deep";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      updated={UPDATED}
      intro={`Your personal information matters. This page explains what ${name} collects, why we collect it, who we share it with and what your rights are under South Africa's Protection of Personal Information Act (POPIA).`}
      sections={[
        {
          id: "who-we-are",
          title: "Who is responsible",
          paragraphs: [
            `${name} is the "responsible party" for your personal information, which means we decide why and how it is used. You can contact us about your information at any time.`,
          ],
          list: businessLines(),
        },
        {
          id: "what-we-collect",
          title: "What we collect",
          paragraphs: [
            "We only collect what we need. Depending on how you use the site, this can include:",
          ],
          list: [
            "Your name, email address and phone number, when you check out, create an account or contact us.",
            "Your delivery address.",
            "What you ordered, what you paid and your order history. We do not see or store your full card details. Our payment providers handle those.",
            "Your account details, if you sign up, including your email address and a securely stored password.",
            "Messages you send us, and reviews you write.",
            "Your email address, if you subscribe to our newsletter.",
            "Basic technical information, such as your browser and device, which helps the site work and stay secure.",
          ],
        },
        {
          id: "why",
          title: "Why we use it",
          paragraphs: ["We use your personal information to:"],
          list: [
            "Process and deliver your order, and send you order emails such as your confirmation.",
            "Take payment through our payment providers.",
            "Look after your account and answer your questions.",
            "Handle returns, refunds and complaints.",
            "Keep the shop secure and prevent fraud.",
            "Meet our legal duties, such as keeping tax and sales records.",
            "Send you news and offers, only if you have agreed to receive them.",
          ],
        },
        {
          id: "marketing",
          title: "Marketing emails",
          paragraphs: [
            "We only send you marketing emails if you subscribe to our newsletter. You can unsubscribe at any time using the link in any email, or by contacting us.",
            "Order emails, such as your confirmation, are not marketing. We send them because you placed an order.",
          ],
        },
        {
          id: "sharing",
          title: "Who we share it with",
          paragraphs: [
            "We do not sell your personal information. We share it only with the people who help us run the shop, and only what they need to do their job:",
          ],
          list: [
            "Payment providers (PayFast and Stitch), who take and confirm your payment.",
            "Delivery companies and couriers, who need your name, address and phone number to deliver your order.",
            "Our technology providers, who host the site, store our data and send our emails (such as Vercel, Supabase and Resend).",
            "Authorities or professional advisers, where the law requires it.",
          ],
        },
        {
          id: "where-stored",
          title: "Where your information is kept",
          paragraphs: [
            "Some of our technology providers store information on servers outside South Africa. When that happens, we only use providers that are bound to protect your information to a standard comparable to POPIA.",
          ],
        },
        {
          id: "how-long",
          title: "How long we keep it",
          paragraphs: [
            "We keep your information only for as long as we need it for the reasons above. Records of orders and payments are kept for at least five years, because South African tax law requires it.",
            "You can ask us to delete your account. We will then delete or anonymise your information, except for what we are legally required to keep.",
          ],
        },
        {
          id: "security",
          title: "How we protect it",
          paragraphs: [
            "We use reasonable technical and organisational measures to protect your information, including encrypted connections, restricted access for staff and secure payment providers. No system is completely secure, but we work to keep your information safe and will tell you and the Information Regulator if there is a breach that affects you, as the law requires.",
          ],
        },
        {
          id: "cookies",
          title: "Cookies and similar storage",
          paragraphs: [
            "The site uses your browser's storage for things it needs to work, such as keeping your bag and wishlist and keeping you signed in. These are essential.",
            "Optional analytics or marketing tools are only used if you allow them in the cookie settings, and you can change your choice at any time.",
          ],
        },
        {
          id: "your-rights",
          title: "Your rights",
          paragraphs: ["Under POPIA, you have the right to:"],
          list: [
            "Ask us what personal information we hold about you.",
            "Ask us to correct information that is wrong or out of date.",
            "Ask us to delete information we no longer need.",
            "Object to us using your information, or withdraw consent you gave earlier.",
            "Complain to the Information Regulator if you think we have handled your information unlawfully.",
          ],
          content: (
            <p>
              To use any of these rights, use the{" "}
              <Link
                href="/contact"
                className={link}
              >
                contact page
              </Link>
              {BUSINESS.email ? (
                <>
                  {" "}
                  or email{" "}
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className={link}
                  >
                    {BUSINESS.email}
                  </a>
                </>
              ) : null}
              . You can find the Information Regulator at{" "}
              <a
                href="https://inforegulator.org.za"
                target="_blank"
                rel="noopener noreferrer"
                className={link}
              >
                inforegulator.org.za
              </a>
              .
            </p>
          ),
        },
        {
          id: "children",
          title: "Children",
          paragraphs: [
            "The shop is not meant for people under 18. We do not knowingly collect information from children.",
          ],
        },
        {
          id: "changes",
          title: "Changes to this policy",
          paragraphs: [
            "We may update this policy. The date at the top of the page shows when it last changed.",
          ],
        },
      ]}
    />
  );
}
