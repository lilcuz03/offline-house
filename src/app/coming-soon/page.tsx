import type { Metadata } from "next";
import Image from "next/image";
import ComingSoonForm from "./ComingSoonForm";

export const metadata: Metadata = {
  title: "Opening soon",
  robots: { index: false, follow: false },
};

export default function ComingSoonPage() {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-ivory">
      <div className="mx-auto flex min-h-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
        <Image
          src="/brand/logo-full.png"
          alt="Offline House"
          width={615}
          height={350}
          priority
          className="h-auto w-44 sm:w-56"
        />
        <p className="mt-2 text-[15px] font-semibold uppercase tracking-[0.38em] text-ink sm:text-[17px]">
          Offline House
        </p>

        <h1 className="mt-12 font-serif text-5xl font-light leading-[1.05] text-ink sm:text-7xl">
          Opening soon.
        </h1>
        <p className="mt-5 max-w-md text-[17px] leading-relaxed text-muted">
          Only the top-selling tech, home and everyday essentials, in one place.
          We&apos;re putting the finishing touches on the shop.
        </p>

        <ComingSoonForm />

        <p className="mt-14 font-serif text-xl italic text-muted">
          Disconnect to reconnect.
        </p>
      </div>
    </div>
  );
}
