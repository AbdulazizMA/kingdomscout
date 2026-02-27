'use client';

import { useState, FormEvent } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Globe2,
  MessageSquare,
} from 'lucide-react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    budget: '',
    interest: '',
    message: '',
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // In production, this would POST to the backend API
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center py-20">
        <div className="container-wide text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">Thank You!</h1>
          <p className="mx-auto mt-4 max-w-md text-gray-600">
            Your consultation request has been received. Our investment team will contact you
            within 24 hours to discuss your Saudi real estate goals.
          </p>
          <p className="mt-6 text-sm text-gray-400">
            Expect a call or email from our Riyadh office.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-gradient-to-br from-navy-900 to-navy-800 py-16">
        <div className="container-wide text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Book a Free Consultation</h1>
          <p className="mx-auto mt-4 max-w-2xl text-gray-400">
            Tell us about your investment goals and our Saudi-based team will create a
            personalized strategy for you. No obligation, no fees.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Country *</label>
                    <input
                      type="text"
                      required
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      placeholder="United Kingdom"
                    />
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Investment Budget (SAR)
                    </label>
                    <select
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Select range</option>
                      <option value="under-500k">Under 500,000 SAR</option>
                      <option value="500k-1m">500,000 - 1,000,000 SAR</option>
                      <option value="1m-3m">1,000,000 - 3,000,000 SAR</option>
                      <option value="3m-10m">3,000,000 - 10,000,000 SAR</option>
                      <option value="10m-plus">10,000,000+ SAR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      I&apos;m Interested In
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="">Select category</option>
                      <option value="residential">Residential (Apartments, Villas)</option>
                      <option value="commercial">Commercial (Offices, Retail)</option>
                      <option value="land">Land Investment</option>
                      <option value="building">Full Buildings (Rental Income)</option>
                      <option value="mixed">Mixed / Not Sure Yet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tell Us About Your Goals
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="What are you looking for? Any preferred cities or property types? Timeline for investment?"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-4 text-base sm:w-auto">
                  <Send className="mr-2 h-4 w-4" />
                  Submit Consultation Request
                </button>

                <p className="text-xs text-gray-400">
                  By submitting, you agree to be contacted by our investment team.
                  Your information is kept confidential and never shared with third parties.
                </p>
              </form>
            </div>

            {/* Contact Info Sidebar */}
            <div className="lg:col-span-2">
              <div className="sticky top-24 space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Mail className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-500">aalkuthami@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-500">+966 56 105 6054</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Office</p>
                        <p className="text-sm text-gray-500">
                          Riyadh, Kingdom of Saudi Arabia
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Business Hours</p>
                        <p className="text-sm text-gray-500">
                          Sun - Thu: 9:00 AM - 6:00 PM (AST)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Globe2 className="mt-0.5 h-5 w-5 text-brand-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Languages</p>
                        <p className="text-sm text-gray-500">English, Arabic, French, Chinese</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card border-brand-200 bg-brand-50">
                  <MessageSquare className="h-6 w-6 text-brand-600" />
                  <h3 className="mt-3 font-semibold text-gray-900">What to Expect</h3>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      Response within 24 hours
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      30-minute strategy call with an advisor
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      Custom investment report for your goals
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                      No obligation, completely free
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
