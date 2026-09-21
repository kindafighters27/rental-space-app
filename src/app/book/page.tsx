'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

function calculatePrice(start: string, end: string) {
  const startHour = parseInt(start.split(':')[0], 10)
  const endHour = parseInt(end.split(':')[0], 10)
  const duration = endHour - startHour

  if (duration <= 0) return { duration: 0, price: 0 }

  if (duration <= 6) {
    return { duration, price: 15000 }
  } else {
    const extraHours = duration - 6
    const price = 15000 + extraHours * 2500
    return { duration, price }
  }
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
  const [endTime, setEndTime] = useState('25:00')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const { duration, price } = calculatePrice(startTime, endTime)

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

    if (duration <= 0) {
      alert('終了時間は開始時間より後の時間を選択してください。')
      return
    }

    if (!userName || !userEmail) {
      alert('お名前とメールアドレスを入力してください。')
      return
    }

    setLoading(true)

    const dbStartTime = formatDbTime(startTime)
    const dbEndTime = formatDbTime(endTime)

    // 1. データベースに予約を保存
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

    if (error) {
      setLoading(false)
      alert('予約エラー: ' + error.message)
      return
    }

    // 2. 管理者へメールを送信
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          userEmail,
          date: selectedDate,
          startTime,
          endTime,
          duration,
          price,
        }),
      })
    } catch (mailError) {
      console.error('メール送信に失敗しました:', mailError)
    }

    setLoading(false)
    setDone(true)
  }

  if (done) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md text-center space-y-4 max-w-md mx-auto border border-gray-200">
        <h2 className="text-2xl font-bold text-emerald-600">予約が完了しました！</h2>
        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-800 space-y-1">
          <p>ご予約時間: <span className="font-bold">{startTime} 〜 {endTime} ({duration}時間)</span></p>
          <p>ご利用料金: <span className="font-bold text-emerald-600 text-lg">¥{price.toLocaleString()}</span></p>
        </div>
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

        <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 text-center">
          {duration > 0 ? (
            <div>
              <p className="text-xs text-gray-600 font-medium">利用時間: {duration} 時間</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                ¥{price.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                {duration <= 6 ? '（6時間基本プラン）' : `（基本15,000円 ＋ 超過${duration - 6}時間分）`}
              </p>
            </div>
          ) : (
            <p className="text-xs text-red-500 font-bold">正しく時間を指定してください</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || duration <= 0}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition duration-200 mt-6 disabled:opacity-50"
        >
          {loading ? '予約送信中...' : '予約を確定する'}
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