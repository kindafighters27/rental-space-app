'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 予約確認・キャンセルモーダルの状態管理
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // 管理者画面の状態管理
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');
  const [adminBookings, setAdminBookings] = useState<any[]>([]);
  const [isLoadingAdminBookings, setIsLoadingAdminBookings] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'valid' | 'cancelled'>('all');
  const [adminViewMode, setAdminViewMode] = useState<'bookings' | 'customers'>('bookings');

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
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // 1. Supabaseへ予約データを保存
      const { error } = await supabase
        .from('poker_bookings')
        .insert([
          {
            date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            name: name,
            email: email,
            phone: phone || null,
            coupon: coupon || null,
            notes: notes || null,
            total_price: price,
            status: 'confirmed'
          }
        ]);

      if (error) {
        throw error;
      }

      // 2. ResendAPI（/api/send-email）を呼び出して自動確認メール＆通知メールを送信
      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          startTime: startTime,
          endTime: endTime,
          name: name,
          email: email,
          phone: phone,
          coupon: coupon,
          notes: notes,
          totalPrice: price,
        }),
      });

      if (!emailRes.ok) {
        console.warn('メール送信APIでエラーが発生しましたが、予約保存は完了しています。');
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message || '予約の保存に失敗しました。');
      } else {
        setErrorMessage('予約の保存に失敗しました。');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 予約検索処理（ユーザー用）
  const handleSearchBookings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;

    setIsSearching(true);
    setSearchMessage('');
    setUserBookings([]);

    try {
      const { data, error } = await supabase
        .from('poker_bookings')
        .select('*')
        .eq('email', searchEmail.trim())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setUserBookings(data);
      } else {
        setSearchMessage('該当するご予約が見つかりませんでした。');
      }
    } catch (err: unknown) {
      setSearchMessage('予約の検索中にエラーが発生しました。');
    } finally {
      setIsSearching(false);
    }
  };

  // 予約キャンセル処理（ユーザー用）
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('本当にこの予約をキャンセルしますか？')) return;

    setCancellingId(bookingId);
    try {
      const { error } = await supabase
        .from('poker_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      // 画面上のリストを更新
      setUserBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
      alert('予約のキャンセルが完了いたしました。');
    } catch (err: unknown) {
      alert('キャンセルの処理に失敗しました。');
    } finally {
      setCancellingId(null);
    }
  };

  // 管理者ログイン認証
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === '0509') {
      setIsAdminLoggedIn(true);
      setIsAdminAuthModalOpen(false);
      setAdminPassword('');
      setAdminAuthError('');
      fetchAdminBookings();
    } else {
      setAdminAuthError('パスワードが正しくありません。');
    }
  };

  // 管理者用全予約データ取得
  const fetchAdminBookings = async () => {
    setIsLoadingAdminBookings(true);
    try {
      const { data, error } = await supabase
        .from('poker_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setAdminBookings(data);
      }
    } catch (err) {
      console.error('管理者予約取得エラー:', err);
    } finally {
      setIsLoadingAdminBookings(false);
    }
  };

  // 管理者確認チェックボックス切り替え
  const handleToggleConfirmed = async (id: string, currentConfirmed: boolean) => {
    try {
      const { error } = await supabase
        .from('poker_bookings')
        .update({ notes: currentConfirmed ? null : '確認済' })
        .eq('id', id);

      if (error) throw error;

      setAdminBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, notes: currentConfirmed ? null : '確認済' } : b))
      );
    } catch (err) {
      console.error('確認ステータス更新エラー:', err);
    }
  };

  // フィルタリング処理（管理者画面）
  const filteredAdminBookings = adminBookings.filter((b) => {
    // ステータスフィルター
    if (adminStatusFilter === 'valid' && b.status === 'cancelled') return false;
    if (adminStatusFilter === 'cancelled' && b.status !== 'cancelled') return false;

    // 検索クエリフィルター
    if (adminSearchQuery.trim()) {
      const q = adminSearchQuery.toLowerCase();
      const nameMatch = b.name?.toLowerCase().includes(q);
      const emailMatch = b.email?.toLowerCase().includes(q);
      const dateMatch = b.date?.toLowerCase().includes(q);
      return nameMatch || emailMatch || dateMatch;
    }

    return true;
  });

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
              onClick={() => {
                setIsAdminLoggedIn(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium transition"
            >
              トップページに戻る
            </button>
            <button 
              onClick={() => {
                setIsCancelModalOpen(true);
                setSearchEmail('');
                setUserBookings([]);
                setSearchMessage('');
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-full font-medium transition"
            >
              予約の確認・キャンセル
            </button>
            <button 
              onClick={() => {
                if (isAdminLoggedIn) {
                  // すでにログイン済みならトップへスクロール
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setIsAdminAuthModalOpen(true);
                  setAdminAuthError('');
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-full font-medium transition shadow-sm"
            >
              管理者ログイン
            </button>
          </div>
        </div>
      </header>

      {/* 管理者ログイン済みの表示（画像2枚目を再現） */}
      {isAdminLoggedIn ? (
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
          {/* 上部ヘッダーコントロール */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              管理者ダッシュボード（予約一覧）
            </h1>
            <div className="flex items-center space-x-2 text-xs md:text-sm">
              <button
                onClick={() => setAdminViewMode(adminViewMode === 'bookings' ? 'customers' : 'bookings')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-lg transition"
              >
                {adminViewMode === 'bookings' ? '顧客リストを見る' : '予約一覧を見る'}
              </button>
              <button
                onClick={fetchAdminBookings}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition border border-slate-200"
              >
                更新
              </button>
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-3 py-2 rounded-lg transition border border-rose-200"
              >
                ログアウト
              </button>
              <button
                onClick={() => setIsAdminLoggedIn(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-2 rounded-lg transition"
              >
                トップへ
              </button>
            </div>
          </div>

          {/* サブナビゲーション・フィルターコントロール */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex space-x-1 text-xs md:text-sm">
              <button
                onClick={() => setAdminViewMode('bookings')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  adminViewMode === 'bookings'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                リスト表示
              </button>
              <button
                onClick={() => alert('カレンダー一括確認画面')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3.5 py-1.5 rounded-lg transition"
              >
                カレンダー一括確認
              </button>
              <button
                onClick={() => alert('売上管理画面')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium px-3.5 py-1.5 rounded-lg transition"
              >
                売上管理
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm w-full md:w-auto">
              {/* 検索インプット */}
              <input
                type="text"
                placeholder="お名前、メール、スペース名、日付で検索"
                value={adminSearchQuery}
                onChange={(e) => setAdminSearchQuery(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* ステータス切替 */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                <span className="text-slate-500 pl-1 font-medium">ステータス:</span>
                <button
                  onClick={() => setAdminStatusFilter('all')}
                  className={`px-2 py-1 rounded font-medium transition ${
                    adminStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  すべて ({adminBookings.length})
                </button>
                <button
                  onClick={() => setAdminStatusFilter('valid')}
                  className={`px-2 py-1 rounded font-medium transition ${
                    adminStatusFilter === 'valid'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  有効な予約
                </button>
                <button
                  onClick={() => setAdminStatusFilter('cancelled')}
                  className={`px-2 py-1 rounded font-medium transition ${
                    adminStatusFilter === 'cancelled'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  キャンセル済み
                </button>
              </div>
            </div>
          </div>

          {/* 予約テーブルリスト */}
          {adminViewMode === 'bookings' ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="p-3">予約日</th>
                    <th className="p-3">スペース</th>
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3">時間</th>
                    <th className="p-3">ステータス / 確認</th>
                    <th className="p-3 text-right">金額</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingAdminBookings ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        読み込み中...
                      </td>
                    </tr>
                  ) : filteredAdminBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        該当する予約が見つかりませんでした。
                      </td>
                    </tr>
                  ) : (
                    filteredAdminBookings.map((b) => {
                      const isConfirmed = b.notes === '確認済';
                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{b.date}</td>
                          <td className="p-3 text-slate-600 whitespace-nowrap">COCOKARA メインルーム</td>
                          <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{b.name} 様</td>
                          <td className="p-3 text-slate-600 font-mono text-xs">{b.email}</td>
                          <td className="p-3 text-slate-700 whitespace-nowrap">{b.start_time} - {b.end_time}</td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {b.status === 'cancelled' ? (
                                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded font-bold">
                                  キャンセル済み
                                </span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">
                                  仮予約
                                </span>
                              )}
                              <label className="flex items-center space-x-1 cursor-pointer text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={isConfirmed}
                                  onChange={() => handleToggleConfirmed(b.id, isConfirmed)}
                                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>確認済</span>
                              </label>
                            </div>
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            ¥{Number(b.total_price || 0).toLocaleString()}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => alert(`予約ID: ${b.id}\n名前: ${b.name}\n電話: ${b.phone || '未入力'}\n備考: ${b.notes || 'なし'}`)}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded transition"
                            >
                              編集
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* 顧客リスト表示 */
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto p-4">
              <h3 className="font-bold text-slate-900 mb-3 text-sm">顧客リスト</h3>
              <table className="w-full text-left text-xs md:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3">電話番号</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from(new Set(adminBookings.map((b) => b.email))).map((userEmail) => {
                    const user = adminBookings.find((b) => b.email === userEmail);
                    return (
                      <tr key={userEmail} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{user?.name} 様</td>
                        <td className="p-3 text-slate-600 font-mono">{userEmail}</td>
                        <td className="p-3 text-slate-600">{user?.phone || '未登録'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </main>
      ) : (
        /* 通常のユーザー用表示 */
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
                src="/space2.JPG" 
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
      )}

      {/* 管理者認証パスワード入力モーダル */}
      {isAdminAuthModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔒</span>
                <span>管理者ログイン</span>
              </h3>
              <button 
                onClick={() => setIsAdminAuthModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              {adminAuthError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-semibold">
                  {adminAuthError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  パスワードを入力してください
                </label>
                <input
                  type="password"
                  required
                  placeholder="パスワード (0509)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdminAuthModalOpen(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  ログイン
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 予約の確認・キャンセルモーダル */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-xl border border-slate-100 flex flex-col">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🔍</span>
                <span>ご予約の確認・キャンセル</span>
              </h3>
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ×
              </button>
            </div>

            {/* 検索フォーム */}
            <form onSubmit={handleSearchBookings} className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ご予約時のメールアドレス
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="example@cocokara.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-lg text-sm transition disabled:bg-slate-400"
                  >
                    {isSearching ? '検索中...' : '検索'}
                  </button>
                </div>
              </div>
            </form>

            {/* 検索メッセージ */}
            {searchMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg mb-4">
                {searchMessage}
              </div>
            )}

            {/* 検索結果リスト */}
            {userBookings.length > 0 && (
              <div className="space-y-3 overflow-y-auto max-h-60 pr-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">検索結果 ({userBookings.length}件)</h4>
                {userBookings.map((b) => (
                  <div key={b.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">{b.date} ({b.start_time} 〜 {b.end_time})</span>
                        <span className="text-xs text-slate-600">代表者: {b.name} 様</span>
                      </div>
                      <div>
                        {b.status === 'cancelled' ? (
                          <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                            キャンセル済み
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                            予約確定
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-200/60">
                      <span>合計金額: ¥{Number(b.total_price || 0).toLocaleString()}</span>
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingId === b.id}
                          className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-1 px-3 rounded-lg text-xs transition disabled:bg-slate-300"
                        >
                          {cancellingId === b.id ? '処理中...' : '予約をキャンセル'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-5 rounded-xl text-sm transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {/* エラーメッセージ表示 */}
                  {errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

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
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 px-4 rounded-xl transition shadow-sm"
                    >
                      {isSubmitting ? '送信中...' : '予約を確定する'}
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