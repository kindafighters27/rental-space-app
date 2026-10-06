'use client';

import React, { useState } from 'react';

export default function V3RentalSpacePage() {
  // 予約モーダル・フォームの状態管理
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('13:00');
  const [endTime, setEndTime] = useState('19:00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [coupon, setCoupon] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  // カレンダーの表示週管理（0 = 当週, 1 = 1週先, 2 = 2週先, 3 = 3週先 ※最大1ヶ月分）
  const [weekOffset, setWeekOffset] = useState(0);

  // 動的な日付データ生成関数（今日を基準に14日間分を表示、weekOffsetで週移動）
  const generateCalendarDays = () => {
    const days = [];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const today = new Date();
    
    // 現在の週オフセット(7日単位)をベースにする
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + weekOffset * 7);

    for (let i = 0; i < 14; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(startDate.getDate() + i);

      const month = targetDate.getMonth() + 1;
      const date = targetDate.getDate();
      const dayOfWeek = dayNames[targetDate.getDay()];

      days.push({
        date: `${month}-${date} (${dayOfWeek})`,
        status: '空きあり'
      });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const handleNextWeek = () => {
    if (weekOffset < 2) { // 最大1ヶ月（約4週間）先まで制限
      setWeekOffset((prev) => prev + 1);
    }
  };

  const handlePrevWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset((prev) => prev - 1);
    }
  };

  // 各種確認モーダルの状態管理 ('kiyaku' | 'house' | null)
  const [activeModal, setActiveModal] = useState<'kiyaku' | 'house' | null>(null);

  // 時間計算と料金計算 (基本: 1~6時間 ¥12,000, 6時間超え 1時間につき +¥2,000)
  // クーポンコード 0505 記入時は延長料金無料（常に¥12,000）
  const calculatePrice = () => {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    let hours = endHour - startHour;
    if (hours <= 0) hours = 1; // 最低1時間

    let price = 12000;
    const isCouponApplied = coupon.trim() === '0505';

    if (hours > 6 && !isCouponApplied) {
      price += (hours - 6) * 2000;
    }

    return { hours, price, isCouponApplied };
  };

  const { hours, price, isCouponApplied } = calculatePrice();

  const handleOpenBooking = (dateStr: string) => {
    setSelectedDate(dateStr);
    setIsBookingOpen(true);
    setIsSubmitted(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-12">
      {/* ナビゲーションバー */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🏠</span>
            <span className="font-bold text-lg text-slate-800">COCOKARA レンタルスペース v3</span>
          </div>
          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium transition"
            >
              トップページに戻る
            </button>
            <button 
              onClick={() => alert('予約の確認・キャンセルページへ誘導します')}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium transition"
            >
              予約の確認・キャンセル
            </button>
            <button 
              onClick={() => alert('管理者ログイン画面へ移動します')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-full font-medium transition"
            >
              管理者ログイン
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* メインヒーローカード */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="mb-3">
            <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-semibold">
              募集中
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            COCOKARA レンタルスペース
          </h1>
          <p className="text-slate-600 text-sm md:text-base mb-4">
            会議や各種イベント、教室利用に最適なレンタルスペースです。
          </p>
          <div className="overflow-hidden rounded-xl bg-slate-200 aspect-video relative group">
            <img 
              src="/IMG_7072.jpg" 
              alt="COCOKARA 室内 ポーカーテーブル" 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </div>

        {/* 設備・備品・サービス */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
            設備・備品・サービス
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🚪</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">個室 (壁・扉あり)</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🚻</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">トイレ</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🔌</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">電源</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">❄️</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">エアコン (冷暖房)</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🍳</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">キッチン設備</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🍴</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">飲食可</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🍷</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">飲酒可</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">✨</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">片付けおまかせ</span>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50 hover:bg-slate-100/50 transition">
              <span className="text-2xl mb-1">🗑️</span>
              <span className="text-xs md:text-sm font-medium text-slate-700">ゴミ処理おまかせ</span>
            </div>
          </div>

          {/* 各種確認ボタン */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
            <button 
              onClick={() => setActiveModal('kiyaku')}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <span>📜</span>
              <span>利用規約を確認する</span>
            </button>
            <button 
              onClick={() => setActiveModal('house')}
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition shadow-sm"
            >
              <span>📋</span>
              <span>ハウスルールを確認する</span>
            </button>
            <a 
              href="/taishuru2026.pdf"
              target="_blank"
              rel="noreferrer"
              className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-2.5 px-4 rounded-xl text-xs md:text-sm font-medium flex items-center justify-center space-x-2 transition shadow-sm text-center"
            >
              <span>🔑</span>
              <span>入退出マニュアルを確認する</span>
            </a>
          </div>
        </div>

        {/* 利用料金プラン */}
        <div className="bg-amber-50/60 rounded-2xl p-4 md:p-6 shadow-sm border border-amber-200/60">
          <h2 className="text-lg font-bold text-slate-900 mb-3">利用料金プラン</h2>
          <ul className="space-y-1.5 text-sm md:text-base text-slate-700">
            <li>・基本料金（1〜6時間まで）: <span className="font-semibold text-slate-900">¥12,000</span></li>
            <li>・6時間超過分: 1時間につき <span className="font-semibold text-slate-900">+¥2,000</span></li>
          </ul>
        </div>

        {/* 予約空き状況 */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-slate-900">予約空き状況（最大1ヶ月先まで）</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrevWeek}
                disabled={weekOffset === 0}
                className={`border px-3 py-1 rounded-lg text-xs md:text-sm transition ${
                  weekOffset === 0 
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                    : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                }`}
              >
                &lt; 前の週
              </button>
              <button 
                onClick={handleNextWeek}
                disabled={weekOffset >= 2}
                className={`border px-3 py-1 rounded-lg text-xs md:text-sm transition ${
                  weekOffset >= 2 
                    ? 'border-slate-200 text-slate-300 cursor-not-allowed' 
                    : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                }`}
              >
                次の週 &gt;
              </button>
            </div>
          </div>

          {/* カレンダー グリッド */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {calendarDays.map((item, idx) => (
              <div key={idx} className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-2.5 text-center flex flex-col justify-between hover:bg-emerald-50/60 transition">
                <span className="text-xs font-bold text-slate-700 mb-1.5 block">{item.date}</span>
                <button
                  onClick={() => handleOpenBooking(item.date)}
                  className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold py-1.5 px-2 rounded-lg transition"
                >
                  {item.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* アクセス・所在地 */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 mb-3">アクセス・所在地</h2>
          <p className="text-xs md:text-sm text-slate-700 mb-4 flex items-center gap-1.5">
            <span className="text-rose-500">📍</span>
            <span>〒570-0012 大阪府守口市金田町2-1-9 COCOKARA</span>
          </p>
          
          <div className="rounded-xl overflow-hidden border border-slate-200 relative h-64 bg-slate-100">
            <div className="absolute top-3 left-3 z-10">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=%E3%83%AF%E3%83%B3%E3%82%B0%E3%83%A9%E3%83%B3%E3%83%89+%E5%A4%A7%E9%98%AA%E府%E5%AE%88%E5%8F%A3%E5%B8%82%E9%87%91%E7%94%B0%E7%94%BA2-1-9" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white text-emerald-700 hover:bg-slate-50 border border-slate-200 shadow-sm text-xs font-bold py-1.5 px-3 rounded-lg flex items-center space-x-1 transition"
              >
                <span>マップで開く</span>
                <span>↗</span>
              </a>
            </div>
            <iframe
              title="COCOKARA Map"
              src="https://maps.google.com/maps?q=%E5%A4%A7%E9%98%AA%E府%E5%AE%88%E5%8F%A3%E5%B8%82%E9%87%91%E7%94%B0%E7%94%BA2-1-9&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </main>

      {/* 各種確認モーダル（利用規約 / ハウスルール） */}
      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {activeModal === 'kiyaku' && (
                  <>
                    <span>📜</span>
                    <span>COCOKARA 利用規約</span>
                  </>
                )}
                {activeModal === 'house' && (
                  <>
                    <span>📋</span>
                    <span>COCOKARA ハウスルール</span>
                  </>
                )}
              </h3>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* モーダル本文 */}
            <div className="text-sm text-slate-700 space-y-4 leading-relaxed overflow-y-auto pr-2">
              {/* 利用規約 */}
              {activeModal === 'kiyaku' && (
                <>
                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">第1条 (貸出備品の取り扱いおよび安全管理)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-600">
                      <li>室内に設置されたポーカー天板等の備品は、利用者自身の責任において設置・使用・収納を行うものとします。</li>
                      <li>天板の設置および収納作業は、怪我や事故防止のため、必ず大人2人以上で行ってください。</li>
                      <li>利用者の不注意 (単独作業による落下、無理な取扱等) により生じた人的被害・怪我について、当スペースは一切の責任を負いません。</li>
                    </ol>
                  </section>

                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">第2条 (損害賠償および原状回復)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-600">
                      <li>備品の落下や誤った使用により、壁、床、備品等を破損・汚損した場合、修繕費用および営業補償代金を請求いたします。</li>
                      <li>利用後は必ずポーカー天板を取り外し、指定の位置に収納した上で退室してください (原状回復の徹底)。退室時に原状回復がなされていない場合、緊急対応費として5,000円を申し受ける場合があります。</li>
                    </ol>
                  </section>

                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">第3条 (賭博行為の禁止)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-600">
                      <li>当スペース内での金銭、物品、その他財産上の利益を賭けた賭博行為は一切禁止いたします。万が一発覚した場合は即座に通報し、今後の利用を永久に停止します。</li>
                    </ol>
                  </section>

                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">第4条 (防犯カメラの設置および映像の取り扱い)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-600">
                      <li>防犯および安全管理上の理由から、スペース内 (※プライバシーに配慮した範囲) に防犯カメラを設置し、常時撮影・録画を行っています。利用者はこれに同意するものとします。</li>
                      <li>当スペース内でトラブル、事故、法令違反行為、その他緊急事態が発生した場合、または警察等捜査機関から法令に基づく任意の開示・提出要請を受けた場合、保存している録画映像を警察等の公的機関へ任意に提出することがあります。</li>
                    </ol>
                  </section>
                </>
              )}

              {/* ハウスルール */}
              {activeModal === 'house' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 01</div>
                    <div className="font-bold text-slate-900 mb-1">騒音注意</div>
                    <p className="text-xs md:text-sm text-slate-600">近隣住民のご迷惑になりますので、出入りの際に静かに入店・退室してください。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 02</div>
                    <div className="font-bold text-slate-900 mb-1">喫煙ルール</div>
                    <p className="text-xs md:text-sm text-slate-600">紙巻きタバコは必ず指定の場所での喫煙お願いいたします。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 03</div>
                    <div className="font-bold text-slate-900 mb-1">飲食可能</div>
                    <p className="text-xs md:text-sm text-slate-600">持ち込みは自由です。ポーカー台や機器を汚さないようご注意ください。汚損および破損された場合は、交換費用・清掃費用を実費請求する場合がございます。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 04</div>
                    <div className="font-bold text-slate-900 mb-1">退室時の片付け</div>
                    <p className="text-xs md:text-sm text-slate-600">ご利用後はポーカーチップやカード、備品をもとの位置へお戻しください。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 05</div>
                    <div className="font-bold text-slate-900 mb-1">ゴミ処理</div>
                    <p className="text-xs md:text-sm text-slate-600">ゴミは指定のゴミ箱へ分別して捨てていただくか、お持ち帰りをお願いします。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 06</div>
                    <div className="font-bold text-slate-900 mb-1">時間厳守</div>
                    <p className="text-xs md:text-sm text-slate-600">準備・片付けを含めた時間枠でのご予約となります。退室時は厳守してください。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 07</div>
                    <div className="font-bold text-slate-900 mb-1">賭博行為の禁止</div>
                    <p className="text-xs md:text-sm text-slate-600">現金や金品を賭けた賭博行為は固く禁止いたします。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 08</div>
                    <div className="font-bold text-slate-900 mb-1">防犯カメラ</div>
                    <p className="text-xs md:text-sm text-slate-600">防犯およびトラブル防止のため、室内に監視カメラを設置・録画をしております。また、警察等から任意での提出を求められた場合、提出することがあります。</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 09</div>
                    <div className="font-bold text-slate-900 mb-1">違法駐車</div>
                    <p className="text-xs md:text-sm text-slate-600">店舗前や付近の道路への路上駐車、および近隣店舗・民家の敷地・駐車場への無断駐車は固くお断りします。</p>
                  </div>
                </div>
              )}
            </div>

            {/* モーダル下部（PDFリンク・閉じるボタン） */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-white">
              {activeModal === 'kiyaku' && (
                <a 
                  href="/kiyaku2026.pdf" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>📄 PDFで表示・ダウンロード</span>
                  <span>↗</span>
                </a>
              )}
              {activeModal === 'house' && (
                <a 
                  href="/hausururu2026_COCOKARA.pdf" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  <span>📄 PDFで表示・ダウンロード</span>
                  <span>↗</span>
                </a>
              )}
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-xl text-sm transition ml-auto"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 予約入力モーダル */}
      {isBookingOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100">
            {!isSubmitted ? (
              <>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900">
                    ご予約のお申し込み ({selectedDate})
                  </h3>
                  <button 
                    onClick={() => setIsBookingOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* お名前 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      代表者名 <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="山田 太郎"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* メールアドレス */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      メールアドレス <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="example@cocokara.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 電話番号（任意） */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      placeholder="090-0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  {/* 利用時間選択 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">開始時間</label>
                      <select
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {Array.from({ length: 15 }, (_, i) => i + 9).map((h) => (
                          <option key={h} value={`${h}:00`}>{`${h}:00`}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">終了時間</label>
                      <select
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {Array.from({ length: 21 }, (_, i) => i + 10).map((h) => (
                          <option key={h} value={`${h}:00`}>{`${h}:00`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* クーポンコード */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      クーポンコード（お持ちの方）
                    </label>
                    <input
                      type="text"
                      placeholder="例: 0505"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>

                  {/* 備考・ご要望 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      備考・ご要望
                    </label>
                    <textarea
                      rows={2}
                      placeholder="ご質問や事前のご要望等があればご入力ください"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                  </div>

                  {/* 料金リアルタイム計算枠 */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>ご利用予定時間:</span>
                      <span className="font-medium text-slate-800">{hours} 時間</span>
                    </div>
                    {isCouponApplied && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>特別クーポン (0505) 適用:</span>
                        <span>延長料金サービス (6時間料金適用)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>お支払合計金額:</span>
                      <span className="text-emerald-700 text-lg">¥{price.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 予約確定ボタン */}
                  <div>
                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm"
                    >
                      予約を確定する
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* 完了表示 */
              <div className="text-center py-6 space-y-4">
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-bold text-slate-900">ご予約を受け付けました</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {name} 様<br />
                  ご登録いただいたメールアドレス（{email}）宛に<br />
                  予約確認メールをお送りしました。
                </p>
                <button
                  onClick={() => setIsBookingOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}