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
  
  // ビュー切り替え（'list' または 'calendar' または 'sales'）
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'sales'>('list')
  // カレンダー用の選択年月
  const [currentDate, setCurrentDate] = useState(new Date())
  // 売上管理で選択されている月（"YYYY-MM"）
  const [selectedSalesMonth, setSelectedSalesMonth] = useState<string>('')
  // 売上管理で選択されている年（例: "2026", "2027" 等）
  const [selectedSalesYear, setSelectedSalesYear] = useState<string>('2026')

  // インライン編集用の状態管理
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    user_name: '',
    email: '',
    total_price: 0,
    rent: 0,
    labor: 0,
    date: '',
    start_time: '',
    end_time: '',
    status: 'active',
  })

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
      const fetchedBookings = data || []
      setBookings(fetchedBookings)
      setFilteredBookings(fetchedBookings)

      if (fetchedBookings.length > 0) {
        const months = Array.from(
          new Set(
            fetchedBookings
              .map((b: any) => (b.date ? b.date.slice(0, 7) : ''))
              .filter(Boolean)
          )
        ).sort().reverse() as string[]

        if (months.length > 0) {
          setSelectedSalesMonth(months[0])
          setSelectedSalesYear(months[0].slice(0, 4))
        }
      }
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

  const handleStartEdit = (b: any) => {
    setEditingBookingId(b.id)
    setEditForm({
      user_name: b.user_name || '',
      email: b.email || '',
      total_price: b.total_price || 0,
      rent: b.rent || 0,
      labor: b.labor || 0,
      date: b.date || '',
      start_time: b.start_time ? b.start_time.slice(0, 5) : '',
      end_time: b.end_time ? b.end_time.slice(0, 5) : '',
      status: b.status || 'active',
    })
  }

  const handleCancelEdit = () => {
    setEditingBookingId(null)
  }

  const handleSaveEdit = async (id: string) => {
    const updatePayload: any = {
      user_name: editForm.user_name,
      email: editForm.email,
      total_price: Number(editForm.total_price),
      rent: Number(editForm.rent),
      labor: Number(editForm.labor),
      date: editForm.date,
      status: editForm.status,
    }
    if (editForm.start_time) {
      updatePayload.start_time = editForm.start_time.length === 5 ? `${editForm.start_time}:00` : editForm.start_time
    }
    if (editForm.end_time) {
      updatePayload.end_time = editForm.end_time.length === 5 ? `${editForm.end_time}:00` : editForm.end_time
    }

    const { error } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      alert('更新に失敗しました: ' + error.message)
    } else {
      alert('予約情報を更新しました。')
      setEditingBookingId(null)
      fetchBookings()
    }
  }

  const handleSendReminder = (booking: any) => {
    if (!booking.email) {
      alert('お客様のメールアドレスが登録されていません。')
      return
    }
    if (confirm(`${booking.user_name} 様 (${booking.email}) 宛てに、入退出マニュアル・利用規約・ルールを記載したリマインドメールを送信しますか？`)) {
      alert('リマインドメールを送信しました！（入退出マニュアル・利用規約・ルール添付/案内済み）')
    }
  }

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

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)

  const availableMonths = Array.from(
    new Set(
      bookings
        .map((b) => (b.date ? b.date.slice(0, 7) : ''))
        .filter(Boolean)
    )
  ).sort().reverse() as string[]

  const availableYears = Array.from(
    new Set(
      bookings
        .map((b) => (b.date ? b.date.slice(0, 4) : ''))
        .filter(Boolean)
    )
  ).sort().reverse() as string[]
  
  if (availableYears.length === 0) {
    availableYears.push('2026')
  }

  const selectedYearBookings = bookings.filter((b) => b.date && b.date.startsWith(selectedSalesYear))
  const totalActiveSalesYear = selectedYearBookings.filter(b => b.status !== 'cancelled').reduce((acc, b) => acc + (b.total_price || 0), 0)
  const totalCancelledSalesYear = selectedYearBookings.filter(b => b.status === 'cancelled').reduce((acc, b) => acc + (b.total_price || 0), 0)

  const selectedMonthBookings = bookings.filter((b) => b.date && b.date.slice(0, 7) === selectedSalesMonth)

  const selectedMonthActiveSales = selectedMonthBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (b.total_price || 0), 0)

  const selectedMonthCancelledSales = selectedMonthBookings
    .filter((b) => b.status === 'cancelled')
    .reduce((acc, b) => acc + (b.total_price || 0), 0)

  const selectedMonthActiveCount = selectedMonthBookings.filter((b) => b.status !== 'cancelled').length
  const selectedMonthCancelledCount = selectedMonthBookings.filter((b) => b.status === 'cancelled').length

  // 各予約ごとの賃料・人件費を合計して月間トータルを算出
  const totalMonthRent = selectedMonthBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (b.rent || 0), 0)

  const totalMonthLabor = selectedMonthBookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((acc, b) => acc + (b.labor || 0), 0)

  const currentGrossProfit = selectedMonthActiveSales - (totalMonthRent + totalMonthLabor)

  const customerSalesMap: { [key: string]: { name: string; email: string; totalSpent: number; count: number } } = {}

  bookings.forEach((b) => {
    if (!b.date) return
    const price = b.total_price || 0

    if (b.status !== 'cancelled') {
      const custKey = b.email || b.user_name || '不明'
      if (!customerSalesMap[custKey]) {
        customerSalesMap[custKey] = { name: b.user_name || '不明', email: b.email || '-', totalSpent: 0, count: 0 }
      }
      customerSalesMap[custKey].totalSpent += price
      customerSalesMap[custKey].count += 1
    }
  })

  const sortedCustomers = Object.values(customerSalesMap).sort((a, b) => b.totalSpent - a.totalSpent)

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
            <button
              onClick={() => setViewMode('sales')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${viewMode === 'sales' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              売上管理
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

          {viewMode !== 'sales' && (
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
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : viewMode === 'sales' ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-sm font-bold text-gray-900">年間売上サマリー</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-600">対象年を選択:</span>
                  <div className="flex space-x-1">
                    {['2026', '2027', '2028', '2029', '2030'].map((y) => (
                      <button
                        key={y}
                        onClick={() => setSelectedSalesYear(y)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${selectedSalesYear === y ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {y}年
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 mb-1">{selectedSalesYear}年 総売上（有効な予約）</div>
                  <div className="text-2xl font-bold text-emerald-600">¥{totalActiveSalesYear.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <div className="text-xs font-bold text-gray-500 mb-1">{selectedSalesYear}年 キャンセル損失金額</div>
                  <div className="text-2xl font-bold text-red-500">¥{totalCancelledSalesYear.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* 月別個別予約・売上＆個別賃料・人件費・粗利管理カード */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-sm font-bold text-gray-900">月別売上・経費・粗利管理</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-600">表示月を選択:</span>
                  <select
                    value={selectedSalesMonth}
                    onChange={(e) => setSelectedSalesMonth(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold text-gray-900 focus:outline-none focus:border-emerald-500 bg-white"
                  >
                    {availableMonths.length === 0 ? (
                      <option value="">データなし</option>
                    ) : (
                      availableMonths.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* 賃料・人件費の集計および粗利表示エリア */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-200 items-center">
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">{selectedSalesMonth} 売上</div>
                  <div className="text-lg font-bold text-emerald-600">¥{selectedMonthActiveSales.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">賃料合計（経費）</div>
                  <div className="text-lg font-bold text-gray-700">¥{totalMonthRent.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">人件費合計（経費）</div>
                  <div className="text-lg font-bold text-gray-700">¥{totalMonthLabor.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-500 mb-1">月間 粗利（利益）</div>
                  <div className={`text-xl font-black ${currentGrossProfit >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                    ¥{currentGrossProfit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                      <th className="p-4 font-bold">予約日</th>
                      <th className="p-4 font-bold">スペース</th>
                      <th className="p-4 font-bold">お名前</th>
                      <th className="p-4 font-bold">メールアドレス</th>
                      <th className="p-4 font-bold">時間</th>
                      <th className="p-4 font-bold">ステータス</th>
                      <th className="p-4 font-bold">賃料</th>
                      <th className="p-4 font-bold">人件費</th>
                      <th className="p-4 font-bold text-right">金額</th>
                      <th className="p-4 font-bold text-right">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedMonthBookings.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-gray-500">
                          選択された月（{selectedSalesMonth}）の予約データはありません。
                        </td>
                      </tr>
                    ) : (
                      selectedMonthBookings.map((b) => {
                        const isEditing = editingBookingId === b.id

                        return (
                          <tr
                            key={b.id}
                            className={b.status === 'cancelled' ? 'bg-gray-50 text-gray-400 line-through' : 'hover:bg-gray-50'}
                          >
                            <td className="p-4 font-semibold">
                              {isEditing ? (
                                <input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                  className="w-32 px-2 py-1 border border-emerald-500 rounded text-xs font-semibold text-gray-900 bg-white"
                                />
                              ) : (
                                b.date
                              )}
                            </td>
                            <td className="p-4 font-semibold text-gray-900">{b.spaces?.name || '不明なスペース'}</td>
                            <td className="p-4 font-medium">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.user_name}
                                  onChange={(e) => setEditForm({ ...editForm, user_name: e.target.value })}
                                  className="w-full px-2 py-1 border border-emerald-500 rounded text-xs font-semibold text-gray-900 bg-white"
                                />
                              ) : (
                                b.user_name
                              )}
                            </td>
                            <td className="p-4 text-gray-600">
                              {isEditing ? (
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full px-2 py-1 border border-emerald-500 rounded text-xs text-gray-900 bg-white"
                                />
                              ) : (
                                b.email || '-'
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="time"
                                    value={editForm.start_time}
                                    onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                    className="w-20 px-1 py-1 border border-emerald-500 rounded text-xs text-gray-900 bg-white"
                                  />
                                  <span>〜</span>
                                  <input
                                    type="time"
                                    value={editForm.end_time}
                                    onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                    className="w-20 px-1 py-1 border border-emerald-500 rounded text-xs text-gray-900 bg-white"
                                  />
                                </div>
                              ) : (
                                `${b.start_time?.slice(0, 5)} 〜 ${b.end_time?.slice(0, 5)}`
                              )}
                            </td>
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  value={editForm.status}
                                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                  className="px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-gray-900 bg-white"
                                >
                                  <option value="active">有効</option>
                                  <option value="cancelled">キャンセル</option>
                                </select>
                              ) : b.status === 'cancelled' ? (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                                  キャンセル
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  有効
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-gray-600 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editForm.rent}
                                  onChange={(e) => setEditForm({ ...editForm, rent: Number(e.target.value) })}
                                  className="w-20 px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-right text-gray-900 bg-white"
                                />
                              ) : (
                                `¥${(b.rent || 0).toLocaleString()}`
                              )}
                            </td>
                            <td className="p-4 text-gray-600 font-medium">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editForm.labor}
                                  onChange={(e) => setEditForm({ ...editForm, labor: Number(e.target.value) })}
                                  className="w-20 px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-right text-gray-900 bg-white"
                                />
                              ) : (
                                `¥${(b.labor || 0).toLocaleString()}`
                              )}
                            </td>
                            <td className={`p-4 font-bold text-right ${b.status === 'cancelled' ? 'text-gray-400' : 'text-emerald-600'}`}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editForm.total_price}
                                  onChange={(e) => setEditForm({ ...editForm, total_price: Number(e.target.value) })}
                                  className="w-24 px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-right text-gray-900 bg-white"
                                />
                              ) : (
                                `¥${(b.total_price || 0).toLocaleString()}`
                              )}
                            </td>
                            <td className="p-4 text-right space-x-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(b.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded transition"
                                  >
                                    保存
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold px-2.5 py-1 rounded transition"
                                  >
                                    取消
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleStartEdit(b)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded transition"
                                >
                                  編集
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                  {selectedMonthBookings.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                        <td colSpan={5} className="p-4 text-right">【 {selectedSalesMonth} 合計 】</td>
                        <td className="p-4 text-xs font-semibold text-gray-600">
                          有効: {selectedMonthActiveCount}件 / キャンセル: {selectedMonthCancelledCount}件
                        </td>
                        <td className="p-4 text-gray-600">¥{totalMonthRent.toLocaleString()}</td>
                        <td className="p-4 text-gray-600">¥{totalMonthLabor.toLocaleString()}</td>
                        <td className="p-4 text-right">
                          <div className="text-emerald-600">売上: ¥{selectedMonthActiveSales.toLocaleString()}</div>
                          {selectedMonthCancelledSales > 0 && (
                            <div className="text-red-500 text-[10px]">失効: ¥{selectedMonthCancelledSales.toLocaleString()}</div>
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">利用者別 利用実績・売上集計</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                      <th className="p-4 font-bold">お名前</th>
                      <th className="p-4 font-bold">メールアドレス</th>
                      <th className="p-4 font-bold">利用回数</th>
                      <th className="p-4 font-bold text-emerald-600">総利用金額</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {sortedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">データがありません。</td>
                      </tr>
                    ) : (
                      sortedCustomers.map((cust, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 font-bold text-gray-900">{cust.name}</td>
                          <td className="p-4 text-gray-600">{cust.email}</td>
                          <td className="p-4 font-medium">{cust.count} 回</td>
                          <td className="p-4 font-bold text-emerald-600">¥{cust.totalSpent.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
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
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="h-28 bg-gray-50 rounded-xl border border-gray-100"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, index) => {
                const dayNum = index + 1
                const formattedMonth = String(month + 1).padStart(2, '0')
                const formattedDay = String(dayNum).padStart(2, '0')
                const dateString = `${year}-${formattedMonth}-${formattedDay}`

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