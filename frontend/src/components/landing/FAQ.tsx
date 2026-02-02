import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "كيف يحدد الذكاء الاصطناعي أن الصفقة 'مميزة'؟",
    answer: "يقارن خوارزميتنا سعر الإعلان بمتوسطات السوق للعقارات المشابهة في نفس الحي. الصفقات المسعرة بأقل من السوق بـ 15% أو أكثر يتم وسمها كـ 'صفقات مميزة'، بينما التي بأقل من 10-15% يتم وسمها كـ 'صفقات جيدة'. نأخذ أيضاً في الاعتبار عائد الإيجار المحتمل والوقت في السوق."
  },
  {
    question: "كم مرة يتم تحديث البيانات؟",
    answer: "يقوم نظامنا بالمسح كل 4 ساعات، مراقباً sa.aqar.fm للإعلانات الجديدة في جميع المدن التي نغطيها."
  },
  {
    question: "هل يمكنني الحصول على تنبيهات لمعايير محددة؟",
    answer: "نعم! يمكنك إنشاء حساب مجاني ثم إنشاء عمليات بحث محفوظة مع فلاتر مخصصة (المدينة، الحي، نطاق السعر، نوع العقار، إلخ) واستلام تنبيهات بالبريد الإلكتروني أو تلغرام عند العثور على صفقات جديدة مطابقة."
  },
  {
    question: "هل معلومات الاتصال دقيقة؟",
    answer: "نستخرج معلومات الاتصال مباشرة من الإعلانات المصدر. بينما نقوم بالتحقق من تنسيقات أرقام الهواتف، نوصي بالتحقق من التفاصيل قبل أي التزامات."
  },
  {
    question: "ما المدن التي تغطونها؟",
    answer: "نغطي حالياً جميع المدن السعودية الرئيسية بما فيها الرياض، جدة، مكة، المدينة، الدمام، الخبر، الطائف، أبها، خميس مشيط، بريدة، تبوك، حائل، نجران، الجبيل، والقطيف."
  },
  {
    question: "هل الخدمة مجانية؟",
    answer: "نعم! KingdomScout مجاني 100%. جميع الميزات متاحة للجميع دون أي رسوم اشتراك."
  },
];

export function FAQ() {
  return (
    <section className="py-20 bg-gray-50" id="faq">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            الأسئلة الشائعة
          </h2>
          <p className="text-gray-600">
            كل ما تحتاج معرفته عن KingdomScout.
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
