
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="bg-neutral-900 text-white min-h-screen font-serif">
      <section className="py-20 px-8 text-center">
        <h1 className="text-5xl font-bold mb-4">Discover Your Next Read</h1>
        <p className="text-lg mb-8">Curated digital books for the modern thinker.</p>
        <Button className="text-white bg-blue-600 hover:bg-blue-700">Browse eBooks</Button>
      </section>

      <section className="grid md:grid-cols-3 gap-6 px-8 py-12">
        <div className="bg-neutral-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Brand Origin</h2>
          <p>Founded with a love for learning and design.</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Product Promise</h2>
          <p>Quality content, accessible formats, timeless topics.</p>
        </div>
        <div className="bg-neutral-800 p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold mb-2">Call-to-Action Tone</h2>
          <p>Direct, intelligent, and quietly persuasive.</p>
        </div>
      </section>

      <section className="px-8 py-12">
        <h2 className="text-3xl font-semibold mb-6">Shop Our Featured Titles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((product) => (
            <Card key={product} className="bg-neutral-800">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">eBook Title {product}</h3>
                <p className="mb-4">Short description of the eBook and its value.</p>
                <Link href="/product-detail">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">View Details</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="bg-neutral-800 py-12 px-8">
        <h2 className="text-3xl font-semibold text-center mb-6">What Readers Say</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="italic">“Insightful and beautifully designed. Highly recommend!”</p>
            <p className="mt-2 text-sm">– Avid Reader</p>
          </div>
          <div>
            <p className="italic">“A refreshing approach to digital books.”</p>
            <p className="mt-2 text-sm">– Entrepreneur</p>
          </div>
        </div>
      </section>
    </main>
  );
}
