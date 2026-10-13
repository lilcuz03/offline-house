import Header from "@/components/Header";
import Hero from "../components/home/hero";
import CategoryShowcase from "../components/home/categoryshowcase";
import BestSellers from "@/components/home/bestseller";
import Manifesto from "@/components/home/manifasto";
import DealsCountdown from "@/components/home/dealscountdown";
import Reviews from "@/components/home/reviews";
import Newsletter from "@/components/home/newsletter";
export default function Home() {
  return (
    <>
      <Header />
      <main
        id="main"
        className="flex-1"
      >
        <Hero />
        <CategoryShowcase />
        <BestSellers />
        <Manifesto />
        <DealsCountdown />
        <Reviews />
        <Newsletter />
        {/* Next sections go here */}
      </main>
    </>
  );
}
