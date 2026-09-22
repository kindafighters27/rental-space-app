'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams, useRouter } from 'next/navigation'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function BookPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const spaceId = searchParams.get('space_id')
  const date = searchParams.get('date')

  const [space, setSpace] = useState<any>(null)
  const [existingBookings, setExistingBookings] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  
  const [startHour, setStartHour] = useState('10')
  const [startMinute, setStartMinute] = useState('00')
  const [endHour, setEndHour] = useState('12')
  const [endMinute, setEndMinute] = useState('00')
  
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (spaceId && date) {
      fetchSpaceAndBookings()
    }
  }, [spaceId, date])

  const fetchSpaceAndBookings = async () => {
    const { data: spaceData } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()
    if (spaceData) setSpace(spaceData)

    const { data: bookingData } = await supabase
      .from('bookings')
      .select('*')
      .eq('space_id', spaceId)
      .neq('status', 'cancelled')

    if (bookingData) {
      const targetDate = date ? date.slice(0, 10) : ''
      const filtered = bookingData.filter((b) => {
        const bDate = b.booking_date || b.date
        if (!bDate) return false
        return String(bDate).slice(0, 10) === targetDate && b.status !== 'CANCELED'
      })
      setExistingBookings(filtered)
    }
  }

  const timeToTotalMinutes = (timeStr: string) => {
    if (!timeStr) return 0
    const cleanTime = timeStr.slice(0, 5)
    const [hStr, mStr] = cleanTime.split(':')
    let h = parseInt(hStr, 10)
    const m = parseInt(mStr || '0', 10)
    if (h >= 0 && h < 6) {
      h += 24
    }
    return h * 60 + m
  }

  const startTotalMins = timeToTotalMinutes(`${startHour}:${startMinute}`)
  
  let endH = parseInt(endHour, 10)
  const endM = parseInt(endMinute, 10)
  if (endH >= 0 && endH < 6) {
    endH += 24
  }
  const endTotalMins = endH * 60 + endM

  const calculatePrice = () => {
    const diffHours = (endTotalMins - startTotalMins) / 60
    if (diffHours <= 0) return 0
    if (diffHours <= 6) return 15000
    return 15000 + Math.ceil(diffHours - 6) * 2500
  }

  const totalPrice = calculatePrice()

  const isOverlap = existingBookings.some((b) => {
    const bStart = timeToTotalMinutes(b.start_time)
    const bEnd = timeToTotalMinutes(b.end_time)
    return startTotalMins < bEnd && endTotalMins > bStart
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (startTotalMins >= endTotalMins) {
      alert('終了時間は開始時間より後の時間を設定してください。')
      return
    }

    if (isOverlap) {
      alert('選択された時間帯はすでに予約が入っています。別の時間をお選びください。')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('bookings').insert([
      {
        space_id: spaceId,
        date: date,
        booking_date: date,
        user_name: userName,
        user_email: userEmail,
        start_time: `${startHour}:${startMinute}`,
        end_time: `${endHour}:${endMinute}`,
        status: 'active',
      },
    ])

    if (error) {
      alert('予約に失敗しました: ' + error.message)
      setLoading(false)
      return
    }

    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: userEmail,
          userName,
          spaceName: space?.name || 'レンタルスペース',
          date,
          startTime: `${startHour}:${startMinute}`,
          endTime: `${endHour}:${endMinute}`,
          price: totalPrice,
        }),
      })
    } catch (mailError) {
      console.error('メール送信エラー:', mailError)
    }

    alert('予約が完了しました！')
    router.push('/')
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-xl mx-auto bg-white p-6 md:p-8 rounded-xl shadow-md border border-gray-200">
        <div className="mb-6">
          <a href="/" className="text-sm text-emerald-600 hover:underline">← カレンダーに戻る</a>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">予約申し込み</h1>
          {space && <p className="text-gray-600 font-semibold">{space.name}</p>}
          <p className="text-sm text-gray-500 mt-1">予約日: {date}</p>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-bold text-amber-800 mb-1">⚠️ 本日の予約済み時間帯:</p>
          {existingBookings.length === 0 ? (
            <p className="text-xs text-amber-700">現在、この日の予約はありません。</p>
          ) : (
            <ul className="text-xs text-amber-700 space-y-1">
              {existingBookings.map((b, i) => (
                <li key={i}>
                  • {b.start_time?.slice(0, 5)} 〜 {b.end_time?.slice(0, 5)} （予約済み）
                </li>
              ))}
            </ul>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">お名前</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="山田 太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">開始時間</label>
              <div className="flex space-x-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-900"
                >
                  {Array.from({ length: 24 }).map((_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}時
                    </option>
                  ))}
                </select>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-900"
                >
                  <option value="00">00分</option>
                  <option value="30">30分</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">終了時間</label>
              <div className="flex space-x-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-900"
                >
                  {Array.from({ length: 27 }).map((_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}時
                    </option>
                  ))}
                </select>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(e.target.value)}
                  className="border border-gray-300 rounded-lg p-2 bg-white text-sm font-bold text-gray-900"
                >
                  <option value="00">00分</option>
                  <option value="30">30分</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center">
            <span className="text-xs font-semibold text-emerald-800">お支払い予定金額</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">¥{totalPrice.toLocaleString()}</div>
          </div>

          {isOverlap && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs font-bold">
              ⚠️ 選択された時間帯は、すでに予約が入っている時間と重複しています。別の時間をお選びください。
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isOverlap}
            className={`w-full font-bold py-3 rounded-lg transition ${
              isOverlap
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? '処理中...' : isOverlap ? '予約できない時間帯です' : '予約を確定する'}
          </button>
        </form>
      </div>
    </main>
  )
}