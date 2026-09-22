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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('all')

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
    // パスワードを 0509 に変更
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
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="お名前、メール、スペース名、日付で検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
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
                      <td className="p-4 text-right">
                        {b.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg transition"
                          >
                            キャンセル
                          </button>
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