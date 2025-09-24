import Image from "next/image";
import { FloatingDock } from "@/components/ui/floating-dock";
import { IconBook, IconGavel, IconHome, IconScale } from "@tabler/icons-react";

export default function HomePage() {
  const navigationItems = [
    {
      title: "Home",
      icon: <IconHome className="text-neutral-500 dark:text-neutral-400" />,
      href: "/",
    },
    {
      title: "Legal Analysis",
      icon: <IconScale className="text-neutral-500 dark:text-neutral-400" />,
      href: "/analysis",
    },
    {
      title: "Case Law",
      icon: <IconGavel className="text-neutral-500 dark:text-neutral-400" />,
      href: "/cases",
    },
    {
      title: "Resources",
      icon: <IconBook className="text-neutral-500 dark:text-neutral-400" />,
      href: "/resources",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Existing navbar */}
      <div className="pt-4 px-4">
        <FloatingDock
          items={navigationItems}
          desktopClassName="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          mobileClassName="fixed top-4 right-4 z-50"
        />
      </div>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 to-black z-0" />
        <div className="container mx-auto px-4 z-10">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
              IndianLaw AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl">
              Revolutionizing legal research with artificial intelligence. Access,
              analyze, and understand Indian law like never before.
            </p>
            <div className="flex gap-4 mt-8">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors">
                Get Started
              </button>
              <button className="px-8 py-3 border border-purple-600 rounded-lg font-medium hover:bg-purple-600/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-neutral-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <IconScale className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Legal Analysis</h3>
              <p className="text-gray-400">
                Advanced AI-powered analysis of legal documents and case laws.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-neutral-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <IconGavel className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Case Research</h3>
              <p className="text-gray-400">
                Comprehensive database of Indian court judgments and precedents.
              </p>
            </div>
            <div className="p-6 rounded-xl bg-neutral-900/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <IconBook className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Legal Resources</h3>
              <p className="text-gray-400">
                Access to statutes, regulations, and legal documentation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-t border-neutral-800">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <h4 className="text-4xl font-bold text-purple-400">1M+</h4>
              <p className="text-gray-400 mt-2">Legal Documents</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-purple-400">50K+</h4>
              <p className="text-gray-400 mt-2">Case Laws</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-purple-400">24/7</h4>
              <p className="text-gray-400 mt-2">AI Assistance</p>
            </div>
            <div>
              <h4 className="text-4xl font-bold text-purple-400">99%</h4>
              <p className="text-gray-400 mt-2">Accuracy Rate</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
        