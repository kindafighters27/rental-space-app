'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function PokerBookingPage() {
  const [courseType, setCourseType] = useState<'beginner' | 'practice'>('beginner')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('14:00')
  const [userName, setUserName] = useState('')
  const [email, setEmail] = useState('')
  const [peopleCount, setPeopleCount] = useState<number>(1)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // コースに応じた料金計算などのロジック
  const pricePerPerson = courseType === 'beginner' ? 3000 : 4000
  const totalPrice = pricePerPerson * peopleCount

  // コース切り替え時に最小人数を自動調整
  const handleCourseChange = (type: 'beginner' | 'practice') => {
    setCourseType(type)
    if (type === 'beginner') {
      setPeopleCount(1)
    } else {
      setPeopleCount(3) // 実践編は3人以上
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !userName || !email) {
      alert('すべての項目を入力してください。')
      return
    }

    if (courseType === 'practice' && peopleCount < 3) {
      alert('実践編は3人以上のグループでお申し込みください。')
      return
    }

    setSubmitting(true)

    const { error } = await supabase.from('poker_bookings').insert([
      {
        course_type: courseType,
        date: date,
        start_time: startTime,
        user_name: userName,
        email: email,
        people_count: Number(peopleCount),
        total_price: totalPrice,
        status: 'active',
        is_confirmed: false,
      },
    ])

    setSubmitting(false)

    if (error) {
      alert('予約の送信に失敗しました: ' + error.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-16">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center shadow-sm gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-900">COCOKARA ポーカー道場</h1>
          <p className="text-[10px] text-gray-500">初心者講習 ＆ 実践編 予約受付</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Link href="/poker" className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs transition">
            COCOKARAポーカー道場 TOP
          </Link>
          <button
            onClick={() => alert('ご予約の確認・キャンセルについては、お送りした確認メールをご確認いただくか、管理者へお問い合わせください。')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-2 rounded-xl text-xs transition"
          >
            予約の確認・キャンセル
          </button>
          <Link href="/admin/poker" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs transition shadow-sm">
            管理者ログイン
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          {success ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <h2 className="text-lg font-bold text-gray-900">ご予約ありがとうございます！</h2>
              <p className="text-xs text-gray-600 leading-relaxed">
                ポーカー道場の予約を受け付けました。<br />
                ご登録いただいたメールアドレスへ確認のご案内をお送りしております。
              </p>
              <button
                onClick={() => {
                  setSuccess(false)
                  setUserName('')
                  setEmail('')
                }}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-sm"
              >
                続けて予約する
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-sm font-bold text-gray-900 mb-1">コースの選択</h2>
                <p className="text-xs text-gray-500 mb-3">ご希望のレッスンコースをお選びください。</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleCourseChange('beginner')}
                    className={`p-4 rounded-xl border text-left transition ${
                      courseType === 'beginner'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">初心者講習</div>
                    <div className="text-[10px] text-gray-500 font-normal">1人から参加可能 / ルールや基礎から丁寧に解説</div>
                    <div className="text-xs font-bold text-emerald-600 mt-2">¥3,000 / 1人</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCourseChange('practice')}
                    className={`p-4 rounded-xl border text-left transition ${
                      courseType === 'practice'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">実践編</div>
                    <div className="text-[10px] text-gray-500 font-normal">3人以上のグループ / 実戦形式でスキルアップ</div>
                    <div className="text-xs font-bold text-emerald-600 mt-2">¥4,000 / 1人</div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">開催希望日</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">開始時間</label>
                  <select
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="10:00">10:00 〜</option>
                    <option value="13:00">13:00 〜</option>
                    <option value="15:00">15:00 〜</option>
                    <option value="18:00">18:00 〜</option>
                    <option value="20:00">20:00 〜</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  参加人数 {courseType === 'beginner' ? '（1人からOK）' : '（3人以上でお申し込みください）'}
                </label>
                <input
                  type="number"
                  min={courseType === 'beginner' ? 1 : 3}
                  max={10}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">お名前（代表者様）</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="大阪 太郎"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-emerald-500 placeholder:text-gray-400 placeholder:font-normal"
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-900 bg-white focus:outline-none focus:border-emerald-500 placeholder:text-gray-400 placeholder:font-normal"
                    required
                  />
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-emerald-900">ご予約内容の確認</div>
                  <div className="text-[10px] text-emerald-700 mt-0.5">
                    {courseType === 'beginner' ? '初心者講習' : '実践編'} / {peopleCount}名様
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-gray-500">合計料金</div>
                  <div className="text-lg font-black text-emerald-600">¥{totalPrice.toLocaleString()}</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm disabled:opacity-50"
              >
                {submitting ? '送信中...' : 'ポーカー道場を予約する'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}