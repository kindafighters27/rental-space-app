'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Space = {
  id: string
  name: string
  description: string
  price_per_hour: number
  image_url: string
}

type Booking = {
  id: string
  space_id: string
  booking_date: string
  start_time: string
  end_time: string
}

export default function Home() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('16:00')

  const defaultImage = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80"

  // 1. スペース情報と予約一覧を取得
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: spacesData } = await supabase.from('COCOKARA予約アプリ').select('*')
    const { data: bookingsData } = await supabase.from('bookings').select('*')

    if (spacesData) setSpaces(spacesData)
    if (bookingsData) setBookings(bookingsData)
  }

  // 2. 今日から向こう14日間の日付リストを生成 (YYYY-MM-DD)
  const getNext14Days = () => {
    const days = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const month = d.getMonth() + 1
      const date = d.getDate()
      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()]
      days.push({ dateStr, display: `${month}/${date}`, dayOfWeek })
    }
    return days
  }

  const next14Days = getNext14Days()

  // 3. 指定したスペース・日付の空き状況マークを取得
  const getAvailabilityStatus = (spaceId: string, dateStr: string) => {
    const spaceBookings = bookings.filter(
      (b) => b.space_id === spaceId && b.booking_date === dateStr
    )
    if (spaceBookings.length === 0) return { mark: '○', color: 'text-green-400' }
    if (spaceBookings.length >= 3) return { mark: '×', color: 'text-red-500' }
    return { mark: '△', color: 'text-yellow-400' }
  }

  // 予約送信処理
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSpace) return

    // 重複チェック
    const { data: existingBookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('space_id', selectedSpace.id)
      .eq('booking_date', bookingDate)

    const isOverlap = existingBookings?.some((b) => {
      return startTime < b.end_time && endTime > b.start_time
    })

    if (isOverlap) {
      alert('申し訳ありません。ご指定の時間帯は既に予約が入っています。')
      return
    }

    const { error } = await supabase.from('bookings').insert([
      {
        space_id: selectedSpace.id,
        user_name: userName,
        user_email: userEmail,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
      },
    ])

    if (error) {
      alert('予約に失敗しました: ' + error.message)
    } else {
      alert('予約が完了しました！')
      setSelectedSpace(null)
      fetchData() // 予約リストを最新化
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-3xl font-bold mb-8 text-center">COCOKARAレンタルスペース</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {spaces.map((space) => (
          <div key={space.id} className="border border-gray-700 rounded-xl overflow-hidden shadow-md bg-gray-900 flex flex-col justify-between">
            <div>
              <div className="w-full h-48 bg-gray-800 overflow-hidden">
                <img
                  src={space.image_url || defaultImage}
                  alt={space.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5">
                <h2 className="text-xl font-bold mb-2">{space.name}</h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{space.description}</p>
                <p className="text-lg font-bold text-blue-400 mb-4">
                  ¥{space.price_per_hour?.toLocaleString()}<span className="text-sm font-normal text-gray-400">/時間</span>
                </p>

                {/* 14日間 空き状況カレンダー表示 */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <p className="text-xs text-gray-400 mb-2 font-medium">直近14日間の空き状況</p>
                  <div className="overflow-x-auto pb-1">
                    <div className="grid grid-flow-col auto-cols-[minmax(40px,1fr)] gap-2 text-center bg-gray-950 p-2 rounded-lg border border-gray-800 min-w-max">
                      {next14Days.map((day) => {
                        const status = getAvailabilityStatus(space.id, day.dateStr)
                        return (
                          <div key={day.dateStr} className="flex flex-col items-center min-w-[36px]">
                            <span className="text-[10px] text-gray-400">{day.dayOfWeek}</span>
                            <span className="text-[10px] text-gray-300 font-mono mb-1">{day.display}</span>
                            <span className={`text-sm font-bold ${status.color}`}>
                              {status.mark}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="p-5 pt-0">
              <button
                onClick={() => setSelectedSpace(space)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
              >
                予約する
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 予約モーダル (ダイアログ) */}
      {selectedSpace && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedSpace(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold mb-4">{selectedSpace.name} の予約</h2>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">お名前</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">メールアドレス</label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ご利用希望日</label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">開始時間</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">終了時間</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition mt-6"
              >
                予約リクエストを送信
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}