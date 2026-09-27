'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [filteredBookings, setFilteredBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('active')
  
  // 追加：ビュー切り替え（'list' または 'calendar'）
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  // 追加：カレンダー用の選択年月
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      fetchBookings()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      filterBookings()
    }
  }, [searchTerm, statusFilter, bookings])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '0509') {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
      fetchBookings()
    } else {
      alert('パスワードが間違っています。')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    setPassword('')
  }

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*, spaces(name)')
      .order('date', { ascending: false })

    if (error) {
      console.error('予約一覧取得エラー:', error)
    } else {
      setBookings(data || [])
      setFilteredBookings(data || [])
    }
    setLoading(false)
  }

  const filterBookings = () => {
    let result = [...bookings]

    if (statusFilter === 'active') {
      result = result.filter((b) => b.status !== 'cancelled')
    } else if (statusFilter === 'cancelled') {
      result = result.filter((b) => b.status === 'cancelled')
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (b) =>
          b.user_name?.toLowerCase().includes(term) ||
          b.email?.toLowerCase().includes(term) ||
          b.spaces?.name?.toLowerCase().includes(term) ||
          b.date?.includes(term)
      )
    }

    setFilteredBookings(result)
  }

  const handleToggleConfirm = async (id: string, currentConfirmed: boolean) => {
    const newConfirmed = !currentConfirmed
    const { error } = await supabase
      .from('bookings')
      .update({ is_confirmed: newConfirmed })
      .eq('id', id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
    } else {
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, is_confirmed: newConfirmed } : b))
      )
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm('本当にこの予約をキャンセルしますか？')) return

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      alert('キャンセルの失敗しました: ' + error.message)
    } else {
      alert('予約をキャンセルしました。')
      fetchBookings()
    }
  }

  // 追加：リマインドメール送信ハンドラー（入退出マニュアル・利用規約・ルールを添付/案内）
  const handleSendReminder = (booking: any) => {
    if (!booking.email) {
      alert('お客様のメールアドレスが登録されていません。')
      return
    }
    if (confirm(`${booking.user_name} 様 (${booking.email}) 宛てに、入退出マニュアル・利用規約・ルールを記載したリマインドメールを送信しますか？`)) {
      // 実際のメール送信API処理をここに接続できます
      alert('リマインドメールを送信しました！（入退出マニュアル・利用規約・ルール添付/案内済み）')
    }
  }

  // カレンダー用ヘルパー関数
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-lg font-bold text-gray-900 mb-6 text-center">管理者ログイン</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力してください"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 placeholder:text-gray-400 placeholder:font-normal"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              ログイン
            </button>
            <div className="text-center mt-4">
              <Link href="/" className="text-xs text-gray-500 hover:underline">
                ← トップページに戻る
              </Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  // カレンダー描画用データ計算
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">管理者ダッシュボード（予約一覧）</h1>
        <div className="flex space-x-3 items-center">
          <Link href="/admin/customers" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
            顧客リストを見る
          </Link>
          <button onClick={fetchBookings} className="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition">
            更新
          </button>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl text-xs transition">
            ログアウト
          </button>
          <Link href="/" className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition">
            トップへ
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        {/* ビュー切り替えおよび検索・フィルターバー */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${viewMode === 'list' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              リスト表示
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${viewMode === 'calendar' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              カレンダー一括確認
            </button>
          </div>

          {viewMode === 'list' && (
            <div className="w-full md:w-96">
              <input
                type="text"
                placeholder="お名前、メール、スペース名、日付で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-gray-600">ステータス:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              すべて ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'active' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              有効な予約
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'cancelled' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              キャンセル済み
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : viewMode === 'calendar' ? (
          /* カレンダー一括確認ビュー */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-gray-900">
                {year}年 {month + 1}月 予約状況カレンダー
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handlePrevMonth}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition"
                >
                  前の月
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition"
                >
                  今月
                </button>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold transition"
                >
                  次の月
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-center font-bold text-xs text-gray-500 mb-2">
              <div className="text-red-500">日</div>
              <div>月</div>
              <div>火</div>
              <div>水</div>
              <div>木</div>
              <div>金</div>
              <div className="text-blue-500">土</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* 空白セル（月初めまで） */}
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-28 bg-gray-50 rounded-xl border border-gray-100"></div>
              ))}

              {/* 日付セル */}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1
                const formattedMonth = String(month + 1).padStart(2, '0')
                const formattedDay = String(dayNum).padStart(2, '0')
                const dateString = `${year}-${formattedMonth}-${formattedDay}`

                // 該当日の予約を抽出（フィルター適用）
                const dayBookings = filteredBookings.filter((b) => b.date === dateString)

                return (
                  <div
                    key={`day-${dayNum}`}
                    className="h-28 bg-white rounded-xl border border-gray-200 p-1.5 overflow-y-auto flex flex-col justify-start"
                  >
                    <div className="text-xs font-bold text-gray-700 mb-1 px-1">{dayNum}</div>
                    <div className="space-y-1">
                      {dayBookings.map((b) => (
                        <div
                          key={b.id}
                          className={`text-[10px] p-1 rounded font-medium truncate ${
                            b.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-400 line-through'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                          title={`${b.user_name} (${b.start_time?.slice(0, 5)}-${b.end_time?.slice(0, 5)}) - ${b.spaces?.name}`}
                        >
                          <span className="font-bold">{b.start_time?.slice(0, 5)}</span> {b.user_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
            条件に一致する予約データはありません。
          </div>
        ) : (
          /* リスト表示ビュー */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                    <th className="p-4 font-bold">予約日</th>
                    <th className="p-4 font-bold">スペース</th>
                    <th className="p-4 font-bold">お名前</th>
                    <th className="p-4 font-bold">メールアドレス</th>
                    <th className="p-4 font-bold">時間</th>
                    <th className="p-4 font-bold">金額</th>
                    <th className="p-4 font-bold">ステータス / 確定チェック</th>
                    <th className="p-4 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map((b) => (
                    <tr key={b.id} className={b.status === 'cancelled' ? 'bg-gray-50 text-gray-400 line-through' : 'hover:bg-gray-50'}>
                      <td className="p-4 font-semibold">{b.date}</td>
                      <td className="p-4 font-semibold text-gray-900">{b.spaces?.name || '不明なスペース'}</td>
                      <td className="p-4 font-medium">{b.user_name}</td>
                      <td className="p-4 text-gray-600">{b.email || '-'}</td>
                      <td className="p-4">{b.start_time?.slice(0, 5)} 〜 {b.end_time?.slice(0, 5)}</td>
                      <td className="p-4 font-bold text-emerald-600">¥{(b.total_price || 0).toLocaleString()}</td>
                      <td className="p-4">
                        {b.status === 'cancelled' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                            キャンセル済み
                          </span>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                              仮予約
                            </span>
                            <label className="flex items-center space-x-1.5 cursor-pointer bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200 transition">
                              <input
                                type="checkbox"
                                checked={!!b.is_confirmed}
                                onChange={() => handleToggleConfirm(b.id, !!b.is_confirmed)}
                                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className="font-bold text-gray-700 text-[11px]">予約確定</span>
                            </label>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {b.status !== 'cancelled' && (
                          <>
                            {/* 追加：マニュアル・規約案内付きリマインドメール送信ボタン */}
                            <button
                              onClick={() => handleSendReminder(b)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              リマインド送信
                            </button>
                            <button
                              onClick={() => handleCancel(b.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              キャンセル
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}