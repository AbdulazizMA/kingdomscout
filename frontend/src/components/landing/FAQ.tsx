'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FAQ() {
  const t = useTranslations('faq');

  const faqs = [
    { question: t('q1'), answer: t('a1') },
    { question: t('q2'), answer: t('a2') },
    { question: t('q3'), answer: t('a3') },
    { question: t('q4'), answer: t('a4') },
    { question: t('q5'), answer: t('a5') },
    { question: t('q6'), answer: t('a6') },
  ];

  return (
    <section className="py-20 bg-gray-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group bg-white rounded-lg border open:ring-2 open:ring-primary/20"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="font-medium text-gray-900">{faq.question}</span>
                <ChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition" />
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
