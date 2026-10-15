import { Suspense } from "react";
import Hero from "../components/home/hero";
import CategoryShowcase from "../components/home/categoryshowcase";
import BestSellersLive from "@/components/home/BestSellersLive";
import Manifesto from "@/components/home/manifasto";
import DealsLive from "@/components/home/DealsLive";
import Reviews from "@/components/home/reviews";
import Newsletter from "@/components/home/newsletter";

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryShowcase />
      <Suspense
        fallback={
          <div
            className="min-h-[32rem]"
            aria-hidden="true"
          />
        }
      >
        <BestSellersLive />
      </Suspense>
      <Manifesto />
      <Suspense fallback={null}>
        <DealsLive />
      </Suspense>
      <Reviews />
      <Newsletter />
      {/* Next sections go here */}
    </>
  );
}
