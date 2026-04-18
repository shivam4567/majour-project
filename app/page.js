import { getFeaturedCars, getHeroImage } from "@/actions/home";
import CarCard from "@/components/CarCard";
import HomeSearch from "@/components/HomeSearch";
import { Button } from "@/components/ui/button";
import { bodyTypes, carMakes } from "@/lib/data";
import { SignedOut } from "@clerk/nextjs";
import { Calendar, Car, ChevronRight, Shield } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {

  const featuredCars = await getFeaturedCars()
  const heroImageUrl = await getHeroImage()
  return (
    <div className="pt-20 flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-16 md:py-24 dotted-background">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                AI Powered Marketplace
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 gradient-title">
                Find your dream car with Vehiql AI
              </h1>
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
                Smarter search, verified listings, and instant test-drive
                booking. Discover the right ride in minutes.
              </p>

              <div className="mb-10">
                <HomeSearch />
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl border border-white/15 bg-white/5 p-3 backdrop-blur">
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={heroImageUrl || "/3.jpg"}
                    alt="Featured car"
                    width={900}
                    height={675}
                    className="h-full w-full object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CARS SECTION */}
      <section className="py-2">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Featured Cars</h2>
            <Button variant={"ghost"} className={"flex items-center"} asChild>
              <Link href={"/cars"}>
                View All <ChevronRight className="ml-1 h-4 w-4" />{" "}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCars.map((car) => {
              return <CarCard key={car.id} car={car} />;
            })}
          </div>
        </div>
      </section>

      {/* BROWSE BY MAKE SECTION */}
      <section className="py-2 bg-muted/60">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Browse By Company</h2>
            <Button variant={"ghost"} className={"flex items-center"} asChild>
              <Link href={"/cars"}>
                View All <ChevronRight className="ml-1 h-4 w-4" />{" "}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {carMakes.map((make) => {
              return (
                <Link
                  className="bg-card text-card-foreground rounded-lg border border-border/70 p-4 text-center shadow-sm hover:shadow-md transition cursor-pointer"
                  key={make.name}
                  href={`/cars?make=${make.name}`}
                >
                  <div className="h-16 w-auto mx-auto mb-2 relative">
                    <Image
                      style={{ objectFit: "contain" }}
                      src={make.image}
                      alt={make.name}
                      fill
                    />
                  </div>
                  <h3 className="font-medium">{make.name}</h3>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE OUR PLATFORM SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-2">
          <h2 className="text-2xl font-bold text-center mb-12">
            Why Choose Our Platform
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Car className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">
                Thousands of verified vehicles from trusted dealerships and
                private sellers.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">
                Thousands of verified vehicles from trusted dealerships and
                private sellers.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary/10 text-primary rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">Wide Selection</h3>
              <p className="text-muted-foreground">
                Thousands of verified vehicles from trusted dealerships and
                private sellers.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* BROWSE BY BODY TYPE */}
      <section className="py-2 bg-muted/60">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Browse By Company</h2>
            <Button variant={"ghost"} className={"flex items-center"} asChild>
              <Link href={"/cars"}>
                View All <ChevronRight className="ml-1 h-4 w-4" />{" "}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bodyTypes.map((type) => {
              return (
                <Link
                  className="relative group cursor-pointer"
                  key={type.name}
                  href={`/cars?bodyType=${type.name}`}
                >
                  <div className="overflow-hidden rounded-lg flex justify-end h-28 mb-4 relative">
                    <Image
                      style={{ objectFit: "contain" }}
                      src={type.image}
                      fill
                      alt={type.name}
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-lg flex items-end">
                    <h3 className="text-white text-xl font-bold pl-4 pb-2">{type.name}</h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* READY TO FIND DREAM CAR SECTION */}
      <section className="py-16 dotted-background text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Find Your Dream Car?</h2>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their perfect vehicle through our platform.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild variant={'secondary'} size={'lg'}>
              <Link href={'/cars'}>View All Cars</Link>
            </Button>

            <SignedOut>
              <Button size={"lg"} asChild>
                <Link href={'/sign-up'}>Sign Up ow</Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </section>
    </div>
  );
}
