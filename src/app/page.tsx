'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [spaces, setSpaces] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: spaceData } = await supabase.from('spaces').select('*')
    if (spaceData) setSpaces(spaceData)

    // 有効な（キャンセルされていない）予約のみを取得
    const { data: bookingData, error } = await supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')

    if (error) {
      console.error('予約データの取得に失敗しました:', error.message)
    }

    if (bookingData) {
      const validBookings = bookingData.filter(
        (b) => b.status !== 'cancelled' && b.status !== 'CANCELED'
      )
      setBookings(validBookings)
    }
    setLoading(false)
  }

  // 今後2週間の日付リストを生成
  const generateDates = () => {
    const dates = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      dates.push(`${year}-${month}-${day}`)
    }
    return dates
  }

  const dates = generateDates()

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600 font-medium">読み込み中...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">COCOKARA レンタルスペース</h1>
            <p className="text-sm text-gray-500 mt-1">
              アミューズメントポーカーテーブル完備！プライベート空間の予約システム。
            </p>
          </div>
          <div className="space-x-2">
            <a
              href="/admin"
              className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-900 transition"
            >
              管理者画面
            </a>
            <a
              href="/admin/customers"
              className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              顧客リスト
            </a>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-sm font-bold text-gray-800 mb-2">💰 利用料金プラン</h2>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• 基本料金 (1〜6時間まで): ¥15,000</li>
            <li>• 6時間超分: 1時間につき +¥2,500</li>
          </ul>
        </div>

        {spaces.map((space) => (
          <div key={space.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{space.name} の予約空き状況 (2週間)</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {dates.map((dateStr) => {
                const dayBookings = bookings.filter(
                  (b) => 
                    b.space_id === space.id && 
                    (b.date === dateStr || b.booking_date === dateStr)
                )
                const isBooked = dayBookings.length > 0

                const dateObj = new Date(dateStr)
                const month = dateObj.getMonth() + 1
                const day = dateObj.getDate()
                const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()]

                return isBooked ? (
                  // 予約が入っている場合は「×」を表示し、クリックできないようにする（divタグにする）
                  <div
                    key={dateStr}
                    className="p-3 rounded-lg border text-center flex flex-col justify-between items-center bg-red-50 border-red-200 opacity-80 cursor-not-allowed"
                  >
                    <div>
                      <span className="text-xs font-semibold text-gray-500">
                        {month}/{day} ({dayOfWeek})
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-red-700 bg-red-200 px-2.5 py-0.5 rounded-full">
                        × 予約不可
                      </span>
                    </div>
                  </div>
                ) : (
                  // 空きがある場合はこれまで通り予約ページへのリンクにする
                  <a
                    key={dateStr}
                    href={`/book?space_id=${space.id}&date=${dateStr}`}
                    className="p-3 rounded-lg border text-center transition flex flex-col justify-between items-center bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                  >
                    <div>
                      <span className="text-xs font-semibold text-gray-600">
                        {month}/{day} ({dayOfWeek})
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200 px-2.5 py-0.5 rounded-full">
                        空きあり
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}