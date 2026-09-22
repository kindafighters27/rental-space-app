cat << 'EOF' > src/app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [spaces, setSpaces] = useState<any[]>([])
  const [selectedSpace, setSelectedSpace] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // 予約キャンセル用モーダル
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelEmail, setCancelEmail] = useState('')
  const [userBookings, setUserBookings] = useState<any[]>([])

  // パスワード入力用モーダル（管理者ログイン用）
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [inputPassword, setInputPassword] = useState('')

  // 2週間分のカレンダー生成
  const today = new Date()
  const twoWeeksDates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    const { data: spacesData } = await supabase.from('spaces').select('*')
    if (spacesData && spacesData.length > 0) {
      const updatedSpaces = spacesData.map((s, index) => {
        if (index === 0 && (!s.image_url || s.image_url === '')) {
          return { ...s, image_url: '/space2.JPG' }
        }
        return s
      })
      setSpaces(updatedSpaces)
      setSelectedSpace(updatedSpaces[0])
    }

    const { data: bookingsData } = await supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')

    setBookings(bookingsData || [])
    setLoading(false)
  }

  // 開始時間用（00:00 〜 24:00）
  const startTimeOptions = Array.from({ length: 25 }, (_, i) => {
    const hour = String(i).padStart(2, '0')
    return `${hour}:00`
  })

  // 終了時間用（深夜30時＝翌朝6:00まで選択可能にするため 00:00 〜 30:00）
  const endTimeOptions = Array.from({ length: 31 }, (_, i) => {
    const hour = String(i).padStart(2, '0')
    return `${hour}:00`
  })

  const currentSpaceBookings = bookings.filter(
    (b) => b.space_id === selectedSpace?.id && b.date === selectedDate
  )

  // 終了後1時間のバッファー（選択不可にするロジック）
  const isTimeSlotDisabled = (timeStr: string) => {
    if (!selectedDate) return false
    const timeVal = parseInt(timeStr.split(':')[0])

    for (const b of currentSpaceBookings) {
      const bStart = parseInt(b.start_time.split(':')[0])
      const bEnd = parseInt(b.end_time.split(':')[0])
      const bufferedEnd = bEnd + 1 // 終了後1時間は掃除・入れ替えのため選択不可

      if (timeVal >= bStart && timeVal < bufferedEnd) {
        return true
      }
    }
    return false
  }

  const calculatePrice = (start: string, end: string) => {
    if (!start || !end) return 0
    const startHour = parseInt(start.split(':')[0])
    const endHour = parseInt(end.split(':')[0])
    const hours = endHour - startHour
    if (hours <= 0) return 0

    if (hours <= 6) {
      return 15000
    } else {
      return 15000 + (hours - 6) * 2500
    }
  }

  const totalPrice = calculatePrice(startTime, endTime)

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !startTime || !endTime || !userName || !email) {
      alert('すべての項目を入力してください。')
      return
    }

    const startH = parseInt(startTime.split(':')[0])
    const endH = parseInt(endTime.split(':')[0])
    if (endH <= startH) {
      alert('終了時間は開始時間より後に設定してください。')
      return
    }

    const newBookingData = {
      space_id: selectedSpace.id,
      date: selectedDate,
      start_time: startTime,
      end_time: endTime,
      user_name: userName,
      email: email,
      total_price: totalPrice,
      status: 'active',
      is_confirmed: false,
    }

    const { error } = await supabase.from('bookings').insert([newBookingData])

    if (error) {
      alert('予約に失敗しました: ' + error.message)
    } else {
      // 予約成功時に管理者へメール通知
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'booking', booking: newBookingData }),
        })
      } catch (err) {
        console.error('メール通知送信失敗:', err)
      }

      alert('予約が完了しました！')
      setStartTime('')
      setEndTime('')
      setUserName('')
      setEmail('')
      setSelectedDate('')
      fetchInitialData()
    }
  }

  const handleSearchUserBookings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cancelEmail) return

    const { data, error } = await supabase
      .from('bookings')
      .select('*, spaces(name)')
      .eq('email', cancelEmail)
      .neq('status', 'cancelled')

    if (error) {
      alert('予約情報の取得に失敗しました。')
    } else {
      setUserBookings(data || [])
      if (data?.length === 0) {
        alert('該当する有効な予約が見つかりませんでした。')
      }
    }
  }

  const handleUserCancelBooking = async (bookingObj: any) => {
    if (!confirm('本当にこの予約をキャンセルしますか？')) return

    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingObj.id)

    if (error) {
      alert('キャンセルの処理に失敗しました。')
    } else {
      // キャンセル成功時に管理者へメール通知
      try {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cancel', booking: bookingObj }),
        })
      } catch (err) {
        console.error('キャンセルメール通知送信失敗:', err)
      }

      alert('予約をキャンセルしました。')
      setUserBookings((prev) => prev.filter((b) => b.id !== bookingObj.id))
      fetchInitialData()
    }
  }

  // 管理者ログインのパスワード確認 (0509)
  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputPassword === '0509') {
      sessionStorage.setItem('admin_auth', 'true')
      window.location.href = '/admin'
    } else {
      alert('パスワードが間違っています。')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-sm font-bold text-gray-900">COCOKARA レンタルスペース</h1>
        <div className="flex space-x-3 items-center">
          <button
            onClick={() => setCancelModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-xl text-xs transition"
          >
            予約の確認・キャンセル
          </button>
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition shadow-sm"
          >
            管理者ログイン
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3">
            募集中
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 mb-2">{selectedSpace?.name || 'COCOKARA レンタルスペース'}</h2>
          <p className="text-xs text-gray-600 mb-6">{selectedSpace?.description || '会議や各種イベント、教室利用に最適なレンタルスペースです。'}</p>

          {/* スペースの写真表示エリア（space2.JPG を表示） */}
          <div className="mb-6 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
            <img
              src="/space2.JPG"
              alt="COCOKARA レンタルスペース"
              className="w-full h-auto object-cover max-h-96"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <h3 className="text-xs font-bold text-amber-900 mb-2">利用料金プラン</h3>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>・基本料金（1〜6時間まで）: ¥15,000</li>
              <li>・6時間超過分: 1時間につき +¥2,500</li>
            </ul>
          </div>

          {/* カレンダー（0件=空きあり, 1件=△, 2件以上=×） */}
          <div>
            <h3 className="text-xs font-bold text-gray-900 mb-3">予約空き状況（2週間）</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {twoWeeksDates.map((dateStr) => {
                const dayBookings = bookings.filter(
                  (b) => b.space_id === selectedSpace?.id && b.date === dateStr
                )
                const count = dayBookings.length

                let statusText = '空きあり'
                let statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                if (count === 1) {
                  statusText = '△ 残りわずか'
                  statusColor = 'bg-amber-50 text-amber-700 border-amber-200'
                } else if (count >= 2) {
                  statusText = '× 満室'
                  statusColor = 'bg-red-50 text-red-700 border-red-200'
                }

                return (
                  <div
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                      selectedDate === dateStr ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : 'hover:bg-gray-50'
                    } ${statusColor}`}
                  >
                    <div className="text-[11px] font-bold">{dateStr.slice(5)}</div>
                    <div className="text-[10px] font-semibold mt-1">{statusText}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {selectedDate && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              ご予約フォーム（選択中: <span className="text-emerald-600">{selectedDate}</span>）
            </h3>
            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">開始時間</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">開始時間を選択</option>
                    {startTimeOptions.slice(0, 24).map((time) => {
                      const disabled = isTimeSlotDisabled(time)
                      return (
                        <option key={time} value={time} disabled={disabled}>
                          {time} {disabled ? '（予約不可・バッファー含む）' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">終了時間</label>
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                    required
                  >
                    <option value="">終了時間を選択</option>
                    {endTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">お名前</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="山田 太郎"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">メールアドレス</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {totalPrice > 0 && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <span className="text-xs text-emerald-800 font-bold">お支払い予定金額: </span>
                  <span className="text-base font-extrabold text-emerald-600">¥{totalPrice.toLocaleString()}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
              >
                予約を確定する
              </button>
            </form>
          </div>
        )}
      </div>

      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4">ご予約の確認・キャンセル</h3>
            <form onSubmit={handleSearchUserBookings} className="space-y-3 mb-4">
              <label className="block text-xs font-bold text-gray-700">ご登録のメールアドレス</label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={cancelEmail}
                  onChange={(e) => setCancelEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  検索
                </button>
              </div>
            </form>

            {userBookings.length > 0 && (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {userBookings.map((b) => (
                  <div key={b.id} className="border border-gray-200 rounded-xl p-3 flex justify-between items-center bg-gray-50 text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{b.date} ({b.start_time?.slice(0, 5)}〜{b.end_time?.slice(0, 5)})</div>
                      <div className="text-gray-600">¥{(b.total_price || 0).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => handleUserCancelBooking(b)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-1.5 rounded-lg transition"
                    >
                      キャンセルする
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setCancelModalOpen(false)
                setUserBookings([])
                setCancelEmail('')
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      {/* 管理者ログインモーダル */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-sm font-bold text-gray-900 mb-4 text-center">管理者ログイン</h3>
            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">パスワード</label>
                <input
                  type="password"
                  value={inputPassword}
                  onChange={(e) => setInputPassword(e.target.value)}
                  placeholder="パスワードを入力"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 placeholder:text-gray-400 placeholder:font-normal"
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                ログイン
              </button>
              <button
                type="button"
                onClick={() => {
                  setPasswordModalOpen(false)
                  setInputPassword('')
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 rounded-xl text-xs transition"
              >
                キャンセル
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}