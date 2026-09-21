'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function BookingFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceId = searchParams.get('space_id')
  const date = searchParams.get('date')

  const [space, setSpace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [timeSlot, setTimeSlot] = useState('10:00')

  useEffect(() => {
    async function fetchSpace() {
      if (spaceId) {
        const { data } = await supabase
          .from('spaces')
          .select('*')
          .eq('id', spaceId)
          .single()
        setSpace(data)
      }
      setLoading(false)
    }
    fetchSpace()
  }, [spaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !userEmail || !date || !spaceId) {
      alert('すべての項目を入力してください。')
      return
    }

    setSubmitting(true)

    const startTime = `${date}T${timeSlot}:00`

    const { error } = await supabase.from('bookings').insert([
      {
        space_id: spaceId,
        user_name: userName,
        user_email: userEmail,
        booking_date: date,
        start_time: startTime,
      },
    ])

    setSubmitting(false)

    if (error) {
      console.error(error)
      alert('予約の送信に失敗しました: ' + error.message)
    } else {
      alert('予約が完了しました！トップページへ戻ります。')
      router.push('/')
      router.refresh()
    }
  }

  if (loading) {
    return <div className="text-center p-8">読み込み中...</div>
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <Link href="/" className="text-sm text-emerald-600 hover:underline mb-4 inline-block font-semibold">
        ← カレンダーに戻る
      </Link>

      <h1 className="text-2xl font-bold mb-4 text-gray-800">予約申し込み</h1>

      {space ? (
        <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-100">
          <h2 className="font-bold text-gray-800 text-lg">{space.name}</h2>
          <p className="text-sm text-gray-600 mt-1">
            料金: <span className="font-bold text-emerald-700">¥{Number(space.price_per_hour).toLocaleString()}</span> / 時間
          </p>
          <p className="text-sm font-bold text-gray-700 mt-2">
            選択日: <span className="text-emerald-700">{date}</span>
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">スペース情報が見つかりません。</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            お名前
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="山田 太郎"
            className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            利用開始時間
          </label>
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="w-full border rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="09:00">09:00〜</option>
            <option value="10:00">10:00〜</option>
            <option value="11:00">11:00〜</option>
            <option value="12:00">12:00〜</option>
            <option value="13:00">13:00〜</option>
            <option value="14:00">14:00〜</option>
            <option value="15:00">15:00〜</option>
            <option value="16:00">16:00〜</option>
            <option value="17:00">17:00〜</option>
            <option value="18:00">18:00〜</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition disabled:opacity-50 mt-6"
        >
          {submitting ? '送信中...' : '予約を確定する'}
        </button>
      </form>
    </div>
  )
}

export default function BookPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-800">
      <Suspense fallback={<div className="text-center p-8">読み込み中...</div>}>
        <BookingFormContent />
      </Suspense>
    </main>
  )
}