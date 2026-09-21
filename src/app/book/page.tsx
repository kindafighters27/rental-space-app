'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 選択できる時間リスト
const timeOptions = [
  { label: '06:00', value: '06:00' },
  { label: '07:00', value: '07:00' },
  { label: '08:00', value: '08:00' },
  { label: '09:00', value: '09:00' },
  { label: '10:00', value: '10:00' },
  { label: '11:00', value: '11:00' },
  { label: '12:00', value: '12:00' },
  { label: '13:00', value: '13:00' },
  { label: '14:00', value: '14:00' },
  { label: '15:00', value: '15:00' },
  { label: '16:00', value: '16:00' },
  { label: '17:00', value: '17:00' },
  { label: '18:00', value: '18:00' },
  { label: '19:00', value: '19:00' },
  { label: '20:00', value: '20:00' },
  { label: '21:00', value: '21:00' },
  { label: '22:00', value: '22:00' },
  { label: '23:00', value: '23:00' },
  { label: '24:00 (翌0:00)', value: '24:00' },
  { label: '25:00 (翌1:00)', value: '25:00' },
  { label: '26:00 (翌2:00)', value: '26:00' },
  { label: '27:00 (翌3:00)', value: '27:00' },
  { label: '28:00 (翌4:00)', value: '28:00' },
]

function formatDbTime(timeStr: string) {
  const hour = parseInt(timeStr.split(':')[0], 10)
  if (hour >= 24) {
    const adjustedHour = hour - 24
    const formattedHour = String(adjustedHour).padStart(2, '0')
    return `${formattedHour}:00:00`
  }
  return `${timeStr}:00`
}

function BookingForm() {
  const searchParams = useSearchParams()
  const spaceId = searchParams.get('space_id')
  const selectedDate = searchParams.get('date')

  const [space, setSpace] = useState<any>(null)
  const [existingBookings, setExistingBookings] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [startTime, setStartTime] = useState('19:00')
  const [endTime, setEndTime] = useState('21:00')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // スペース情報と、その日の既存予約一覧を取得
  useEffect(() => {
    if (spaceId) {
      supabase.from('spaces').select('*').eq('id', spaceId).single()
        .then(({ data }) => setSpace(data))
    }

    if (selectedDate) {
      supabase.from('bookings').select('*')
        .or(`date.eq.${selectedDate},booking_date.eq.${selectedDate}`)
        .then(({ data }) => {
          if (data) setExistingBookings(data)
        })
    }
  }, [spaceId, selectedDate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userName || !userEmail) {
      alert('お名前とメールアドレスを入力してください。')
      return
    }

    setLoading(true)

    const dbStartTime = formatDbTime(startTime)
    const dbEndTime = formatDbTime(endTime)

    const { error } = await supabase.from('bookings').insert([
      {
        space_id: spaceId,
        user_name: userName,
        user_email: userEmail,
        date: selectedDate,
        booking_date: selectedDate,
        start_time: dbStartTime,
        end_time: dbEndTime,
      },
    ])

    setLoading(false)

    if (error) {
      alert('予約エラー: ' + error.message)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md text-center space-y-4 max-w-md mx-auto border border-gray-200">
        <h2 className="text-2xl font-bold text-emerald-600">予約が完了しました！</h2>
        <p className="text-gray-700 text-sm">
          ご予約時間: <span className="font-bold text-gray-900">{startTime} 〜 {endTime}</span>
        </p>
        <p className="text-gray-600 text-xs">ご予約ありがとうございます。当日お会いできるのを楽しみにしております。</p>
        <a
          href="/"
          className="inline-block mt-4 bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          トップページに戻る
        </a>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-md mx-auto border border-gray-200">
      <a
        href="/"
        className="text-sm text-emerald-700 hover:text-emerald-900 mb-4 inline-flex items-center font-bold hover:underline"
      >
        ← カレンダーに戻る
      </a>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">予約申し込み</h1>
      {space && (
        <div className="bg-emerald-50 text-emerald-900 p-3 rounded-lg text-sm mb-4 border border-emerald-200">
          <p className="font-bold">{space.name}</p>
          <p>予約日: <span className="font-semibold">{selectedDate}</span></p>
        </div>
      )}

      {/* すでに予約が入っている時間帯を表示 */}
      <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
        <p className="font-bold mb-1">⚠️ 本日の予約済み時間帯:</p>
        {existingBookings.length === 0 ? (
          <p className="text-emerald-700 font-medium">現在、予約はありません（終日空いています）</p>
        ) : (
          <ul className="list-disc list-inside space-y-0.5 font-semibold text-amber-800">
            {existingBookings.map((b, i) => {
              const start = b.start_time ? b.start_time.slice(0, 5) : '不明'
              const end = b.end_time ? b.end_time.slice(0, 5) : '不明'
              return <li key={i}>{start} 〜 {end}（予約済み）</li>
            })}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">お名前</label>
          <input
            type="text"
            required
            placeholder="山田 太郎"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1">メールアドレス</label>
          <input
            type="email"
            required
            placeholder="example@email.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">開始時間</label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
            >
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">終了時間</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-semibold"
            >
              {timeOptions.map((t) => (
                <option key={t.value} value={t.value} className="text-gray-900">{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition duration-200 mt-6 disabled:opacity-50"
        >
          {loading ? '送信中...' : '予約を確定する'}
        </button>
      </form>
    </div>
  )
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 flex items-center justify-center">
      <Suspense fallback={<div className="text-gray-800 font-bold">読み込み中...</div>}>
        <BookingForm />
      </Suspense>
    </main>
  )
}