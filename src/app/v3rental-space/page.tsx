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
  const [adminViewMode, setAdminViewMode] = useState<'bookings' | 'customers' | 'sales'>('bookings');

  // 売上管理用の状態
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [expenses, setExpenses] = useState<{ [key: string]: { rent: number; staff: number; drink: number; wifi: number; equipment: number } }>({
    '2026-09': { rent: 0, staff: 0, drink: 0, wifi: 0, equipment: 0 },
    '2026-10': { rent: 0, staff: 0, drink: 0, wifi: 0, equipment: 0 }
  });

  // 管理者用 インライン直接編集の状態管理（行IDごとに管理）
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<{
    date: string;
    name: string;
    email: string;
    start_time: string;
    end_time: string;
    status: string;
    total_price: number;
  }>({
    date: '',
    name: '',
    email: '',
    start_time: '',
    end_time: '',
    status: 'confirmed',
    total_price: 12000
  });
  const [isUpdating, setIsUpdating] = useState(false);

  // カレンダーの表示週管理（0 = 当週, 1 = 1週先, 2 = 2週先, 3 = 3週先 ※最大1ヶ月分）
  const [weekOffset, setWeekOffset] = useState(0);

  // 初回マウント時に全予約を取得（重複チェック・カレンダー用）
  useEffect(() => {
    fetchAllBookingsForCheck();
  }, []);

  const fetchAllBookingsForCheck = async () => {
    try {
      const { data, error } = await supabase
        .from('poker_bookings')
        .select('*');
      if (!error && data) {
        setAdminBookings(data);
      }
    } catch (err) {
      console.error('予約データ取得エラー:', err);
    }
  };

  // 動的な日付データ生成関数（今日を基準に14日間分を表示、weekOffsetで週移動）
  const generateCalendarDays = () => {
    const days = [];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const today = new Date();
    
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
    if (weekOffset < 2) {
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

  // 選択された日付の既存有効予約リストを取得
  const getExistingBookingsForDate = (dateStr: string) => {
    const targetBase = dateStr.split(' ')[0];
    return adminBookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      if (!b.date) return false;
      const bBase = b.date.split(' ')[0];
      return bBase === targetBase;
    });
  };

  // 指定された開始・終了時間が既存の予約と重複していないか、および掃除時間（1時間前まで）をクリアしているかチェック
  const checkTimeOverlap = (sDate: string, sTime: string, eTime: string, excludeId?: string) => {
    const existing = getExistingBookingsForDate(sDate).filter((b) => b.id !== excludeId);
    if (existing.length === 0) return null;

    const newStart = parseInt(sTime.split(':')[0], 10);
    const newEnd = parseInt(eTime.split(':')[0], 10);

    for (const b of existing) {
      const bStart = parseInt(b.start_time.split(':')[0], 10);
      const bEnd = parseInt(b.end_time.split(':')[0], 10);

      if (newStart < bStart && newEnd > (bStart - 1)) {
        return `選択された時間帯は、${b.start_time}開始の別のご予約に対する掃除・準備時間（1時間前までの制限）と重複しています。終了時間を ${b.start_time.split(':')[0]}:00 の1時間前（${b.start_time.split(':')[0] - 1}:00）以前に設定してください。`;
      }

      if (newStart < bEnd && newEnd > bStart) {
        return `指定された時間帯（${sTime} 〜 ${eTime}）は、すでに他のお客様のご予約（${b.start_time} 〜 ${b.end_time}）が入っているためご予約できません。`;
      }
    }
    return null;
  };

  // 選択可能な開始時間リスト
  const getAvailableStartHours = () => {
    const existing = getExistingBookingsForDate(selectedDate);
    const hoursList = [];
    for (let h = 9; h <= 29; h++) {
      let isAvailable = true;
      for (const b of existing) {
        const bStart = parseInt(b.start_time.split(':')[0], 10);
        const bEnd = parseInt(b.end_time.split(':')[0], 10);
        if (h >= bStart && h < bEnd) {
          isAvailable = false;
          break;
        }
      }
      if (isAvailable) {
        hoursList.push(h);
      }
    }
    return hoursList;
  };

  // 選択可能な終了時間リスト
  const getAvailableEndHours = () => {
    const startH = parseInt(startTime.split(':')[0], 10);
    const existing = getExistingBookingsForDate(selectedDate);
    
    let maxAllowedEnd = 30;
    for (const b of existing) {
      const bStart = parseInt(b.start_time.split(':')[0], 10);
      if (bStart > startH) {
        const cleaningLimit = bStart - 1;
        if (cleaningLimit < maxAllowedEnd) {
          maxAllowedEnd = cleaningLimit;
        }
      }
    }

    const endList = [];
    for (let h = startH + 1; h <= maxAllowedEnd; h++) {
      endList.push(h);
    }
    if (endList.length === 0 && startH < 30) {
      endList.push(startH + 1);
    }
    return endList;
  };

  // 時間計算と料金計算
  const calculatePrice = () => {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    let hours = endHour - startHour;
    if (hours <= 0) hours = 1;

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
    setStartTime('13:00');
    setEndTime('19:00');
    fetchAllBookingsForCheck();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    // 重複・掃除時間チェック
    const overlapError = checkTimeOverlap(selectedDate, startTime, endTime);
    if (overlapError) {
      setErrorMessage(overlapError);
      setIsSubmitting(false);
      return;
    }

    try {
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

      // メール送信処理（APIエラーで予約保存自体が阻害されないよう安全にラップ）
      try {
        await fetch('/api/send-email', {
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
      } catch (emailErr) {
        console.warn('メール送信APIの呼び出しに失敗しましたが、Supabaseへの予約保存は正常に完了しています。', emailErr);
      }

      setIsSubmitted(true);
      fetchAllBookingsForCheck();
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

      setUserBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' } : b))
      );
      alert('予約のキャンセルが完了いたしました。');
      fetchAllBookingsForCheck();
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
      const newNotes = currentConfirmed ? null : '確認済';
      const { error } = await supabase
        .from('poker_bookings')
        .update({ notes: newNotes })
        .eq('id', id);

      if (error) throw error;

      setAdminBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, notes: newNotes } : b))
      );
    } catch (err) {
      console.error('確認ステータス更新エラー:', err);
    }
  };

  // インライン編集を開始する
  const handleStartInlineEdit = (b: any) => {
    setEditingRowId(b.id);
    setEditRowData({
      date: b.date || '',
      name: b.name || '',
      email: b.email || '',
      start_time: b.start_time || '13:00',
      end_time: b.end_time || '19:00',
      status: b.status || 'confirmed',
      total_price: b.total_price || 12000
    });
  };

  // インライン編集を保存する
  const handleSaveInlineEdit = async (id: string) => {
    const overlapError = checkTimeOverlap(editRowData.date, editRowData.start_time, editRowData.end_time, id);
    if (overlapError) {
      alert(overlapError);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('poker_bookings')
        .update({
          date: editRowData.date,
          name: editRowData.name,
          email: editRowData.email,
          start_time: editRowData.start_time,
          end_time: editRowData.end_time,
          status: editRowData.status,
          total_price: Number(editRowData.total_price)
        })
        .eq('id', id);

      if (error) throw error;

      setAdminBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...editRowData } : b))
      );
      setEditingRowId(null);
      alert('予約情報を直接更新しました。');
      fetchAllBookingsForCheck();
    } catch (err: unknown) {
      alert('更新に失敗しました。');
    } finally {
      setIsUpdating(false);
    }
  };

  // 経費入力変更ハンドラー
  const handleExpenseChange = (month: string, field: string, val: number) => {
    setExpenses((prev) => ({
      ...prev,
      [month]: {
        ...(prev[month] || { rent: 0, staff: 0, drink: 0, wifi: 0, equipment: 0 }),
        [field]: val
      }
    }));
  };

  // 柔軟な日付・年・月マッチング関数
  const parseMonthAndYearFromDate = (dateStr: string) => {
    if (!dateStr) return { year: '2026', month: '10', yearMonth: '2026-10' };
    
    let m = '10';
    let y = '2026';

    if (dateStr.includes('2026')) y = '2026';
    else if (dateStr.includes('2027')) y = '2027';
    else if (dateStr.includes('2028')) y = '2028';

    if (dateStr.startsWith('9-') || dateStr.includes('-9-') || dateStr.includes('/9/')) m = '09';
    else if (dateStr.startsWith('10-') || dateStr.includes('-10-') || dateStr.includes('/10/')) m = '10';
    else if (dateStr.startsWith('11-') || dateStr.includes('-11-') || dateStr.includes('/11/')) m = '11';
    else if (dateStr.startsWith('12-') || dateStr.includes('-12-') || dateStr.includes('/12/')) m = '12';
    else if (dateStr.startsWith('1-') || dateStr.includes('-01-') || dateStr.includes('/1/')) m = '01';
    else if (dateStr.startsWith('2-') || dateStr.includes('-02-') || dateStr.includes('/2/')) m = '02';
    else if (dateStr.startsWith('3-') || dateStr.includes('-03-') || dateStr.includes('/3/')) m = '03';
    else if (dateStr.startsWith('4-') || dateStr.includes('-04-') || dateStr.includes('/4/')) m = '04';
    else if (dateStr.startsWith('5-') || dateStr.includes('-05-') || dateStr.includes('/5/')) m = '05';
    else if (dateStr.startsWith('6-') || dateStr.includes('-06-') || dateStr.includes('/6/')) m = '06';
    else if (dateStr.startsWith('7-') || dateStr.includes('-07-') || dateStr.includes('/7/')) m = '07';
    else if (dateStr.startsWith('8-') || dateStr.includes('-08-') || dateStr.includes('/8/')) m = '08';

    const formattedMonth = m.length === 1 ? `0${m}` : m;
    return { year: y, month: formattedMonth, yearMonth: `${y}-${formattedMonth}` };
  };

  const matchYear = (dateStr: string, year: string) => {
    if (!dateStr) return false;
    const parsed = parseMonthAndYearFromDate(dateStr);
    return parsed.year === year;
  };

  const matchMonth = (dateStr: string, monthStr: string) => {
    if (!dateStr) return false;
    const parsed = parseMonthAndYearFromDate(dateStr);
    return parsed.yearMonth === monthStr;
  };

  // フィルタリング処理（管理者画面）
  const filteredAdminBookings = adminBookings.filter((b) => {
    if (adminStatusFilter === 'valid' && b.status === 'cancelled') return false;
    if (adminStatusFilter === 'cancelled' && b.status !== 'cancelled') return false;

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

      {/* 管理者ログイン済みの表示 */}
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

          {/* サブナビゲーション・コントロール */}
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
                onClick={() => setAdminViewMode('sales')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition ${
                  adminViewMode === 'sales'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                売上管理
              </button>
            </div>

            {adminViewMode === 'bookings' && (
              <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm w-full md:w-auto">
                <input
                  type="text"
                  placeholder="お名前、メール、スペース名、日付で検索"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
                  <span className="text-slate-500 pl-1 font-medium">ステータス:</span>
                  <button
                    onClick={() => setAdminStatusFilter('all')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      adminStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    すべて ({adminBookings.length})
                  </button>
                  <button
                    onClick={() => setAdminStatusFilter('valid')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      adminStatusFilter === 'valid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    有効な予約
                  </button>
                  <button
                    onClick={() => setAdminStatusFilter('cancelled')}
                    className={`px-2 py-1 rounded font-medium transition ${
                      adminStatusFilter === 'cancelled' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    キャンセル済み
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ビュー切り替え: リスト / 顧客 / 売上管理 */}
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
                      <td colSpan={8} className="p-8 text-center text-slate-400">読み込み中...</td>
                    </tr>
                  ) : filteredAdminBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">該当する予約が見つかりませんでした。</td>
                    </tr>
                  ) : (
                    filteredAdminBookings.map((b) => {
                      const isConfirmed = b.notes === '確認済';
                      const isEditing = editingRowId === b.id;

                      if (isEditing) {
                        return (
                          <tr key={b.id} className="bg-amber-50/50 transition">
                            <td className="p-2">
                              <input
                                type="text"
                                value={editRowData.date}
                                onChange={(e) => setEditRowData({ ...editRowData, date: e.target.value })}
                                className="w-28 border border-slate-300 rounded p-1 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2 text-slate-600 text-xs">メインルーム</td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editRowData.name}
                                onChange={(e) => setEditRowData({ ...editRowData, name: e.target.value })}
                                className="w-24 border border-slate-300 rounded p-1 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="email"
                                value={editRowData.email}
                                onChange={(e) => setEditRowData({ ...editRowData, email: e.target.value })}
                                className="w-36 border border-slate-300 rounded p-1 text-xs bg-white font-mono"
                              />
                            </td>
                            <td className="p-2 whitespace-nowrap">
                              <input
                                type="text"
                                value={editRowData.start_time}
                                onChange={(e) => setEditRowData({ ...editRowData, start_time: e.target.value })}
                                className="w-14 border border-slate-300 rounded p-1 text-xs bg-white"
                              />
                              -
                              <input
                                type="text"
                                value={editRowData.end_time}
                                onChange={(e) => setEditRowData({ ...editRowData, end_time: e.target.value })}
                                className="w-14 border border-slate-300 rounded p-1 text-xs bg-white"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={editRowData.status}
                                onChange={(e) => setEditRowData({ ...editRowData, status: e.target.value })}
                                className="border border-slate-300 rounded p-1 text-xs bg-white"
                              >
                                <option value="confirmed">有効</option>
                                <option value="cancelled">キャンセル</option>
                              </select>
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={editRowData.total_price}
                                onChange={(e) => setEditRowData({ ...editRowData, total_price: Number(e.target.value) })}
                                className="w-20 border border-slate-300 rounded p-1 text-xs bg-white text-right"
                              />
                            </td>
                            <td className="p-2 text-center whitespace-nowrap space-x-1">
                              <button
                                onClick={() => handleSaveInlineEdit(b.id)}
                                disabled={isUpdating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded transition"
                              >
                                {isUpdating ? '保存...' : '保存'}
                              </button>
                              <button
                                onClick={() => setEditingRowId(null)}
                                className="bg-slate-300 hover:bg-slate-400 text-slate-700 text-xs font-bold px-2 py-1 rounded transition"
                              >
                                取消
                              </button>
                            </td>
                          </tr>
                        );
                      }

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
                                <span className="bg-rose-100 text-rose-700 text-xs px-2 py-1 rounded font-bold">キャンセル済み</span>
                              ) : (
                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded font-bold">仮予約</span>
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
                              onClick={() => handleStartInlineEdit(b)}
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
          ) : adminViewMode === 'customers' ? (
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
          ) : (
            /* 売上管理画面 */
            <div className="space-y-6">
              {/* 年間売上サマリー */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900 text-base">年間売上サマリー</h2>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-medium">対象年を選択:</span>
                    {['2026', '2027', '2028', '2029', '2030'].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => setSelectedYear(yr)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition ${
                          selectedYear === yr ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {yr}年
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 総売上計算 */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium block mb-1">{selectedYear}年 総売上（有効な予約）</span>
                    <span className="text-2xl md:text-3xl font-bold text-slate-900">
                      ¥{adminBookings
                        .filter((b) => matchYear(b.date, selectedYear) && b.status !== 'cancelled')
                        .reduce((acc, b) => acc + Number(b.total_price || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                  {/* キャンセル損失金額計算 */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium block mb-1">{selectedYear}年 キャンセル損失金額</span>
                    <span className="text-2xl md:text-3xl font-bold text-rose-600">
                      ¥{adminBookings
                        .filter((b) => matchYear(b.date, selectedYear) && b.status === 'cancelled')
                        .reduce((acc, b) => acc + Number(b.total_price || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 月別売上・経費・粗利管理 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <h2 className="font-bold text-slate-900 text-base">月別売上・経費・粗利管理</h2>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-slate-500 font-medium">表示月を選択:</span>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      {['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {(() => {
                  const mBookings = adminBookings.filter((b) => matchMonth(b.date, selectedMonth) && b.status !== 'cancelled');
                  const mSales = mBookings.reduce((acc, b) => acc + Number(b.total_price || 0), 0);
                  const mExp = expenses[selectedMonth] || { rent: 0, staff: 0, drink: 0, wifi: 0, equipment: 0 };
                  const totalExp = Number(mExp.rent) + Number(mExp.staff) + Number(mExp.drink) + Number(mExp.wifi) + Number(mExp.equipment);
                  const mProfit = mSales - totalExp;

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">{selectedMonth} 売上</span>
                          <span className="text-lg font-bold text-slate-900">¥{mSales.toLocaleString()}</span>
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">賃料</span>
                          <input
                            type="number"
                            value={mExp.rent}
                            onChange={(e) => handleExpenseChange(selectedMonth, 'rent', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">人件費</span>
                          <input
                            type="number"
                            value={mExp.staff}
                            onChange={(e) => handleExpenseChange(selectedMonth, 'staff', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">飲料購入費</span>
                          <input
                            type="number"
                            value={mExp.drink}
                            onChange={(e) => handleExpenseChange(selectedMonth, 'drink', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">Wi-Fi購入費 (新規)</span>
                          <input
                            type="number"
                            value={mExp.wifi}
                            onChange={(e) => handleExpenseChange(selectedMonth, 'wifi', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                          <span className="text-xs text-slate-500 block mb-1">設備購入費</span>
                          <input
                            type="number"
                            value={mExp.equipment}
                            onChange={(e) => handleExpenseChange(selectedMonth, 'equipment', Number(e.target.value))}
                            className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white"
                          />
                        </div>
                      </div>

                      {/* 経費合計・月間粗利バー */}
                      <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
                        <span className="font-bold text-slate-700">経費合計: ¥{totalExp.toLocaleString()}</span>
                        <span className="font-bold text-slate-900">
                          月間 粗利 (利益) : <span className="text-emerald-700 text-lg md:text-xl">¥{mProfit.toLocaleString()}</span>
                        </span>
                      </div>

                      {/* 選択月の予約一覧テーブル */}
                      <div className="overflow-x-auto pt-2">
                        <table className="w-full text-left text-xs md:text-sm border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                              <th className="p-3">予約日</th>
                              <th className="p-3">スペース</th>
                              <th className="p-3">お名前</th>
                              <th className="p-3">メールアドレス</th>
                              <th className="p-3">時間</th>
                              <th className="p-3">ステータス</th>
                              <th className="p-3 text-right">金額</th>
                              <th className="p-3 text-center">操作</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adminBookings.filter((b) => matchMonth(b.date, selectedMonth)).length === 0 ? (
                              <tr>
                                <td colSpan={8} className="p-6 text-center text-slate-400">該当する月の予約はありません。</td>
                              </tr>
                            ) : (
                              adminBookings.filter((b) => matchMonth(b.date, selectedMonth)).map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50 transition">
                                  <td className="p-3 font-medium text-slate-900 whitespace-nowrap">{b.date}</td>
                                  <td className="p-3 text-slate-600 whitespace-nowrap">COCOKARA メインルーム</td>
                                  <td className="p-3 font-bold text-slate-800 whitespace-nowrap">{b.name} 様</td>
                                  <td className="p-3 text-slate-600 font-mono text-xs">{b.email}</td>
                                  <td className="p-3 text-slate-700 whitespace-nowrap">{b.start_time} - {b.end_time}</td>
                                  <td className="p-3 whitespace-nowrap">
                                    {b.status === 'cancelled' ? (
                                      <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded font-bold">キャンセル</span>
                                    ) : (
                                      <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded font-bold">有効</span>
                                    )}
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-900 whitespace-nowrap">¥{Number(b.total_price || 0).toLocaleString()}</td>
                                  <td className="p-3 text-center whitespace-nowrap">
                                    <button
                                      onClick={() => handleStartInlineEdit(b)}
                                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1 rounded transition"
                                    >
                                      編集
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                        <div className="bg-slate-50 border-t border-slate-200 p-3 text-right text-xs font-bold text-slate-700">
                          【 {selectedMonth} 合計 】 有効: {mBookings.length}件 / 売上: ¥{mSales.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 利用者別 利用実績・売上集計 */}
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-base">利用者別 利用実績・売上集計</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                        <th className="p-3">お名前</th>
                        <th className="p-3">メールアドレス</th>
                        <th className="p-3">利用回数</th>
                        <th className="p-3 text-right">総利用金額</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Array.from(new Set(adminBookings.filter((b) => b.status !== 'cancelled').map((b) => b.email))).map((userEmail) => {
                        const userBookingsList = adminBookings.filter((b) => b.email === userEmail && b.status !== 'cancelled');
                        const user = userBookingsList[0];
                        const totalSpent = userBookingsList.reduce((acc, b) => acc + Number(b.total_price || 0), 0);
                        return (
                          <tr key={userEmail} className="hover:bg-slate-50 transition">
                            <td className="p-3 font-bold text-slate-900">{user?.name} 様</td>
                            <td className="p-3 text-slate-600 font-mono">{userEmail}</td>
                            <td className="p-3 text-slate-700">{userBookingsList.length}回</td>
                            <td className="p-3 text-right font-bold text-emerald-700">¥{totalSpent.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      ) : (
        /* 通常のユーザー用表示 */
        <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
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

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              設備・備品・サービス
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <span className="text-2xl mb-1">🚪</span>
                <span className="text-xs md:text-sm font-medium text-slate-700">個室 (壁・扉あり)</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <span className="text-2xl mb-1">🚻</span>
                <span className="text-xs md:text-sm font-medium text-slate-700">トイレ</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <span className="text-2xl mb-1">🔌</span>
                <span className="text-xs md:text-sm font-medium text-slate-700">電源</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center bg-slate-50/50">
                <span className="text-2xl mb-1">❄️</span>
                <span className="text-xs md:text-sm font-medium text-slate-700">エアコン (冷暖房)</span>
              </div>
            </div>

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

          <div className="bg-amber-50/60 rounded-2xl p-4 md:p-6 shadow-sm border border-amber-200/60">
            <h2 className="text-lg font-bold text-slate-900 mb-3">利用料金プラン</h2>
            <ul className="space-y-1.5 text-sm md:text-base text-slate-700">
              <li>・基本料金（1〜6時間まで）: <span className="font-semibold text-slate-900">¥12,000</span></li>
              <li>・6時間超過分: 1時間につき <span className="font-semibold text-slate-900">+¥2,000</span></li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-bold text-slate-900">予約空き状況（最大1ヶ月先まで）</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={handlePrevWeek}
                  disabled={weekOffset === 0}
                  className={`border px-3 py-1 rounded-lg text-xs md:text-sm transition ${
                    weekOffset === 0 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  &lt; 前の週
                </button>
                <button 
                  onClick={handleNextWeek}
                  disabled={weekOffset >= 2}
                  className={`border px-3 py-1 rounded-lg text-xs md:text-sm transition ${
                    weekOffset >= 2 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  次の週 &gt;
                </button>
              </div>
            </div>

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

            {searchMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg mb-4">
                {searchMessage}
              </div>
            )}

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
                          <span className="bg-rose-100 text-rose-700 text-xs px-2 py-0.5 rounded-full font-semibold">キャンセル済み</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-semibold">予約確定</span>
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

      {/* 利用規約 / ハウスルール モーダル */}
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

            <div className="text-sm text-slate-700 space-y-4 leading-relaxed overflow-y-auto pr-2">
              {activeModal === 'kiyaku' && (
                <>
                  <section className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-2">第1条 (貸出備品の取り扱いおよび安全管理)</h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs md:text-sm text-slate-600">
                      <li>室内に設置されたポーカー天板等の備品は、利用者自身の責任において設置・使用・収納を行うものとします。</li>
                      <li>天板の設置および収納作業は、怪我や事故防止のため、必ず大人2人以上で行ってください。</li>
                    </ol>
                  </section>
                </>
              )}

              {activeModal === 'house' && (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-emerald-800 text-xs mb-1">RULE 01</div>
                    <div className="font-bold text-slate-900 mb-1">騒音注意</div>
                    <p className="text-xs md:text-sm text-slate-600">近隣住民のご迷惑になりますので、出入りの際に静かに入店・退室してください。</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end sticky bottom-0 bg-white">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-6 rounded-xl text-sm transition"
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

                {/* 既存の予約スケジュール表示 */}
                {getExistingBookingsForDate(selectedDate).length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                    <span className="font-bold text-amber-900 block mb-1">⚠️ この日の既存のご予約状況（掃除時間1時間含む）:</span>
                    {getExistingBookingsForDate(selectedDate).map((b, idx) => (
                      <div key={idx} className="text-amber-800">
                        • {b.start_time} 〜 {b.end_time} （{b.name}様）※直前予約は {b.start_time.split(':')[0] - 1}:00 まで選択可能
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-lg text-xs font-semibold">
                      {errorMessage}
                    </div>
                  )}

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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">電話番号</label>
                    <input
                      type="tel"
                      placeholder="090-0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">開始時間</label>
                      <select
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          const newStartH = parseInt(e.target.value.split(':')[0], 10);
                          const currentEndH = parseInt(endTime.split(':')[0], 10);
                          if (currentEndH <= newStartH) {
                            setEndTime(`${newStartH + 1}:00`);
                          }
                        }}
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {getAvailableStartHours().map((h) => (
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
                        {getAvailableEndHours().map((h) => (
                          <option key={h} value={`${h}:00`}>{`${h}:00`}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">クーポンコード（お持ちの方）</label>
                    <input
                      type="text"
                      placeholder="例: 0505"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">備考・ご要望</label>
                    <textarea
                      rows={2}
                      placeholder="ご質問や事前のご要望等があればご入力ください"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>ご利用予定時間:</span>
                      <span className="font-medium text-slate-800">{hours} 時間</span>
                    </div>
                    <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                      <span>お支払合計金額:</span>
                      <span className="text-emerald-700 text-lg">¥{price.toLocaleString()}</span>
                    </div>
                  </div>

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