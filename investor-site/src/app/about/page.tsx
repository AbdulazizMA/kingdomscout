import {
  Shield,
  Globe2,
  BarChart3,
  Users,
  Award,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-800 py-20">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Your Gateway to Saudi Real Estate
            </h1>
            <p className="mt-6 text-lg text-gray-300">
              Saudi Gateway Realty is a Riyadh-based real estate investment advisory firm
              specializing in helping foreign investors access Saudi Arabia&apos;s rapidly growing
              property market.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20">
        <div className="container-wide">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="section-heading">Our Mission</h2>
              <p className="mt-6 text-gray-600 leading-relaxed">
                We bridge the gap between international investors and Saudi Arabia&apos;s
                real estate opportunities. As the Kingdom opens its doors to foreign
                investment under Vision 2030, navigating the market requires local expertise,
                data-driven insights, and a trusted partner on the ground.
              </p>
              <p className="mt-4 text-gray-600 leading-relaxed">
                We combine advanced AI-powered property analytics with deep local market
                knowledge to identify, evaluate, and acquire the highest-potential
                investments for our clients.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  'AI-powered property discovery scanning 2,500+ listings daily',
                  'RERA-licensed and Ministry of Commerce registered',
                  'Multilingual team serving clients in 6+ languages',
                  'End-to-end service from sourcing to property management',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
                    <p className="text-sm text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats card */}
            <div className="rounded-2xl bg-gray-50 p-8">
              <h3 className="text-lg font-semibold text-gray-900">By the Numbers</h3>
              <div className="mt-6 grid grid-cols-2 gap-6">
                {[
                  { value: '2,500+', label: 'Properties Analyzed Daily', icon: BarChart3 },
                  { value: '20+', label: 'Saudi Cities Covered', icon: Globe2 },
                  { value: '7.2%', label: 'Avg. Client Portfolio Yield', icon: TrendingUp },
                  { value: '100%', label: 'Foreign-Investor Focused', icon: Users },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white p-4 shadow-sm">
                    <stat.icon className="h-6 w-6 text-brand-600" />
                    <p className="mt-3 text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-gray-50 py-20">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="section-heading">What We Do</h2>
            <p className="section-subheading">
              Comprehensive investment services tailored for international investors.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: 'Market Intelligence',
                items: [
                  'Real-time price tracking across 20+ cities',
                  'District-level yield analysis',
                  'Trend forecasting and market reports',
                  'Custom investment scoring algorithms',
                ],
              },
              {
                icon: Building2,
                title: 'Property Acquisition',
                items: [
                  'AI-powered deal sourcing',
                  'On-site property inspections',
                  'Price negotiation on your behalf',
                  'Due diligence and verification',
                ],
              },
              {
                icon: Shield,
                title: 'Legal & Compliance',
                items: [
                  'Foreign ownership registration (RERA)',
                  'Title deed verification and transfer',
                  'Contract review and preparation',
                  'Tax and regulatory guidance',
                ],
              },
              {
                icon: Globe2,
                title: 'Remote Investment',
                items: [
                  'Virtual property tours',
                  'Secure digital document signing',
                  'Multilingual support (EN, AR, ZH, FR)',
                  'Regular portfolio performance reports',
                ],
              },
              {
                icon: Users,
                title: 'Property Management',
                items: [
                  'Tenant screening and placement',
                  'Rent collection and disbursement',
                  'Maintenance coordination',
                  'Quarterly performance reporting',
                ],
              },
              {
                icon: Award,
                title: 'Investment Advisory',
                items: [
                  'Portfolio strategy planning',
                  'Risk assessment and mitigation',
                  'Exit strategy development',
                  'Market timing guidance',
                ],
              },
            ].map((service) => (
              <div key={service.title} className="card">
                <service.icon className="h-8 w-8 text-brand-600" />
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{service.title}</h3>
                <ul className="mt-4 space-y-2">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Foreign Ownership Guide */}
      <section className="py-20">
        <div className="container-wide">
          <div className="mx-auto max-w-3xl">
            <h2 className="section-heading text-center">Foreign Ownership in Saudi Arabia</h2>
            <p className="section-subheading text-center">
              A quick overview of what international investors need to know.
            </p>

            <div className="mt-12 space-y-6">
              {[
                {
                  q: 'Can foreigners buy property in Saudi Arabia?',
                  a: 'Yes. Since 2021, non-Saudi nationals can own residential and commercial property in most Saudi cities. Some restrictions apply to properties in Makkah and Madinah (leasehold only for non-GCC nationals).',
                },
                {
                  q: 'What is the process?',
                  a: 'Foreign buyers must obtain approval from the Ministry of Interior. The process takes 2-4 weeks and requires a valid residency permit (Iqama) or a Premium Residency visa. Our team handles the entire application.',
                },
                {
                  q: 'Are there taxes on real estate?',
                  a: 'There is no annual property tax. A 5% Real Estate Transaction Tax (RETT) applies on purchase. No capital gains tax for individuals. VAT (15%) applies to commercial properties but not residential.',
                },
                {
                  q: 'What returns can I expect?',
                  a: 'Rental yields typically range from 5.5% to 10%+ depending on city, property type, and location. Capital appreciation has averaged 12-18% annually in major cities over the past 3 years.',
                },
                {
                  q: 'Can I finance the purchase?',
                  a: 'Saudi banks offer mortgages to residents. Non-residents may face restrictions but can often access financing through their home country banks or through our partner financial institutions.',
                },
              ].map((faq) => (
                <div key={faq.q} className="rounded-xl border border-gray-200 bg-white p-6">
                  <h3 className="font-semibold text-gray-900">{faq.q}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-wide">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-16 text-center sm:px-16">
            <h2 className="text-3xl font-bold text-white">Start Your Saudi Investment Journey</h2>
            <p className="mx-auto mt-4 max-w-xl text-brand-100">
              Book a free consultation with our team. We&apos;ll discuss your investment goals,
              budget, and timeline, and create a personalized strategy.
            </p>
            <Link href="/contact" className="btn-gold mt-8 px-8 py-4">
              Book Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
