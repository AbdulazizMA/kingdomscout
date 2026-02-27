import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  BarChart3,
  Globe2,
  Building2,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Landmark,
  Users,
  Banknote,
  Star,
} from 'lucide-react';

/* ─── Hero ─── */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-brand-800 py-24 sm:py-32">
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />

      <div className="container-wide relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
            <Star className="h-4 w-4" />
            Vision 2030 Investment Opportunities
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Invest in Saudi Arabia&apos;s{' '}
            <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">
              Real Estate Boom
            </span>
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-gray-300 sm:text-xl">
            Access AI-curated investment opportunities across the Kingdom. We analyze thousands
            of properties daily to find the highest-yield deals for international investors.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/opportunities" className="btn-gold px-8 py-4 text-base">
              Browse Opportunities
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/contact" className="btn-secondary border-white/20 bg-white/10 px-8 py-4 text-base text-white hover:bg-white/20">
              Book Free Consultation
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-16 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: '2,500+', label: 'Properties Analyzed Daily' },
              { value: '7.2%', label: 'Avg. Annual Yield' },
              { value: '20+', label: 'Saudi Cities Covered' },
              { value: '$1.3T', label: 'Vision 2030 Investment' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-gold-400 sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Why Saudi Arabia ─── */
function WhySaudi() {
  const reasons = [
    {
      icon: Landmark,
      title: 'Vision 2030 Transformation',
      description:
        'Saudi Arabia is investing $1.3 trillion in infrastructure, tourism, and urban development. NEOM, The Line, and Jeddah Tower are just the beginning.',
    },
    {
      icon: TrendingUp,
      title: 'Rapid Market Growth',
      description:
        'Property values in key Saudi cities have appreciated 15-25% over the past 3 years, with projections showing continued strong growth.',
    },
    {
      icon: Globe2,
      title: 'Foreign Ownership Rights',
      description:
        'Recent regulatory reforms now allow foreign nationals to own property in Saudi Arabia, opening the market to global investors for the first time.',
    },
    {
      icon: Banknote,
      title: 'Tax-Free Returns',
      description:
        'Saudi Arabia has no personal income tax, no capital gains tax on real estate, and rental income is tax-free for individuals.',
    },
    {
      icon: Users,
      title: 'Growing Population',
      description:
        'With a population of 36M+ and a median age of 31, Saudi Arabia has enormous housing demand driven by a young, growing workforce.',
    },
    {
      icon: Shield,
      title: 'Stable Economy',
      description:
        'Backed by the world\'s largest sovereign wealth fund (PIF) and diversifying beyond oil, Saudi Arabia offers economic stability rare in emerging markets.',
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">
            Why Invest in Saudi Arabia?
          </h2>
          <p className="section-subheading">
            The Kingdom is undergoing the largest economic transformation in modern history.
            Here&apos;s why global investors are paying attention.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason) => (
            <div key={reason.title} className="card group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                <reason.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">{reason.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Browse Curated Opportunities',
      description:
        'Our AI scans thousands of Saudi property listings daily, scoring each on investment potential, yield, and market position.',
    },
    {
      step: '02',
      title: 'Get Expert Analysis',
      description:
        'Receive detailed investment reports with ROI projections, market comparisons, and risk assessments for properties that interest you.',
    },
    {
      step: '03',
      title: 'Consult With Our Team',
      description:
        'Our Saudi-based team handles everything: legal compliance, property inspection, negotiation, and transaction management.',
    },
    {
      step: '04',
      title: 'Invest With Confidence',
      description:
        'We manage the entire acquisition process and can provide ongoing property management for hands-off investors.',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">How It Works</h2>
          <p className="section-subheading">
            From discovery to acquisition, we handle every step of your Saudi real estate
            investment journey.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.step} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white">
                {step.step}
              </div>
              <h3 className="mt-6 text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Featured Cities ─── */
function FeaturedCities() {
  const cities = [
    {
      name: 'Riyadh',
      description: 'The capital and economic hub. Massive infrastructure growth with new entertainment districts and metro system.',
      yield: '6.5%',
      growth: '+18%',
      properties: '1,200+',
    },
    {
      name: 'Jeddah',
      description: 'Gateway to the Holy Cities. Booming waterfront development and the upcoming Jeddah Tower.',
      yield: '7.0%',
      growth: '+15%',
      properties: '850+',
    },
    {
      name: 'Dammam / Khobar',
      description: 'Eastern Province oil hub. Strong expat community and industrial development driving demand.',
      yield: '7.5%',
      growth: '+12%',
      properties: '600+',
    },
    {
      name: 'NEOM Region',
      description: '$500B mega-project creating a new city from scratch. Early-stage land investment opportunities.',
      yield: 'TBD',
      growth: 'N/A',
      properties: 'Early Access',
    },
  ];

  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">Key Investment Markets</h2>
          <p className="section-subheading">
            Explore the fastest-growing real estate markets across the Kingdom.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {cities.map((city) => (
            <div
              key={city.name}
              className="card flex flex-col justify-between border-gray-200 p-8"
            >
              <div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand-600" />
                  <h3 className="text-xl font-bold text-gray-900">{city.name}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{city.description}</p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6">
                <div>
                  <p className="text-lg font-bold text-brand-600">{city.yield}</p>
                  <p className="text-xs text-gray-400">Avg. Yield</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gold-600">{city.growth}</p>
                  <p className="text-xs text-gray-400">YoY Growth</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy-700">{city.properties}</p>
                  <p className="text-xs text-gray-400">Listings</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services ─── */
function Services() {
  const services = [
    {
      icon: BarChart3,
      title: 'Market Intelligence',
      description: 'Real-time data on price trends, yields, and market conditions across 20+ Saudi cities.',
    },
    {
      icon: Building2,
      title: 'Property Sourcing',
      description: 'AI-powered deal discovery that identifies undervalued properties before the market catches on.',
    },
    {
      icon: Shield,
      title: 'Legal & Compliance',
      description: 'Full support with Saudi property law, foreign ownership regulations, and transaction compliance.',
    },
    {
      icon: Globe2,
      title: 'Remote Investment',
      description: 'Invest from anywhere. We handle inspections, negotiations, and paperwork on your behalf.',
    },
  ];

  return (
    <section className="bg-navy-900 py-20 sm:py-28">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Full-Service Investment Support
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            We&apos;re not just a listing platform. We&apos;re your end-to-end investment partner in Saudi Arabia.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <service.icon className="h-8 w-8 text-gold-400" />
              <h3 className="mt-4 text-lg font-semibold text-white">{service.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-wide">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 to-brand-800 px-8 py-16 text-center sm:px-16">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Invest in Saudi Arabia?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
            Schedule a free consultation with our investment team. We&apos;ll analyze your goals and
            recommend the best opportunities in the Kingdom.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-gold px-8 py-4 text-base">
              Book Free Consultation
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/opportunities" className="btn-secondary border-white/20 bg-white/10 px-8 py-4 text-base text-white hover:bg-white/20">
              Browse Properties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials ─── */
function Testimonials() {
  const testimonials = [
    {
      quote: 'Saudi Gateway helped me acquire two apartments in Riyadh from London. The process was seamless and the returns have exceeded my expectations.',
      name: 'James Richardson',
      role: 'Private Investor, UK',
    },
    {
      quote: 'Their market data is exceptional. I was able to identify undervalued districts in Jeddah that other platforms completely missed.',
      name: 'Sarah Chen',
      role: 'Real Estate Fund Manager, Singapore',
    },
    {
      quote: 'As a first-time foreign investor in Saudi, their legal guidance was invaluable. They handled everything from RERA compliance to title transfer.',
      name: 'Ahmed Hassan',
      role: 'Investor, UAE',
    },
  ];

  return (
    <section className="bg-gray-50 py-20 sm:py-28">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="section-heading">What Investors Say</h2>
          <p className="section-subheading">
            Trusted by international investors across the globe.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="card">
              <div className="flex gap-1 text-gold-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 border-t border-gray-100 pt-4">
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Page ─── */
export default function Home() {
  return (
    <main>
      <Hero />
      <WhySaudi />
      <FeaturedCities />
      <HowItWorks />
      <Services />
      <Testimonials />
      <CTA />
    </main>
  );
}
