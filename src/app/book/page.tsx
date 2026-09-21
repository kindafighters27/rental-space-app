'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function BookingForm() {
  const searchParams = useSearchParams()
  const spaceId = searchParams.get('space_id')
  const date = searchParams.get('date')

  const [space, setSpace] = useState<any>(null)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (spaceId) {
      supabase.from('spaces').select('*').eq('id', spaceId).single()
        .then(({ data }) => setSpace(data))
    }
  }, [spaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const startDateTime = `${date}T${startTime}:00`

    const { error } = await supabase.from('bookings').insert([
      {
        space_id: spaceId,
        user_name: userName,
        user_email: userEmail,
        booking_date: date,
        start_time: startDateTime,
      },
    ])

    setLoading(false)

    if (error) {
      alert('予約に失敗しました: ' + error.message)
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md text-center space-y-4 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-emerald-600">予約が完了しました！</h2>
        <p className="text-gray-600 text-sm">ご予約ありがとうございます。当日お会いできるのを楽しみにしております。</p>
        <Link href="/" className="inline-block mt-4 bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition">
          トップページに戻る
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-md max-w-md mx-auto border border-gray-200">
      <Link href="/" className="text-sm text-gray-500 hover:text-gray-800 mb-4 inline-block">
        ← カレンダーに戻る
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">予約申し込み</h1>
      {space && (
        <div className="bg-emerald-50 text-emerald-800 p-3 rounded-lg text-sm mb-6 border border-emerald-200">
          <p className="font-bold">{space.name}</p>
          <p>予約日: <span className="font-semibold">{date}</span></p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">お名前</label>
          <input
            type="text"
            required
            placeholder="山田 太郎"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            required
            placeholder="example@email.com"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">利用開始時間</label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((time) => (
              <option key={time} value={time}>{time}〜</option>
            ))}
          </select>
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
      <Suspense fallback={<div>読み込み中...</div>}>
        <BookingForm />
      </Suspense>
    </main>
  )
}