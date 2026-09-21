'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 料金計算関数
function calculatePrice(start: string, end: string) {
  if (!start || !end) return { duration: 0, price: 0 }
  const startHour = parseInt(start.split(':')[0], 10)
  let endHour = parseInt(end.split(':')[0], 10)
  
  // 深夜帯の計算補助（終了時刻が開始時刻より小さい場合は翌日扱い）
  if (endHour < startHour) endHour += 24

  const duration = endHour - startHour
  if (duration <= 0) return { duration: 0, price: 0 }

  if (duration <= 6) {
    return { duration, price: 15000 }
  } else {
    return { duration, price: 15000 + (duration - 6) * 2500 }
  }
}

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('予約データの取得に失敗しました:', error)
    } else if (data) {
      setBookings(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('この予約をキャンセル（削除）してもよろしいですか？')) return

    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) {
      alert('削除に失敗しました: ' + error.message)
    } else {
      alert('予約を削除しました。')
      fetchBookings()
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <p className="text-sm text-gray-500">予約一覧の確認・キャンセル管理ができます</p>
          </div>
          <a
            href="/"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 transition"
          >
            ← トップページを見る
          </a>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">現在の予約一覧</h2>

          {loading ? (
            <p className="text-gray-500 py-4 text-center font-medium">読み込み中...</p>
          ) : bookings.length === 0 ? (
            <p className="text-gray-500 py-4 text-center font-medium">予約データはありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-100 text-gray-900 font-bold uppercase text-xs">
                  <tr>
                    <th className="p-3">予約日</th>
                    <th className="p-3">利用時間</th>
                    <th className="p-3">予想料金</th>
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3 text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.map((b) => {
                    const dateStr = b.date || b.booking_date || '未設定'
                    const startTimeStr = b.start_time ? b.start_time.slice(0, 5) : ''
                    const endTimeStr = b.end_time ? b.end_time.slice(0, 5) : ''
                    
                    const timeDisplay = startTimeStr && endTimeStr 
                      ? `${startTimeStr} 〜 ${endTimeStr}`
                      : startTimeStr || '-'

                    const { price } = calculatePrice(startTimeStr, endTimeStr)

                    return (
                      <tr key={b.id} className="hover:bg-gray-50">
                        <td className="p-3 font-semibold text-gray-900">{dateStr}</td>
                        <td className="p-3 font-bold text-emerald-700">
                          {timeDisplay}
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          {price > 0 ? `¥${price.toLocaleString()}` : '-'}
                        </td>
                        <td className="p-3 font-medium text-gray-900">{b.user_name || '-'}</td>
                        <td className="p-3 text-gray-600">{b.user_email || '-'}</td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white px-3 py-1 rounded text-xs font-bold transition duration-150"
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
          )}
        </div>
      </div>
    </main>
  )
}