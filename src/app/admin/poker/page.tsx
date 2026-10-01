'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPokerPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'cancelled'>('active')

  // インライン編集用の状態管理
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    user_name: '',
    email: '',
    total_price: 0,
    date: '',
    start_time: '',
    people_count: 1,
    course_type: 'beginner',
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
      .from('poker_bookings')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('ポーカー予約一覧取得エラー:', error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  const handleToggleConfirm = async (id: string, currentConfirmed: boolean) => {
    const newConfirmed = !currentConfirmed
    const { error } = await supabase
      .from('poker_bookings')
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
      .from('poker_bookings')
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
      date: b.date || '',
      start_time: b.start_time ? b.start_time.slice(0, 5) : '',
      people_count: b.people_count || 1,
      course_type: b.course_type || 'beginner',
      status: b.status || 'active',
    })
  }

  const handleCancelEdit = () => {
    setEditingBookingId(null)
  }

  const handleSaveEdit = async (id: string) => {
    const updatePayload = {
      user_name: editForm.user_name,
      email: editForm.email,
      total_price: Number(editForm.total_price),
      date: editForm.date,
      start_time: editForm.start_time,
      people_count: Number(editForm.people_count),
      course_type: editForm.course_type,
      status: editForm.status,
    }

    const { error } = await supabase
      .from('poker_bookings')
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-lg font-bold text-gray-900 mb-6 text-center">ポーカー道場 管理者ログイン</h1>
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
              <Link href="/admin" className="text-xs text-gray-500 hover:underline">
                ← レンタルスペース管理者画面に戻る
              </Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  const filteredBookings = bookings.filter((b) => {
    if (statusFilter === 'active' && b.status === 'cancelled') return false
    if (statusFilter === 'cancelled' && b.status !== 'cancelled') return false

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      return (
        b.user_name?.toLowerCase().includes(term) ||
        b.email?.toLowerCase().includes(term) ||
        b.date?.includes(term)
      )
    }
    return true
  })

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">ポーカー道場 管理者ダッシュボード</h1>
        <div className="flex space-x-3 items-center">
          <button onClick={fetchBookings} className="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition">
            更新
          </button>
          <Link href="/admin" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
            レンタルスペース管理へ
          </Link>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl text-xs transition">
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="お名前、メール、日付で検索..."
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
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                    <th className="p-4 font-bold">開催日・時間</th>
                    <th className="p-4 font-bold">コース</th>
                    <th className="p-4 font-bold">お名前</th>
                    <th className="p-4 font-bold">メールアドレス</th>
                    <th className="p-4 font-bold text-center">人数</th>
                    <th className="p-4 font-bold">ステータス</th>
                    <th className="p-4 font-bold">予約確定</th>
                    <th className="p-4 font-bold text-right">金額</th>
                    <th className="p-4 font-bold text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-gray-500">
                        ポーカー道場の予約データはありません。
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => {
                      const isEditing = editingBookingId === b.id

                      return (
                        <tr
                          key={b.id}
                          className={b.status === 'cancelled' ? 'bg-gray-50 text-gray-400 line-through' : 'hover:bg-gray-50'}
                        >
                          <td className="p-4 font-semibold">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="date"
                                  value={editForm.date}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                  className="w-32 px-2 py-1 border border-emerald-500 rounded text-xs font-semibold text-gray-900 bg-white"
                                />
                                <input
                                  type="time"
                                  value={editForm.start_time}
                                  onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                  className="w-24 px-2 py-1 border border-emerald-500 rounded text-xs text-gray-900 bg-white"
                                />
                              </div>
                            ) : (
                              <>
                                <div>{b.date}</div>
                                <div className="text-[10px] text-gray-500 font-normal">{b.start_time} 〜</div>
                              </>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-gray-900">
                            {isEditing ? (
                              <select
                                value={editForm.course_type}
                                onChange={(e) => setEditForm({ ...editForm, course_type: e.target.value })}
                                className="px-2 py-1 border border-emerald-500 rounded text-xs font-bold text-gray-900 bg-white"
                              >
                                <option value="beginner">初心者講習</option>
                                <option value="practice">実践編</option>
                              </select>
                            ) : (
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${b.course_type === 'beginner' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                {b.course_type === 'beginner' ? '初心者講習' : '実践編'}
                              </span>
                            )}
                          </td>
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
                          <td className="p-4 text-center font-bold">
                            {isEditing ? (
                              <input
                                type="number"
                                min={1}
                                value={editForm.people_count}
                                onChange={(e) => setEditForm({ ...editForm, people_count: Number(e.target.value) })}
                                className="w-16 px-2 py-1 border border-emerald-500 rounded text-xs text-center text-gray-900 bg-white"
                              />
                            ) : (
                              `${b.people_count || 1}名`
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
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleConfirm(b.id, b.is_confirmed)}
                              className={`px-3 py-1 rounded-xl text-[10px] font-bold transition shadow-sm ${
                                b.is_confirmed
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              {b.is_confirmed ? '確定済み' : '未確定'}
                            </button>
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
                              <>
                                <button
                                  onClick={() => handleStartEdit(b)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-2.5 py-1 rounded transition"
                                >
                                  編集
                                </button>
                                {b.status !== 'cancelled' && (
                                  <button
                                    onClick={() => handleCancel(b.id)}
                                    className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded transition"
                                  >
                                    キャンセル
                                  </button>
                                )}
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}