import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { MapPin, Utensils, DollarSign, Plane, Info, Share2, ChevronDown } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type City = 'sydney' | 'vancouver' | 'melbourne' | 'toronto';
type Diet = 'eatout_all' | 'eatout_lunch' | 'eatout_breakfast' | 'eatout_dinner' | 'cook';

const CITIES: Record<City, { name: string; currency: string; defaultRate: number; housingInitial: number; misc: number }> = {
  sydney: { name: 'シドニー', currency: 'AUD', defaultRate: 112.3, housingInitial: 1260 + 2580, misc: 340 },
  melbourne: { name: 'メルボルン', currency: 'AUD', defaultRate: 112.3, housingInitial: 840 + 1920, misc: 320 },
  vancouver: { name: 'バンクーバー', currency: 'CAD', defaultRate: 116.3, housingInitial: 980 + 1300, misc: 310 },
  toronto: { name: 'トロント', currency: 'CAD', defaultRate: 116.3, housingInitial: 910 + 2100, misc: 320 },
};

const DIETS: Record<Diet, { name: string; description: string }> = {
  cook: { name: '毎日3食「自炊」', description: 'もっとも節約' },
  eatout_breakfast: { name: '朝食のみ外食', description: '他2食は自炊' },
  eatout_lunch: { name: 'ランチのみ外食', description: '他2食は自炊' },
  eatout_dinner: { name: 'ディナーのみ外食', description: '他2食は自炊' },
  eatout_all: { name: '毎日3食すべて外食', description: '贅沢プラン' },
};

const CITY_DIET_COSTS: Record<City, Record<Diet, number>> = {
  sydney: { cook: 550, eatout_breakfast: 1150, eatout_lunch: 1350, eatout_dinner: 1950, eatout_all: 3027 },
  melbourne: { cook: 500, eatout_breakfast: 1040, eatout_lunch: 1200, eatout_dinner: 1740, eatout_all: 2720 },
  toronto: { cook: 520, eatout_breakfast: 1080, eatout_lunch: 1230, eatout_dinner: 1740, eatout_all: 2698 },
  vancouver: { cook: 500, eatout_breakfast: 1020, eatout_lunch: 1160, eatout_dinner: 1710, eatout_all: 2551 },
};

const MISC_MONTHLY_COST = 175; // Transport & Communication

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const FAQS = [
  {
    category: "💰 お金・予算について",
    question: "Q1. 結局、渡航前にいくら貯金があれば安心ですか？",
    answer: "最低でも100万円、余裕を持つなら130万円以上を推奨します。\n2026年現在の円安状況では、渡航前の準備（航空券・保険・ビザ）で約40万円、現地の初月費用（宿代・ボンド等）で約45万円が飛ぶように消えます。仕事が決まるまでの「無収入期間」を耐え抜くための予備費が絶対に必要です。"
  },
  {
    category: "💰 お金・予算について",
    question: "Q2. なぜ「2週間分の宿代」と「シェアハウス費用」を両方払うのですか？",
    answer: "「部屋探しのための滞在費」と「入居のためのセットアップ費用」が重なるからです。\nシドニー等では到着後に内見をしてから契約するため、最初の2週間はホステル等の宿泊費がかかります。そして契約時（多くは2週目）に、**「ボンド（敷金4週分）」＋「前家賃（2週分）」をまとめて支払うため、「2週間分の宿泊費 ＋ 6週間分の家賃相当」**が、初月の30日間だけで一気に出ていくことになります。"
  },
  {
    category: "💰 お金・予算について",
    question: "Q3. ボンド（Bond / Deposit）は必ず返ってきますか？",
    answer: "基本的には返ってきますが、トラブルも多いです。\n退去時に部屋の破損や汚れがなければ全額返金されます。ただし、悪質なオーナーが「掃除が不十分」などと言い掛かりをつけて返金しぶるケースもあります。入居初日に**「部屋の状態を写真・動画で全て記録しておく」**ことが、2026年のワーホリ界隈でも最強の防御策です。"
  },
  {
    category: "🏠 住まい・宿泊について",
    question: "Q4. 日本にいる間にシェアハウスを契約してもいいですか？",
    answer: "避けるべきです。詐欺に遭うリスクが非常に高いです。\n「綺麗な部屋の写真を送らせてデポジットを振り込ませる」という古典的な詐欺が今も横行しています。まずはホステル等に2週間滞在し、自分の目で「水回り・同居人の雰囲気・治安」を確認してから契約しましょう。"
  },
  {
    category: "🏠 住まい・宿泊について",
    question: "Q5. ホステルの宿泊費が1泊1万円もするのは本当？",
    answer: "はい、主要都市の中心部ではもはや「定価」です。\n2026年現在、慢性的な宿不足と最低賃金の上昇により、ドミトリー（相部屋）でも1泊$85〜$100（約9,500円〜11,200円）が相場です。費用を抑えるには、中心部から電車で20分ほど離れたエリアを狙うのが現実的です。"
  }
];

export default function App() {
  const [city, setCity] = useState<City>('sydney');
  const [diet, setDiet] = useState<Diet>('cook');
  const [customRate, setCustomRate] = useState<string>('');

  const currentCity = CITIES[city];
  const rate = customRate !== '' ? parseFloat(customRate) || currentCity.defaultRate : currentCity.defaultRate;

  const results = useMemo(() => {
    const housing = currentCity.housingInitial;
    const monthlyFood = CITY_DIET_COSTS[city][diet];
    const misc = currentCity.misc;

    const totalLocal = housing + monthlyFood + misc;
    const totalJpy = totalLocal * rate;

    const data = [
      { name: '住居初期費用 (宿2週+シェアハウス)', value: housing, local: housing, jpy: housing * rate },
      { name: '食費 (1ヶ月)', value: monthlyFood, local: monthlyFood, jpy: monthlyFood * rate },
      { name: '交通・通信・雑費', value: misc, local: misc, jpy: misc * rate },
    ].filter(item => item.value > 0);

    return {
      totalLocal,
      totalJpy,
      data,
      currency: currentCity.currency,
    };
  }, [city, diet, rate, currentCity]);

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
            <p className="text-blue-200 text-xs font-bold mb-2 tracking-widest uppercase">2026年最新シミュレーション</p>
            <h2 className="text-lg font-bold mb-4 leading-snug">
              {currentCity.name}のワーホリ初月費用は<br/>
              <span className="text-4xl md:text-5xl font-black text-yellow-300 inline-block mt-2 drop-shadow-lg">
                約 {(results.totalJpy / 10000).toFixed(1)} 万円〜
              </span>
            </h2>
            <div className="inline-flex items-center bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-xs font-semibold border border-white/20">
              現地通貨合計: {Math.round(results.totalLocal).toLocaleString()} {results.currency}
            </div>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        </section>

        {/* Chart */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-6 text-center">費用の内訳（目安）</h3>
          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={results.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {results.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()} ${results.currency}`, '']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text for Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
              <span className="text-lg font-black text-slate-800 leading-none">
                {Math.round(results.totalLocal).toLocaleString()}
              </span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
            {results.data.map((item, idx) => (
              <div key={item.name} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">{item.name}</span>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-xs font-black text-slate-800">
                    {item.local.toLocaleString()} {results.currency}
                  </div>
                  <div className="text-[10px] text-slate-400 font-bold">
                    ¥{Math.round(item.jpy).toLocaleString()}
                  </div>
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

          {/* Diet */}
          <div className="space-y-4">
            <label className="flex items-center text-sm font-bold text-slate-800">
              <Utensils className="w-4 h-4 mr-2 text-amber-500" />
              食生活のスタイル (1ヶ月30日分)
            </label>
            <div className="grid grid-cols-1 gap-2.5">
              {(Object.entries(DIETS) as [Diet, typeof DIETS[Diet]][]).map(([key, data]) => (
                <button
                  key={key}
                  onClick={() => setDiet(key)}
                  className={cn(
                    "py-3.5 px-4 rounded-xl text-sm font-bold transition-all border text-left flex flex-col",
                    diet === key 
                      ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm ring-1 ring-amber-300" 
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <span>{data.name}</span>
                  <span className={cn(
                    "text-[10px] font-medium mt-0.5",
                    diet === key ? "text-amber-600" : "text-slate-400"
                  )}>
                    ({data.description})
                  </span>
                </button>
              ))}
            </div>
            <div className="bg-slate-100 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                ※カナダ（トロント・バンクーバー）は、税金＋チップ（15〜20%）込みの実質支払額で算出しています。
              </p>
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

        {/* Cost Breakdown Explanation */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">交通費・通信費・雑費の内訳</h3>
          <div className="space-y-4 text-xs leading-relaxed text-slate-600">
            <div>
              <p className="font-bold text-slate-800 mb-1">● 公共交通費 (月 1.7万 〜 2.2万円)</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>豪州: シドニーやメルボルンは週の支払額に上限(Cap)があり、毎日利用すると月2万円弱で安定します。</li>
                <li>カナダ: 1ヶ月の定期券(Monthly Pass)が一般的。バンクーバーはゾーン制、トロントは一律ですが、いずれも1.7万〜1.9万円ほど。</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">● スマホ通信費 (月 4,500円 〜 7,000円)</p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>オーストラリア: 競争が激しく、40〜50GBプランが$40前後で見つかります。</li>
                <li>カナダ: 通信費が世界的に高い。2026年現在、安定した速度と容量を求めると$60(約7,000円)程度は覚悟が必要です。</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-1">● 日用雑費 (月 約 1.1万円)</p>
              <p className="pl-1">シャンプー、洗剤、消耗品、常備薬など。どの都市も物価高の影響で、月$100程度は自然と消えていきます。</p>
            </div>
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
        <section className="space-y-6">
          <h3 className="text-lg font-bold text-slate-800 text-center mb-2">2026年 ワーホリ費用と生活のリアル：FAQ</h3>
          <div className="space-y-8">
            {/* Group by categories manually for better layout */}
            {['💰 お金・予算について', '🏠 住まい・宿泊について'].map(cat => (
              <div key={cat} className="space-y-3">
                <h4 className="text-sm font-bold text-slate-500 px-1">{cat}</h4>
                {FAQS.filter(f => f.category === cat).map((faq, index) => (
                  <details key={index} className="group bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <summary className="flex justify-between items-center font-medium cursor-pointer list-none [&::-webkit-details-marker]:hidden p-4 text-slate-800">
                      <span className="pr-4">{faq.question}</span>
                      <span className="transition group-open:rotate-180 flex-shrink-0">
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </span>
                    </summary>
                    <div className="text-slate-600 p-4 pt-0 text-sm leading-relaxed border-t border-slate-100 mt-2 whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
