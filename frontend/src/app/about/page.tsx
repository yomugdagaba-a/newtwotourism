'use client';

import { Building2, MapPin, Users, Award, Heart, Globe, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add TopBar */}
      <TopBar showCategories={false} />
      
      {/* Hero Section - Much Smaller */}
      <div className="bg-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 rounded-full mb-2">
              <span className="text-xl font-bold">NW</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">North Wollo Tourism</h1>
            <p className="text-xs text-blue-100">
              Discover the hidden gems of North Wollo, Ethiopia. Experience rich heritage, 
              breathtaking landscapes, and warm hospitality.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section - Smaller */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              North Wollo Tourism is a platform dedicated to showcasing the rich cultural heritage, 
              natural wonders, and hospitality of the North Wollo region in Ethiopia.
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              We connect travelers with authentic experiences, from ancient churches and breathtaking 
              highlands to mysterious caverns and vibrant local culture. Our mission is to promote 
              sustainable tourism while preserving the unique character of this remarkable region.
            </p>
          </div>

          {/* Stats Section - Smaller, No Gradients */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
              <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">100+</div>
              <div className="text-xs text-gray-600 font-medium">Tourism Sites</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
              <Building2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">50+</div>
              <div className="text-xs text-gray-600 font-medium">Partner Hotels</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-5 text-center">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 mb-1">1000+</div>
              <div className="text-xs text-gray-600 font-medium">Happy Visitors</div>
            </div>
          </div>

          {/* Features Section - Smaller, No Colors */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Rich Heritage</h3>
                  <p className="text-xs text-gray-600">
                    Explore ancient churches, historical sites, and cultural landmarks that tell 
                    the story of North Wollo's fascinating past.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Natural Wonders</h3>
                  <p className="text-xs text-gray-600">
                    Experience breathtaking highlands, mysterious caverns, and stunning landscapes 
                    that showcase Ethiopia's natural beauty.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Warm Hospitality</h3>
                  <p className="text-xs text-gray-600">
                    Experience the genuine warmth and friendliness of the local people who are 
                    eager to share their culture and traditions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Quality Accommodations</h3>
                  <p className="text-xs text-gray-600">
                    Stay in carefully selected hotels and lodges that offer comfort, authenticity, 
                    and excellent service throughout your journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-8 text-gray-500">
            <p className="text-xs">
              © {new Date().getFullYear()} North Wollo Tourism. All rights reserved.
            </p>
            <p className="text-xs mt-1">
              Built with Next.js, React & PostgreSQL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
