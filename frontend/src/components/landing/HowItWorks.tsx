import { Search, Zap, Bell } from 'lucide-react';

const steps = [
  {
    icon: Search,
    title: 'نراقب السوق',
    description: 'يقوم نظامنا بمراقبة sa.aqar.fm كل 4 ساعات في أكثر من 15 مدينة سعودية، ويسجل كل إعلان جديد.',
  },
  {
    icon: Zap,
    title: 'الذكاء الاصطناعي يحلل كل صفقة',
    description: 'يقوم خوارزميتنا بحساب متوسطات السوق، وتقييم الاستثمارات (1-100)، وتحديد الصفقات الأقل من السوق بـ 10% أو أكثر.',
  },
  {
    icon: Bell,
    title: 'تحصل على تنبيهات فورية',
    description: 'استلم إشعارات بالعقارات الجديدة المطابقة لمعاييرك عبر البريد الإلكتروني أو تلغرام.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            كيف يعمل
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            العثور على صفقات رائعة لا يجب أن يستغرق ساعات من البحث اليدوي. 
            نظامنا الآلي يقوم بالعمل الشاق حتى تتمكن أنت من التركيز على إتمام الصفقات.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 right-1/2 w-full h-0.5 bg-gray-200" />
              )}

              <div className="relative bg-white rounded-xl p-8 text-center border hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8" />
                </div>

                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mx-auto mb-4">
                  {index + 1}
                </div>

                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
