import ImageUploader from "./components/imageUploader";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">O.XYZ Media Kit App</h1>
      <ImageUploader />
    </main>
  );
}
