'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [spaces, setSpaces] = useState<any[]>([])
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('')
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpaces()
  }, [])

  useEffect(() => {
    if (selectedSpaceId) {
      fetchBookings(selectedSpaceId)
    }
  }, [selectedSpaceId])

  const fetchSpaces = async () => {
    const { data, error } = await supabase.from('spaces').select('*')
    if (error) {
      console.error('スペース取得エラー:', error)
    } else if (data && data.length > 0) {
      setSpaces(data)
      setSelectedSpaceId(data[0].id)
    }
    setLoading(false)
  }

  const fetchBookings = async (spaceId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('space_id', spaceId)
      .neq('status', 'cancelled')

    if (error) {
      console.error('予約情報取得エラー:', error)
    } else {
      setBookings(data || [])
    }
  }

  // 2週間分のカレンダー生成
  const today = new Date()
  const calendarDays = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date()
    d.setDate(today.getDate() + i)
    return d
  })

  // 選択中のスペース情報
  const currentSpace = spaces.find((s) => s.id === selectedSpaceId)

  // デフォルトのきれいなポーカー・レンタルスペース画像（DBに画像がない場合のフォールバック）
  const spaceImage = currentSpace?.image_url || currentSpace?.image || 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=1200&q=80'

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      {/* ヘッダーナビ */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {currentSpace ? currentSpace.name : 'レンタルスペース'}
          </h1>
          <p className="text-xs text-gray-500">プライベート空間の予約システム</p>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/admin"
            className="bg-gray-800 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            管理者画面
          </Link>
          <Link
            href="/admin/customers"
            className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-emerald-700 transition"
          >
            顧客リスト
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-4xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
            
            {/* 📸 スペースの写真エリア */}
            <div className="relative h-64 md:h-80 w-full bg-gray-200">
              <img
                src={spaceImage}
                alt={currentSpace?.name || 'スペース画像'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    募集中
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold mt-2">
                    {currentSpace?.name}
                  </h2>
                </div>
              </div>
            </div>

            {/* スペース詳細・説明 */}
            <div className="p-6 border-b border-gray-100">
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {currentSpace?.description || 'アミューズメントポーカーテーブル完備！各種撮影、ボードゲーム会、教室利用などに最適な完全プライベート空間です。'}
              </p>

              {/* 料金プランの紹介カード */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h3 className="text-xs font-bold text-amber-900 mb-2">🏷️ 利用料金プラン</h3>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• <strong>基本料金（1〜6時間まで）:</strong> ¥15,000</li>
                  <li>• <strong>6時間超過分:</strong> 1時間につき +¥2,500</li>
                </ul>
              </div>
            </div>

            {/* カレンダーセクション */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 text-base">📅 予約空き状況 (2週間)</h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {calendarDays.map((dateObj, index) => {
                  const year = dateObj.getFullYear()
                  const month = String(dateObj.getMonth() + 1).padStart(2, '0')
                  const day = String(dateObj.getDate()).padStart(2, '0')
                  const dateStr = `${year}-${month}-${day}`

                  const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][dateObj.getDay()]
                  
                  // 曜日ごとの色分け
                  let dayColor = 'text-gray-800'
                  if (dayOfWeek === '土') dayColor = 'text-blue-600'
                  if (dayOfWeek === '日') dayColor = 'text-red-600'

                  // その日の既存予約を抽出
                  const dayBookings = bookings.filter((b) => {
                    const bDate = b.booking_date || b.date
                    if (!bDate) return false
                    return String(bDate).slice(0, 10) === dateStr
                  })

                  // 簡易的な満室判定（もし19:00〜01:00などの丸一日予約や複数予約で埋まっている場合を想定。必要に応じて調整可能）
                  // ここでは「すでに予約があるかどうか」で判定の目安を出します
                  const isFullyBooked = dayBookings.some((b) => {
                    // 例として、全時間帯を塞ぐ予約（例: 19:00〜01:00など）がある場合を判定
                    const start = b.start_time?.slice(0, 5)
                    const end = b.end_time?.slice(0, 5)
                    return (start === '19:00' && (end === '01:00' || end === '01:30' || end === '02:00')) || dayBookings.length >= 3
                  })

                  return (
                    <Link
                      key={index}
                      href={`/book?space_id=${selectedSpaceId}&date=${dateStr}`}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition ${
                        isFullyBooked
                          ? 'bg-red-50 border-red-200 hover:bg-red-100'
                          : 'bg-white border-gray-200 hover:border-emerald-500 hover:shadow-md'
                      }`}
                    >
                      <span className={`text-xs font-bold ${dayColor}`}>
                        {month}/{day} ({dayOfWeek})
                      </span>
                      <span className="mt-2">
                        {isFullyBooked ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ✕ 予約不可
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ◯ 空きあり
                          </span>
                        )}
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  )
}