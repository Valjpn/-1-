import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { MapPin, Home, Utensils, DollarSign, Plane, Info, Share2, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type City = 'sydney' | 'vancouver' | 'melbourne' | 'toronto';
type Accommodation = 'sharehouse' | 'hostel' | 'homestay';
type Diet = 'cook' | 'eatout_some' | 'eatout_all';

const CITIES: Record<City, { name: string; currency: string; defaultRate: number; rent: Record<Accommodation, number> }> = {
  sydney: { name: 'シドニー', currency: 'AUD', defaultRate: 111, rent: { sharehouse: 400, hostel: 350, homestay: 450 } },
  melbourne: { name: 'メルボルン', currency: 'AUD', defaultRate: 111, rent: { sharehouse: 350, hostel: 300, homestay: 400 } },
  vancouver: { name: 'バンクーバー', currency: 'CAD', defaultRate: 116, rent: { sharehouse: 350, hostel: 300, homestay: 400 } },
  toronto: { name: 'トロント', currency: 'CAD', defaultRate: 116, rent: { sharehouse: 380, hostel: 320, homestay: 420 } },
};

const ACCOMMODATIONS: Record<Accommodation, { name: string; bondWeeks: number }> = {
  sharehouse: { name: 'シェアハウス', bondWeeks: 4 },
  hostel: { name: 'ホステル', bondWeeks: 0 },
  homestay: { name: 'ホームステイ', bondWeeks: 0 },
};

const DIETS: Record<Diet, { name: string; weeklyCost: number }> = {
  cook: { name: '完全自炊', weeklyCost: 125 },
  eatout_some: { name: '週2〜3回外食', weeklyCost: 200 },
  eatout_all: { name: '毎日外食', weeklyCost: 350 },
};

const MISC_MONTHLY_COST = 175; // Transport & Communication

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const FAQS = [
  {
    question: "ワーホリの初期費用は最低いくら必要ですか？",
    answer: "渡航費や保険料、ビザ代に加えて、現地での最初の1ヶ月の生活費として約25〜35万円（都市や滞在方法により変動）が必要です。余裕を持って50万円以上準備することをおすすめします。"
  },
  {
    question: "シェアハウスとホステル、最初はどちらが良いですか？",
    answer: "到着直後の1〜2週間はホステルやバックパッカーズに滞在し、その間に現地のシェアハウスを内見して決めるのが一般的です。シェアハウス入居時には通常2〜4週間分のボンド（敷金）が必要です。"
  },
  {
    question: "オーストラリアとカナダ、費用の違いは？",
    answer: "2026年現在、家賃相場はシドニーが最も高く、次いでトロント、メルボルン、バンクーバーの順になる傾向があります。ただし、為替レートによって日本円での負担額は大きく変動します。"
  },
  {
    question: "ボンド（Bond）とは何ですか？",
    answer: "物件を借りる際に、大家さんや管理会社に預ける「保証金（敷金）」のことです。入居中に家賃の滞納があったり、退去時に部屋の修理が必要になったりした場合の「担保」として機能します。通常、家賃の4週間分程度を支払いますが、退去時に部屋をきれいに使い、家賃の未払いがなければ、原則として全額返金されます。"
  }
];

export default function App() {
  const [city, setCity] = useState<City>('sydney');
  const [accommodation, setAccommodation] = useState<Accommodation>('sharehouse');
  const [diet, setDiet] = useState<Diet>('cook');
  const [customRate, setCustomRate] = useState<string>('');

  const currentCity = CITIES[city];
  const rate = customRate !== '' ? parseFloat(customRate) || currentCity.defaultRate : currentCity.defaultRate;

  const results = useMemo(() => {
    const weeklyRent = currentCity.rent[accommodation];
    const monthlyRent = weeklyRent * 4;
    const bond = weeklyRent * ACCOMMODATIONS[accommodation].bondWeeks;
    const monthlyFood = DIETS[diet].weeklyCost * 4;
    const misc = MISC_MONTHLY_COST;

    const totalLocal = monthlyRent + bond + monthlyFood + misc;
    const totalJpy = totalLocal * rate;

    const data = [
      { name: '家賃 (4週)', value: monthlyRent, local: monthlyRent, jpy: monthlyRent * rate },
      { name: 'ボンド (敷金)', value: bond, local: bond, jpy: bond * rate },
      { name: '食費 (4週)', value: monthlyFood, local: monthlyFood, jpy: monthlyFood * rate },
      { name: '交通・通信費', value: misc, local: misc, jpy: misc * rate },
    ].filter(item => item.value > 0);

    return {
      totalLocal,
      totalJpy,
      data,
      currency: currentCity.currency,
    };
  }, [city, accommodation, diet, rate, currentCity]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  const handleShare = async () => {
    const shareText = `2026年最新！${currentCity.name}のワーホリ最初の1ヶ月にかかる費用は【${Math.round(results.totalJpy).toLocaleString()}円】でした！\n\n#ワーホリ #ワーキングホリデー #${currentCity.name}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ワーホリ初月費用シュミレーター',
          text: shareText,
          url: window.location.href,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.log('Share failed, falling back to Twitter', err);
          window.open(twitterUrl, '_blank');
        } else {
          console.log('Share canceled by user');
        }
      }
    } else {
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-center">
          <Plane className="w-5 h-5 text-blue-600 mr-2" />
          <h1 className="text-lg font-bold tracking-tight">ワーホリ初月費用シュミレーター</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        {/* Top Conclusion / Result Card */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-6 text-center text-white relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-200 text-sm font-bold mb-2 tracking-wider">2026年最新</p>
            <h2 className="text-xl font-bold mb-4 leading-relaxed">
              {currentCity.name}のワーホリ初月費用は<br/>
              <span className="text-4xl md:text-5xl font-extrabold text-yellow-300 inline-block mt-1 drop-shadow-md">
                {Math.round(results.totalJpy).toLocaleString()}円〜
              </span>
            </h2>
            <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium">
              現地通貨: {results.totalLocal.toLocaleString()} {results.currency}
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-400 opacity-20 rounded-full blur-2xl pointer-events-none"></div>
        </section>

        {/* Chart */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">費用の内訳</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={results.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {results.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} ${results.currency}`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-2">
            {results.data.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <div className="font-medium">
                  {item.local.toLocaleString()} {results.currency} <span className="text-slate-400 text-xs ml-1">(¥{Math.round(item.jpy).toLocaleString()})</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inputs */}
        <section className="space-y-6">
          {/* City */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-bold text-slate-800">
              <MapPin className="w-4 h-4 mr-2 text-blue-500" />
              都市を選択
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(CITIES) as [City, typeof CITIES[City]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => {
                    setCity(key);
                    setCustomRate(''); // Reset custom rate when city changes
                  }}
                  className={cn(
                    "py-3 px-4 rounded-xl text-sm font-medium transition-all border",
                    city === key 
                      ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {data.name}
                </button>
              ))}
            </div>
          </div>

          {/* Accommodation */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-bold text-slate-800">
              <Home className="w-4 h-4 mr-2 text-emerald-500" />
              宿泊タイプ
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(ACCOMMODATIONS) as [Accommodation, typeof ACCOMMODATIONS[Accommodation]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setAccommodation(key)}
                  className={cn(
                    "py-3 px-4 rounded-xl text-sm font-medium transition-all border text-left flex justify-between items-center",
                    accommodation === key 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span>{data.name}</span>
                  <span className="text-xs opacity-70">
                    {key === 'sharehouse' ? 'ボンド必要' : 'ボンド不要'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Diet */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-bold text-slate-800">
              <Utensils className="w-4 h-4 mr-2 text-amber-500" />
              食生活
            </label>
            <div className="grid grid-cols-1 gap-2">
              {(Object.entries(DIETS) as [Diet, typeof DIETS[Diet]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setDiet(key)}
                  className={cn(
                    "py-3 px-4 rounded-xl text-sm font-medium transition-all border text-left",
                    diet === key 
                      ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {data.name}
                </button>
              ))}
            </div>
          </div>

          {/* Exchange Rate */}
          <div className="space-y-3">
            <label className="flex items-center text-sm font-bold text-slate-800">
              <DollarSign className="w-4 h-4 mr-2 text-slate-500" />
              換算レート (1 {currentCity.currency} = ? 円)
            </label>
            <div className="relative">
              <input
                type="number"
                value={customRate !== '' ? customRate : currentCity.defaultRate}
                onChange={(e) => setCustomRate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={`${currentCity.defaultRate}`}
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-slate-400 text-sm">円</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 flex items-start">
              <Info className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              ※この数値は2026年3月時点の目安です。実際の費用はライフスタイルや時期により変動します。
            </p>
          </div>
        </section>

        {/* Share Button */}
        <section>
          <button
            onClick={handleShare}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center transition-all shadow-md active:scale-[0.98]"
          >
            <Share2 className="w-5 h-5 mr-2" />
            結果をシェアする
          </button>
        </section>

        <hr className="border-slate-200" />

        {/* FAQ Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 text-center mb-6">よくある質問（FAQ）</h3>
          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details key={index} className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
                <summary className="flex justify-between items-center font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden p-4 text-slate-800">
                  <span className="pr-4">{faq.question}</span>
                  <span className="transition group-open:rotate-180 flex-shrink-0">
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </span>
                </summary>
                <div className="text-slate-600 p-4 pt-0 text-sm leading-relaxed border-t border-slate-100 mt-2">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
