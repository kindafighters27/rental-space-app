'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PokerV2BookingPage() {
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('30:00');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('kindafighters27@gmail.com');
  const [coupon, setCoupon] = useState('');

  // 開始時間の選択肢を生成 (9:00 から 23:00 まで)
  const startTimeOptions = [];
  for (let min = 9 * 60; min <= 23 * 60; min += 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const hourStr = String(h).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    
    let label = '';
    if (h === 0) {
      label = `午前12時`;
    } else if (h < 12) {
      label = `午前${h}時`;
    } else if (h === 12) {
      label = `午後12時`;
    } else {
      label = `午後${h - 12}時`;
    }

    startTimeOptions.push({ value: `${hourStr}:${minStr}`, label });
  }

  // 終了時間の選択肢を生成 (21:00 から 30:00 まで)
  const endTimeOptions = [];
  for (let min = 21 * 60; min <= 30 * 60; min += 60) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    const hourStr = String(h).padStart(2, '0');
    const minStr = String(m).padStart(2, '0');
    
    let label = '';
    if (h < 24) {
      label = `午後${h - 12}時`;
    } else {
      const nextH = h - 24;
      label = `午前${h}時（翌朝${String(nextH).padStart(2, '0')}時）`;
    }

    endTimeOptions.push({ value: `${hourStr}:${minStr}`, label });
  }

  // 特別クーポンの適用判定
  const allowedNames = [
    '豊臣秀吉',
    '織田信長',
    '徳川家康',
    '前田慶次',
    'ラオウ',
    'しょうごさん',
    '哲平くん',
  ];
  const isSpecialDiscount = allowedNames.includes(userName.trim()) && coupon.trim() === '0505';

  const displayPrice = isSpecialDiscount ? '¥12,000' : '¥28,000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bookingData = {
      date: '2026-10-04',
      user_name: userName.trim() || 'レンタルスペース',
      user_email: email,
      start_time: startTime,
      end_time: endTime,
    };

    // 1. Supabaseのデータベースに保存
    try {
      const { error } = await supabase.from('poker_bookings').insert([bookingData]);
      if (error) {
        console.error('Supabase insert error:', error.message);
        alert('保存に失敗しました: ' + error.message);
        return;
      }
    } catch (err) {
      console.error('Failed to save booking to Supabase', err);
      return;
    }

    // 2. 従来のlocalStorageにも保存（必要に応じて）
    try {
      const existingBookings = JSON.parse(localStorage.getItem('cocokara_bookings') || '[]');
      const newBooking = {
        id: Date.now().toString(),
        space: 'COCOKARA メインルーム',
        name: bookingData.user_name,
        email: bookingData.user_email,
        date: bookingData.date,
        time: `${startTime} - ${endTime}`,
        status: '確定',
        amount: displayPrice,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('cocokara_bookings', JSON.stringify([newBooking, ...existingBookings]));
    } catch (err) {
      console.error('Failed to save booking to localStorage', err);
    }

    alert('ご予約を受け付けました。');
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          {/* TOPページへ戻るボタン */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-gray-300"
          >
            <span>🏠</span> TOPに戻る
          </Link>

          <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <span>♠️</span> COCOKARA レンタルスペース V2
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
          選択中: COCOKARA予約フォーム
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
          <h1 className="text-xl font-bold text-gray-900 border-b pb-4">
            ご予約フォーム (選択中: 2026-10-04)
          </h1>

          {/* 開始時間・終了時間 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">開始時間</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {startTimeOptions.map((opt) => (
                  <option key={`start-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700">終了時間</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
              >
                {endTimeOptions.map((opt) => (
                  <option key={`end-${opt.value}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* お名前 */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">お名前</label>
            <input
              type="text"
              placeholder="レンタルスペース"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* メールアドレス */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* クーポンコード */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700">クーポンコード（お持ちの方）</label>
            <input
              type="text"
              placeholder="クーポンコードを入力"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* お支払い予定金額 */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-sm font-bold text-emerald-800">お支払い予定金額: {displayPrice}</div>
          </div>

          {/* 予約確定ボタン */}
          <div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow transition"
            >
              予約を確定する
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}