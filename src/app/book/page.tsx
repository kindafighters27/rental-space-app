'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

function BookContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const spaceId = searchParams.get('space_id')
  const date = searchParams.get('date')

  const [space, setSpace] = useState<any>(null)
  const [existingBookings, setExistingBookings] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  
  const [startHour, setStartHour] = useState('19')
  const [startMinute, setStartMinute] = useState('00')
  const [endHour, setEndHour] = useState('25')
  const [endMinute, setEndMinute] = useState('00')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (spaceId && date) {
      fetchSpaceAndBookings()
    }
  }, [spaceId, date])

  const fetchSpaceAndBookings = async () => {
    const { data: spaceData, error: spaceError } = await supabase
      .from('spaces')
      .select('*')
      .eq('id', spaceId)
      .single()
    
    if (spaceError) {
      console.error('スペース取得エラー:', spaceError)
    } else if (spaceData) {
      setSpace(spaceData)
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('space_id', spaceId)
      .eq('date', date)
      .neq('status', 'cancelled')

    if (bookingError) {
      console.error('予約情報取得エラー:', bookingError)
    } else {
      setExistingBookings(bookingData || [])
    }
    
    setLoading(false)
  }

  // 料金計算ロジック（基本1〜6時間：15,000円、超過1時間ごと：+2,500円）
  const calculatePrice = () => {
    const start = parseInt(startHour) + parseInt(startMinute) / 60
    let end = parseInt(endHour) + parseInt(endMinute) / 60
    
    let diffHours = end - start
    if (diffHours <= 0) {
      diffHours += 24 // 日付を跨ぐ場合
    }

    if (diffHours <= 6) {
      return 15000
    } else {
      const extraHours = Math.ceil(diffHours - 6)
      return 15000 + (extraHours * 2500)
    }
  }

  const totalPrice = calculatePrice()

  // 時間文字列を小数の時間に変換するヘルパー（日付跨ぎ・30時対応）
  const timeToDecimal = (timeStr: string, isEnd: boolean = false) => {
    if (!timeStr) return 0
    const parts = timeStr.split(':')
    const h = parseInt(parts[0], 10) || 0
    const m = parseInt(parts[1], 10) || 0
    let total = h + m / 60
    
    if (isEnd && total < 12) {
      total += 24
    }
    return total
  }

  // 予約送信および重複判定処理
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !email) {
      alert('お名前とメールアドレスを入力してください。')
      return
    }

    const newStartDecimal = parseInt(startHour) + parseInt(startMinute) / 60
    let newEndDecimal = parseInt(endHour) + parseInt(endMinute) / 60
    
    if (newEndDecimal <= newStartDecimal) {
      newEndDecimal += 24 // 深夜跨ぎ
    }

    // 既存の予約との重複チェックロジック
    for (const b of existingBookings) {
      const existingStart = timeToDecimal(b.start_time, false)
      let existingEnd = timeToDecimal(b.end_time, true)

      if (existingEnd <= existingStart) {
        existingEnd += 24
      }

      if (newStartDecimal < existingEnd && newEndDecimal > existingStart) {
        alert(`選択された時間帯（${startHour}:${startMinute} 〜 ${endHour}:${endMinute}）は、既存の予約（${b.start_time?.slice(0, 5)} 〜 ${b.end_time?.slice(0, 5)}）と重複しています。別の時間をお選びください。`)
        return
      }
    }

    const startTimeStr = `${startHour}:${startMinute}:00`
    const endTimeStr = `${endHour}:${endMinute}:00`

    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('bookings').insert([
        {
          space_id: spaceId,
          date: date, // データベースの 'date' カラムに合わせる
          user_name: userName,
          email: email,
          start_time: startTimeStr,
          end_time: endTimeStr,
          total_price: totalPrice,
          status: 'active',
        },
      ])

      if (insertError) throw insertError

      const emailRes = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          userName,
          spaceName: space?.name || 'レンタルスペース',
          date,
          startTime: `${startHour}:${startMinute}`,
          endTime: `${endHour}:${endMinute}`,
          price: totalPrice,
        }),
      })

      if (!emailRes.ok) {
        console.error('メール通知の送信に失敗しました')
      }

      alert('仮予約を受け付けました！管理者に通知が送信されました。')
      router.push('/')
    } catch (error: any) {
      console.error('予約エラー:', error)
      alert(`予約に失敗しました: ${error.message || error}`)
    } finally {
      setSubmitting(false)
    }
  }

  const hours = Array.from({ length: 31 }, (_, i) => String(i).padStart(2, '0'))

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <Link href="/" className="text-emerald-600 font-bold text-sm hover:underline">
          ← トップページに戻る
        </Link>
        <h1 className="text-lg font-bold text-gray-900">スペース予約お申し込み</h1>
        <div className="w-20"></div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-8">
        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{space?.name}</h2>
            <p className="text-xs text-emerald-600 font-bold mb-6">予約日: {date}</p>

            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="text-xs font-bold text-gray-700 mb-2">⚠️ 本日の予約済み時間帯:</h3>
              {existingBookings.length === 0 ? (
                <p className="text-xs text-emerald-600 font-medium">現在、この日の予約はありません。</p>
              ) : (
                <ul className="space-y-1">
                  {existingBookings.map((b, i) => (
                    <li key={i} className="text-xs text-red-600 font-semibold">
                      • {b.start_time?.slice(0, 5)} 〜 {b.end_time?.slice(0, 5)} （予約済み）
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">お名前</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                  placeholder="例：山田 太郎"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">メールアドレス</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="例：example@gmail.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">開始時間</label>
                  <div className="flex space-x-2">
                    <select
                      value={startHour}
                      onChange={(e) => setStartHour(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}時</option>
                      ))}
                    </select>
                    <select
                      value={startMinute}
                      onChange={(e) => setStartMinute(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
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
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                    >
                      {hours.map((h) => (
                        <option key={h} value={h}>{h}時</option>
                      ))}
                    </select>
                    <select
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm bg-white"
                    >
                      <option value="00">00分</option>
                      <option value="30">30分</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center mt-6">
                <span className="text-xs font-bold text-emerald-800">お支払い予定金額</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  ¥{totalPrice.toLocaleString()}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl transition shadow-md disabled:opacity-50 mt-4"
              >
                {submitting ? '処理中...' : '予約を確定する'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">読み込み中...</div>}>
      <BookContent />
    </Suspense>
  )
}