export default function HeroSection() {
  return (
    <div className="relative w-full h-[500px] md:h-[600px] lg:h-[700px]">
      <img
        src="/images/hero-tourism.jpg" // Replace with actual hero image path
        alt="North Wollo Tourism"
        className="w-full h-full object-cover rounded-lg shadow-lg"
      />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
        <h1 className="text-white text-4xl md:text-5xl font-bold text-center px-4">
          Discover the Wonders of North Wollo
        </h1>
      </div>
    </div>
  );
}
