'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// サンプルの予約データ
const initialBookings = [
  {
    id: 1,
    spaceName: 'COCOKARA メインルーム',
    date: '2026-10-04',
    time: '18:00 - 32:00',
    userName: 'レンタルスペース',
    email: 'kindafighters27@gmail.com',
    status: '仮予約',
    amount: 28000,
    confirmed: false,
  },
  {
    id: 2,
    spaceName: 'COCOKARA メインルーム',
    date: '2026-10-05',
    time: '13:00 - 17:00',
    userName: 'テストユーザー',
    email: 'test@example.com',
    status: 'キャンセル済み',
    amount: 15000,
    confirmed: false,
  },
];

export default function PokerV2AdminPage() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'sales' | 'customers'>('list');
  const [bookings, setBookings] = useState<any[]>(initialBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // 編集モーダル用の状態
  const [editingBooking, setEditingBooking] = useState<any | null>(null);

  // 経費・売上管理用の状態（売上管理タブ用）
  const [selectedYear, setSelectedYear] = useState('2026');
  const [expenses, setExpenses] = useState({
    rent: 0,
    salary: 0,
    beverage: 0,
    equipment: 0,
  });

  // localStorageから予約データを読み込んで結合
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cocokara_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const formattedSavedBookings = parsed.map((b: any, index: number) => ({
          id: b.id || Date.now() + index,
          spaceName: b.space || 'COCOKARA メインルーム',
          date: b.date || '2026-10-04',
          time: b.time || '18:00 - 32:00',
          userName: b.name || 'レンタルスペース',
          email: b.email || 'kindafighters27@gmail.com',
          status: b.confirmed ? '確定' : '仮予約',
          amount: typeof b.amount === 'string' ? parseInt(b.amount.replace(/[^0-9]/g, ''), 10) || 28000 : b.amount || 28000,
          confirmed: b.confirmed || false,
        }));
        setBookings([...formattedSavedBookings, ...initialBookings]);
      }
    } catch (err) {
      console.error('Failed to load bookings from localStorage', err);
    }
  }, []);

  // チェックボックス切り替え処理（連絡完了＝確定）
  const handleToggleConfirm = (id: number | string) => {
    const updated = bookings.map((b) => {
      if (b.id === id) {
        const newConfirmed = !b.confirmed;
        return {
          ...b,
          confirmed: newConfirmed,
          status: newConfirmed ? '確定' : '仮予約',
        };
      }
      return b;
    });
    setBookings(updated);

    // localStorage側も同期保存
    try {
      const saved = localStorage.getItem('cocokara_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updatedParsed = parsed.map((b: any) => {
          if (b.id === id) {
            const newConfirmed = !b.confirmed;
            return {
              ...b,
              confirmed: newConfirmed,
              status: newConfirmed ? '確定' : '仮予約',
            };
          }
          return b;
        });
        localStorage.setItem('cocokara_bookings', JSON.stringify(updatedParsed));
      }
    } catch (err) {
      console.error('Failed to update confirmation status in localStorage', err);
    }
  };

  // 編集開始
  const handleEditClick = (booking: any) => {
    setEditingBooking({ ...booking });
  };

  // 編集保存処理
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const updatedBookings = bookings.map((b) => {
      if (b.id === editingBooking.id) {
        return {
          ...editingBooking,
          status: editingBooking.confirmed ? '確定' : (editingBooking.status === 'キャンセル済み' ? 'キャンセル済み' : '仮予約'),
        };
      }
      return b;
    });

    setBookings(updatedBookings);
    setEditingBooking(null);

    // localStorage側も同期保存
    try {
      const saved = localStorage.getItem('cocokara_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const updatedParsed = parsed.map((b: any) => {
          if (b.id === editingBooking.id) {
            return {
              ...b,
              space: editingBooking.spaceName,
              date: editingBooking.date,
              time: editingBooking.time,
              name: editingBooking.userName,
              email: editingBooking.email,
              amount: editingBooking.amount,
              confirmed: editingBooking.confirmed,
            };
          }
          return b;
        });
        localStorage.setItem('cocokara_bookings', JSON.stringify(updatedParsed));
      }
    } catch (err) {
      console.error('Failed to update booking in localStorage', err);
    }
  };

  const handleRefresh = () => {
    try {
      const saved = localStorage.getItem('cocokara_bookings');
      if (saved) {
        const parsed = JSON.parse(saved);
        const formattedSavedBookings = parsed.map((b: any, index: number) => ({
          id: b.id || Date.now() + index,
          spaceName: b.space || 'COCOKARA メインルーム',
          date: b.date || '2026-10-04',
          time: b.time || '18:00 - 32:00',
          userName: b.name || 'レンタルスペース',
          email: b.email || 'kindafighters27@gmail.com',
          status: b.confirmed ? '確定' : '仮予約',
          amount: typeof b.amount === 'string' ? parseInt(b.amount.replace(/[^0-9]/g, ''), 10) || 28000 : b.amount || 28000,
          confirmed: b.confirmed || false,
        }));
        setBookings([...formattedSavedBookings, ...initialBookings]);
      }
    } catch (err) {
      console.error(err);
    }
    alert('データを更新しました');
  };

  const handleLogout = () => {
    alert('ログアウトしました');
  };

  // 検索・絞り込みの適用
  const filteredBookings = bookings.filter((booking) => {
    const matchesSearch =
      booking.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.spaceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.date.includes(searchTerm);

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return booking.status !== 'キャンセル済み';
    } else if (statusFilter === 'cancelled') {
      return booking.status === 'キャンセル済み';
    }
    return true;
  });

  return (
    <main className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー部分：タイトルと各ボタン */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-lg shadow mb-6 gap-4">
          <h1 className="text-xl font-bold text-gray-800">
            {activeTab === 'customers' ? '顧客リスト（履歴・キャンセル含む）' : '管理者ダッシュボード（予約一覧）'}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('customers')}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition shadow-sm"
            >
              顧客リストを見る
            </button>
            <button
              onClick={handleRefresh}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition shadow-sm"
            >
              更新
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 transition shadow-sm"
            >
              ログアウト
            </button>
            <Link
              href="/"
              className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition shadow-sm"
            >
              トップへ
            </Link>
          </div>
        </div>

        {/* ナビゲーション・機能切り替えタブバー */}
        <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'list'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              リスト表示
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'calendar'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              カレンダー一括確認
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'sales'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              売上管理
            </button>
          </div>

          {/* 検索バーとステータス絞り込み（リスト表示時） */}
          {activeTab === 'list' && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="お名前、メール、スペース名、日付で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full md:w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">ステータス:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    statusFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  すべて ({bookings.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  有効な予約
                </button>
                <button
                  onClick={() => setStatusFilter('cancelled')}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    statusFilter === 'cancelled' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  キャンセル済み
                </button>
              </div>
            </div>
          )}
        </div>

        {/* コンテンツ切り替えエリア */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b text-sm text-gray-600">
                    <th className="p-3">予約日</th>
                    <th className="p-3">スペース</th>
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3">時間</th>
                    <th className="p-3">ステータス / 確認</th>
                    <th className="p-3">金額</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b hover:bg-gray-50 text-sm">
                        <td className="p-3 text-gray-900 font-medium">{booking.date}</td>
                        <td className="p-3 text-gray-900 font-medium">{booking.spaceName}</td>
                        <td className="p-3 text-gray-900 font-medium">{booking.userName}</td>
                        <td className="p-3 text-gray-900">{booking.email}</td>
                        <td className="p-3 text-gray-900 font-medium">{booking.time}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                booking.status === '確定'
                                  ? 'bg-green-100 text-green-800'
                                  : booking.status === 'キャンセル済み'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.status}
                            </span>
                            {booking.status !== 'キャンセル済み' && (
                              <label className="flex items-center gap-1 text-xs text-gray-900 font-medium cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={booking.confirmed || false}
                                  onChange={() => handleToggleConfirm(booking.id)}
                                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                                <span>確認済</span>
                              </label>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-gray-900 font-medium">¥{booking.amount.toLocaleString()}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleEditClick(booking)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition"
                          >
                            編集
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-500">
                        予約データがありません。
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-center py-12">
              条件に一致する顧客データはありません。
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-gray-500 text-center py-12">
              カレンダー一括確認の表示エリアです。
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="space-y-6">
            {/* 年間売上サマリー */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">年間売上サマリー</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">対象年を選択:</span>
                  {['2026', '2027', '2028', '2029', '2030'].map((year) => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-3 py-1 rounded text-xs font-semibold ${
                        selectedYear === year ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {year}年
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">{selectedYear}年 総売上（有効な予約）</div>
                  <div className="text-2xl font-bold text-emerald-600">¥0</div>
                </div>
                <div className="border p-4 rounded-lg bg-gray-50">
                  <div className="text-sm text-gray-600 mb-1">{selectedYear}年 キャンセル損失金額</div>
                  <div className="text-2xl font-bold text-red-500">¥0</div>
                </div>
              </div>
            </div>

            {/* 月別売上・経費・粗利管理 */}
            <div className="bg-white p-6 rounded-lg shadow space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">月別売上・経費・粗利管理</h2>
                <select className="border rounded-lg px-3 py-2 text-sm bg-white">
                  <option>データなし</option>
                </select>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border p-4 rounded-lg bg-gray-50">
                <div>
                  <div className="text-xs text-gray-600 mb-1">売上</div>
                  <div className="text-lg font-bold text-emerald-600">¥0</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">賃料</div>
                  <input
                    type="number"
                    value={expenses.rent}
                    onChange={(e) => setExpenses({ ...expenses, rent: Number(e.target.value) })}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">人件費</div>
                  <input
                    type="number"
                    value={expenses.salary}
                    onChange={(e) => setExpenses({ ...expenses, salary: Number(e.target.value) })}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">飲料購入費</div>
                  <input
                    type="number"
                    value={expenses.beverage}
                    onChange={(e) => setExpenses({ ...expenses, beverage: Number(e.target.value) })}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">設備購入費</div>
                  <input
                    type="number"
                    value={expenses.equipment}
                    onChange={(e) => setExpenses({ ...expenses, equipment: Number(e.target.value) })}
                    className="w-full border rounded px-2 py-1 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex justify-between items-center">
                <div className="text-sm font-semibold text-emerald-800">経費合計: ¥0</div>
                <div className="text-sm font-bold text-emerald-900">月間 粗利（利益）: ¥0</div>
              </div>
            </div>
          </div>
        )}

        {/* 編集モーダル */}
        {editingBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-4">予約情報の編集</h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">スペース名</label>
                  <input
                    type="text"
                    value={editingBooking.spaceName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, spaceName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">予約日</label>
                    <input
                      type="date"
                      value={editingBooking.date}
                      onChange={(e) => setEditingBooking({ ...editingBooking, date: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">時間</label>
                    <input
                      type="text"
                      value={editingBooking.time}
                      onChange={(e) => setEditingBooking({ ...editingBooking, time: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">お名前</label>
                  <input
                    type="text"
                    value={editingBooking.userName}
                    onChange={(e) => setEditingBooking({ ...editingBooking, userName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    value={editingBooking.email}
                    onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">金額 (円)</label>
                    <input
                      type="number"
                      value={editingBooking.amount}
                      onChange={(e) => setEditingBooking({ ...editingBooking, amount: Number(e.target.value) })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">ステータス</label>
                    <select
                      value={editingBooking.status}
                      onChange={(e) => {
                        const newStatus = e.target.value;
                        setEditingBooking({
                          ...editingBooking,
                          status: newStatus,
                          confirmed: newStatus === '確定',
                        });
                      }}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="仮予約">仮予約</option>
                      <option value="確定">確定</option>
                      <option value="キャンセル済み">キャンセル済み</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    保存する
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}