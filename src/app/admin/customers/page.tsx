'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CustomersPage() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '0509') {
      setIsAuthenticated(true)
      fetchCustomers()
    } else {
      alert('パスワードが違います')
    }
  }

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('user_name, user_email, date, start_time, end_time, status')
      .order('date', { ascending: false })

    if (error) {
      console.error('顧客データの取得に失敗しました:', error)
    } else if (data) {
      const customerMap: { [key: string]: any } = {}

      data.forEach((booking) => {
        const email = booking.user_email || '不明'
        if (!customerMap[email]) {
          customerMap[email] = {
            name: booking.user_name,
            email: email,
            bookingCount: 0,
            latestDate: booking.date,
            history: [],
          }
        }
        customerMap[email].bookingCount += 1
        customerMap[email].history.push({
          date: booking.date,
          time: `${booking.start_time?.slice(0, 5) || ''} 〜 ${booking.end_time?.slice(0, 5) || ''}`,
          isCancelled: booking.status === 'cancelled',
        })
      })

      setCustomers(Object.values(customerMap))
    }
    setLoading(false)
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
                className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="パスワードを入力"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition"
            >
              ログイン
            </button>
          </form>
          <div className="mt-4 text-center">
            <a href="/admin" className="text-sm text-emerald-600 hover:underline">← 管理画面（予約一覧）に戻る</a>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">顧客リスト（顧客管理）</h1>
          <div className="space-x-4">
            <a
              href="/admin"
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              予約一覧へ戻る
            </a>
            <button
              onClick={fetchCustomers}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition"
            >
              更新
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600 font-medium text-center py-10">読み込み中...</p>
        ) : customers.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-md text-center border border-gray-200">
            <p className="text-gray-600 font-medium">現在、登録されている顧客データはありません。</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-700 text-sm">
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3 text-center">総予約回数</th>
                    <th className="p-3">直近の予約日</th>
                    <th className="p-3">予約履歴（※キャンセル含む）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm text-gray-800">
                  {customers.map((c, index) => (
                    <tr key={index} className="hover:bg-gray-50 align-top">
                      <td className="p-3 font-bold">{c.name}</td>
                      <td className="p-3 text-gray-600">{c.email}</td>
                      <td className="p-3 text-center font-semibold text-emerald-600">{c.bookingCount}回</td>
                      <td className="p-3 font-medium">{c.latestDate}</td>
                      <td className="p-3 text-xs text-gray-500 space-y-1">
                        {c.history.map((h: any, i: number) => (
                          <div key={i} className={h.isCancelled ? 'line-through text-red-400' : ''}>
                            • {h.date} ({h.time}) {h.isCancelled && '[キャンセル済み]'}
                          </div>
                        ))}
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