import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFoundView from "@/components/NoteFoundView";

export default function NotFound() {
  return (
    <>
      <Header />
      <main
        id="main"
        className="flex-1"
      >
        <NotFoundView />
      </main>
    </>
  );
}
