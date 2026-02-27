import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Building2,
  MapPin,
  BarChart3,
  Landmark,
  DollarSign,
  Home,
  Users,
} from 'lucide-react';
import Link from 'next/link';

/* Market data - in production, sourced from backend analytics */
const CITY_DATA = [
  {
    name: 'Riyadh',
    avgPricePerSqm: 4800,
    yoyChange: 18.5,
    avgYield: 6.5,
    hotDistricts: ['Al Olaya', 'Al Nakheel', 'Al Malqa', 'Hittin'],
    outlook: 'Strong growth driven by entertainment mega-projects, metro completion, and corporate relocations.',
    totalListings: 1200,
  },
  {
    name: 'Jeddah',
    avgPricePerSqm: 4200,
    yoyChange: 14.8,
    avgYield: 7.0,
    hotDistricts: ['Al Hamra', 'Al Shati', 'Obhur', 'Al Rawdah'],
    outlook: 'Waterfront development and Red Sea tourism driving premium coastal property demand.',
    totalListings: 850,
  },
  {
    name: 'Dammam',
    avgPricePerSqm: 3200,
    yoyChange: 11.2,
    avgYield: 7.5,
    hotDistricts: ['Al Faisaliyah', 'Al Shati', 'Al Anoud'],
    outlook: 'Industrial growth and oil sector diversification creating steady residential demand.',
    totalListings: 400,
  },
  {
    name: 'Al Khobar',
    avgPricePerSqm: 3800,
    yoyChange: 13.0,
    avgYield: 7.2,
    hotDistricts: ['Al Khobar Waterfront', 'Al Aqrabiyah', 'Al Rakah'],
    outlook: 'King Salman Causeway project and expat community sustaining premium pricing.',
    totalListings: 350,
  },
  {
    name: 'Makkah',
    avgPricePerSqm: 5500,
    yoyChange: 10.5,
    avgYield: 8.5,
    hotDistricts: ['Al Aziziyah', 'Al Shawqiyah', 'Al Awali'],
    outlook: 'Hajj/Umrah tourism guarantees consistent rental demand year-round.',
    totalListings: 600,
  },
];

const PROPERTY_TYPE_YIELDS = [
  { type: 'Apartment', yield: 7.2, trend: 'up' },
  { type: 'Villa', yield: 5.8, trend: 'stable' },
  { type: 'Commercial Building', yield: 9.5, trend: 'up' },
  { type: 'Office Space', yield: 8.0, trend: 'up' },
  { type: 'Land', yield: 0, trend: 'appreciation' },
  { type: 'Retail/Shop', yield: 10.2, trend: 'up' },
];

const VISION_2030_PROJECTS = [
  {
    name: 'NEOM',
    investment: '$500B',
    description: 'Futuristic city on the Red Sea coast. The Line, Trojena ski resort, and Oxagon industrial hub.',
    impact: 'Surrounding land values expected to increase 5-10x by 2030.',
  },
  {
    name: 'Red Sea Global',
    investment: '$16B',
    description: 'Luxury resort destination across 90+ islands. Expected 1M+ tourists annually.',
    impact: 'Hospitality and residential real estate in Tabuk region benefiting from proximity.',
  },
  {
    name: 'Diriyah Gate',
    investment: '$20B',
    description: 'Cultural and lifestyle destination on Riyadh\'s historic site. Hotels, museums, retail.',
    impact: 'North Riyadh property prices rising as district transforms.',
  },
  {
    name: 'Jeddah Tower',
    investment: '$2B',
    description: 'World\'s tallest building project. Mixed-use tower with residential, hotel, and commercial.',
    impact: 'Jeddah waterfront district seeing 15%+ annual appreciation.',
  },
];

export default function InsightsPage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-800 py-16">
        <div className="container-wide text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Market Insights</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Data-driven analysis of Saudi Arabia&apos;s real estate market. Updated daily from
            our AI-powered property intelligence platform.
          </p>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="-mt-8 pb-12">
        <div className="container-wide">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BarChart3, label: 'National Avg. Price/m\u00B2', value: '4,100 SAR', change: '+15.2% YoY' },
              { icon: DollarSign, label: 'Average Rental Yield', value: '7.2%', change: 'Across all cities' },
              { icon: Home, label: 'Active Listings Tracked', value: '8,400+', change: 'Updated daily' },
              { icon: Users, label: 'Foreign Ownership', value: 'Permitted', change: 'Since 2021 reforms' },
            ].map((metric) => (
              <div key={metric.label} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                <metric.icon className="h-6 w-6 text-brand-600" />
                <p className="mt-3 text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-500">{metric.label}</p>
                <p className="mt-1 text-xs text-brand-600">{metric.change}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City-by-City Analysis */}
      <section className="bg-gray-50 py-16">
        <div className="container-wide">
          <h2 className="section-heading">City-by-City Analysis</h2>
          <p className="section-subheading">
            Compare investment fundamentals across major Saudi cities.
          </p>

          <div className="mt-12 space-y-6">
            {CITY_DATA.map((city) => (
              <div key={city.name} className="card p-0 overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                  {/* Left: Stats */}
                  <div className="flex-1 p-6 lg:p-8">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-brand-600" />
                      <h3 className="text-xl font-bold text-gray-900">{city.name}</h3>
                      <span className="flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        <TrendingUp className="h-3 w-3" />
                        +{city.yoyChange}% YoY
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-500">{city.outlook}</p>

                    <div className="mt-6 grid grid-cols-3 gap-6">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {city.avgPricePerSqm.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">SAR/m&sup2; avg.</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-brand-600">{city.avgYield}%</p>
                        <p className="text-xs text-gray-400">Avg. Yield</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-navy-700">
                          {city.totalListings.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">Active Listings</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Hot Districts */}
                  <div className="border-t border-gray-100 bg-gray-50 p-6 lg:w-72 lg:border-l lg:border-t-0">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                      Hot Districts
                    </h4>
                    <ul className="mt-3 space-y-2">
                      {city.hotDistricts.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="h-1.5 w-1.5 rounded-full bg-gold-500" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yield by Property Type */}
      <section className="py-16">
        <div className="container-wide">
          <h2 className="section-heading">Yield by Property Type</h2>
          <p className="section-subheading">
            Average annual rental yields across Saudi Arabia by property category.
          </p>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROPERTY_TYPE_YIELDS.map((item) => (
              <div key={item.type} className="card flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50">
                  <Building2 className="h-6 w-6 text-brand-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{item.type}</p>
                  <p className="text-2xl font-bold text-brand-600">
                    {item.yield > 0 ? `${item.yield}%` : 'Capital Gains'}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">Trend: {item.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision 2030 Impact */}
      <section className="bg-navy-900 py-16">
        <div className="container-wide">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">Vision 2030 Mega Projects</h2>
            <p className="mt-4 text-gray-400">
              These transformative projects are reshaping Saudi Arabia&apos;s real estate landscape
              and creating unprecedented investment opportunities.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {VISION_2030_PROJECTS.map((project) => (
              <div key={project.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-6 w-6 text-gold-400" />
                    <h3 className="text-lg font-bold text-white">{project.name}</h3>
                  </div>
                  <span className="rounded-full bg-gold-500/10 px-3 py-1 text-sm font-semibold text-gold-400">
                    {project.investment}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-400">{project.description}</p>
                <p className="mt-3 rounded-lg bg-brand-600/20 px-3 py-2 text-sm font-medium text-brand-300">
                  Impact: {project.impact}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-wide text-center">
          <h2 className="section-heading">Want Personalized Market Analysis?</h2>
          <p className="section-subheading">
            Our team provides custom investment reports based on your specific criteria, budget,
            and risk profile.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/contact" className="btn-primary px-8">
              Request Custom Report
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link href="/opportunities" className="btn-secondary px-8">
              Browse Opportunities
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
