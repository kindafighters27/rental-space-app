'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function AdminPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 予約データとスペースデータの取得
  const fetchData = async () => {
    setLoading(true)
    const { data: spacesData } = await supabase.from('spaces').select('*')
    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .order('booking_date', { ascending: true })

    if (spacesData) setSpaces(spacesData)
    if (bookingsData) setBookings(bookingsData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // 予約キャンセル（削除）機能
  const handleDelete = async (id: string) => {
    if (!confirm('この予約を削除（キャンセル）してもよろしいですか？')) return

    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) {
      alert('削除に失敗しました: ' + error.message)
    } else {
      alert('予約を削除しました')
      fetchData() // 再読み込み
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* ヘッダー */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">管理者ダッシュボード</h1>
            <p className="text-sm text-gray-500">予約一覧の確認・キャンセル管理ができます</p>
          </div>
          <Link
            href="/"
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition font-medium"
          >
            ← トップページを見る
          </Link>
        </div>

        {/* 予約一覧 */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">現在の予約一覧</h2>

          {loading ? (
            <p className="text-gray-500 text-sm py-4 text-center">読み込み中...</p>
          ) : bookings.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">現在、予約はありません。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-700 border-b border-gray-200">
                    <th className="p-3">予約日</th>
                    <th className="p-3">時間</th>
                    <th className="p-3">お名前</th>
                    <th className="p-3">メールアドレス</th>
                    <th className="p-3">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bookings.map((booking) => {
                    const timeOnly = booking.start_time
                      ? booking.start_time.split('T')[1]?.slice(0, 5) || ''
                      : ''

                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition">
                        <td className="p-3 font-semibold text-gray-800">{booking.booking_date}</td>
                        <td className="p-3">{timeOnly ? `${timeOnly}〜` : '-'}</td>
                        <td className="p-3 font-medium text-gray-800">{booking.user_name}</td>
                        <td className="p-3 text-gray-500">{booking.user_email}</td>
                        <td className="p-3">
                          <button
                            onClick={() => handleDelete(booking.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-red-200"
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