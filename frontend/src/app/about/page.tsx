'use client';

import { Building2, MapPin, Users, Award, Heart, Globe } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { icon: MapPin,     value: '100+', label: t("tourism.location") },
    { icon: Building2,  value: '50+',  label: t("nav.hotels") },
    { icon: Users,      value: '1000+',label: t("guider.languageGuiders") },
  ];

  const features = [
    {
      icon: Award,
      title: t("categories.HERITAGE"),
      desc: t("categories.heritageDesc"),
    },
    {
      icon: Globe,
      title: t("categories.HIGHLAND"),
      desc: t("categories.highlandDesc"),
    },
    {
      icon: Heart,
      title: t("categories.CULTURE"),
      desc: t("categories.cultureDesc"),
    },
    {
      icon: Building2,
      title: t("nav.hotels"),
      desc: t("hotel.description"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar showCategories={false} />

      <div className="px-4 sm:px-6 py-6">
        <div className="max-w-6xl mx-auto">

        {/* Compact header card — no blue background */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            NW
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t("common.northWolloTourism")}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{t("home.heroSubtitle")}</p>
          </div>
        </div>

        {/* Mission */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t("common.info")}</h2>
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            {t("common.northWolloTourism")} — {t("home.heroSubtitle")}
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            {t("categories.heritageDesc")} {t("categories.highlandDesc")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm">
              <s.icon className="w-6 h-6 text-gray-500 mx-auto mb-1.5" />
              <div className="text-2xl font-bold text-blue-600">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <f.icon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-0.5">{f.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">{t("common.contactUs")}</h2>
          <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📍</span>
              <span>{t("common.address")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📞</span>
              <a href="tel:+251911234567" className="hover:text-blue-600">+251 911 234 567</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">📧</span>
              <a href="mailto:info@northwollotourism.com" className="hover:text-blue-600">info@northwollotourism.com</a>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-500">🕐</span>
              <span>{t("common.workingHours")}</span>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {t("common.northWolloTourism")}. {t("common.allRightsReserved")}
        </p>

        </div>{/* end max-w-6xl */}
      </div>{/* end px wrapper */}

      <Footer />
    </div>
  );
}
