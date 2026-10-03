'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const getWeekDates = (offset: number) => {
    const dates = [];
    const today = new Date();
    today.setDate(today.getDate() + offset * 7);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
      dates.push({
        dateStr: `${month}-${day} (${dayOfWeek})`,
        status: '空きあり',
      });
    }
    return dates;
  };

  const weekDates1 = getWeekDates(0 + currentWeekOffset * 2);
  const weekDates2 = getWeekDates(1 + currentWeekOffset * 2);

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white border-b sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <span>🏠</span> COCOKARA レンタルスペース
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          >
            トップページに戻る
          </Link>
          <Link
            href="/poker-v2/book"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition"
          >
            予約の確認・キャンセル
          </Link>
          <Link
            href="/poker-v2/admin"
            className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
          >
            管理者ログイン
          </Link>
        </div>
      </header>

      {/* メインコンテンツエリア */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* スペース概要カード */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
          <div className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
            募集中
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              COCOKARA レンタルスペース
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              会議や各種イベント、教室利用に最適なレンタルスペースです。
            </p>
          </div>

          {/* 写真表示 */}
          <div className="rounded-xl overflow-hidden border shadow-sm">
            <img
              src="/space1.JPG"
              alt="COCOKARA レンタルスペース ポーカー台"
              className="w-full h-auto object-cover max-h-[450px]"
            />
          </div>
        </div>

        {/* 設備・備品・サービス */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
            設備・備品・サービス
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              { icon: '🚪', label: '個室 (壁・扉あり)' },
              { icon: '🚻', label: 'トイレ' },
              { icon: '🔌', label: '電源' },
              { icon: '❄️', label: 'エアコン (冷暖房)' },
              { icon: '🍳', label: 'キッチン設備' },
              { icon: '🍴', label: '飲食可' },
              { icon: '🍷', label: '飲酒可' },
              { icon: '✨', label: '片付けおまかせ' },
              { icon: '🗑️️', label: 'ゴミ処理おまかせ' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-4 border rounded-xl bg-gray-50/50 hover:bg-gray-50 transition text-center gap-2"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>

          {/* 各種リンクボタン */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <a
              href="/kiyaku2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
            >
              <span>📜</span> 利用規約を確認する
            </a>
            <a
              href="/hausururu2026_COCOKARA.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
            >
              <span>📋</span> ハウスルールを確認する
            </a>
            <a
              href="/taishuru2026.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="border rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
            >
              <span>🔑</span> 入退出マニュアルを確認する
            </a>
          </div>
        </div>

        {/* アクセス・所在地 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">アクセス・所在地</h2>
          <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
            <span className="text-red-500">📍</span> 〒570-0012 大阪府守口市金田町2-1-9 COCOKARA
          </div>

          {/* マップ埋め込み・リンク */}
          <div className="relative rounded-xl overflow-hidden border h-72 bg-gray-100 flex flex-col justify-end">
            <div className="absolute top-4 left-4 z-10">
              <a
                href="https://maps.google.com/?q=大阪府守口市金田町2-1-9"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white px-4 py-2 rounded-lg shadow font-semibold text-sm text-emerald-600 hover:bg-emerald-50 transition border flex items-center gap-1"
              >
                マップで開く ↗
              </a>
            </div>
            <iframe
              title="Google Map"
              src="https://maps.google.com/maps?q=大阪府守口市金田町2-1-9&t=&z=15&ie=UTF8&iwloc=&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
            ></iframe>
          </div>
        </div>

        {/* 利用料金プラン */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 md:p-8 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">利用料金プラン</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>• 基本料金（1〜6時間まで）: ¥12,000</li>
            <li>• 6時間超過分: 1時間につき +¥2,000</li>
          </ul>
        </div>

        {/* 予約空き状況 */}
        <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900">予約空き状況（最大1ヶ月先まで）</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeekOffset(Math.max(0, currentWeekOffset - 1))}
                disabled={currentWeekOffset === 0}
                className="border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                ＜ 前の週
              </button>
              <button
                onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}
                disabled={currentWeekOffset >= 3}
                className="border px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                次の週 ＞
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[...weekDates1, ...weekDates2].map((item, idx) => (
              <Link
                href="/poker-v2"
                key={idx}
                className="border rounded-xl p-3 bg-emerald-50/40 hover:bg-emerald-50 transition text-center flex flex-col justify-between gap-2 border-emerald-200"
              >
                <span className="text-xs font-bold text-gray-800">{item.dateStr}</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-100/60 py-1 rounded">
                  {item.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}