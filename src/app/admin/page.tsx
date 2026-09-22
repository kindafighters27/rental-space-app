'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '0509') {
      setIsAuthenticated(true)
      fetchBookings()
    } else {
      alert('パスワードが違います')
    }
  }

  const fetchBookings = async () => {
    setLoading(true)
    // キャンセルされていない（有効な）予約のみを取得
    const { data, error } = await supabase
      .from('bookings')
      .select('*, spaces(name)')
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    if (error) {
      console.error('予約データの取得に失敗しました:', error.message)
    } else if (data) {
      setBookings(data)
    }
    setLoading(false)
  }

  // キャンセル処理：確実にSupabaseのstatusを 'cancelled' に更新する
  const handleCancel = async (id: string) => {
    if (!confirm('この予約をキャンセル（予約管理画面から非表示・トップページの空きを復旧）しますか？')) {
      return
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (error) {
      alert('キャンセル処理に失敗しました: ' + error.message)
    } else {
      alert('予約をキャンセルしました')
      fetchBookings() // リストを再取得して画面を更新
    }
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-sm w-full border border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4 text-center">管理者ログイン</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold p-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              ログイン
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/" className="text-sm text-emerald-600 hover:underline">← トップページに戻る</a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード（予約一覧）</h1>
          <div className="space-x-2">
            <a
              href="/admin/customers"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              顧客リストを見る
            </a>
            <button
              onClick={fetchBookings}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              更新
            </button>
            <a
              href="/"
              className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              トップへ
            </a>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 font-medium text-center py-10">読み込み中...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 text-center">
            <p className="text-gray-600 font-medium">現在、有効な予約データはありません。</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-sm text-gray-700">
                    <th className="p-3">予約日</th>
                    <th className="p-3">スペース</th>
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3">時間</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
                  {bookings.map((b) => {
                    const start = b.start_time ? b.start_time.slice(0, 5) : ''
                    const end = b.end_time ? b.end_time.slice(0, 5) : ''
                    return (
                      <tr key={b.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-semibold">{b.date || b.booking_date}</td>
                        <td className="p-3">{b.spaces?.name || '不明'}</td>
                        <td className="p-3 font-bold">{b.user_name}</td>
                        <td className="p-3 text-gray-600">{b.user_email}</td>
                        <td className="p-3">{start} ～ {end}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleCancel(b.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg border border-red-200 transition text-xs"
                          >
                            キャンセル
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}