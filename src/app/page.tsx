import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const revalidate = 0

function generateTwoWeeksDates() {
  const dates = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d)
  }
  return dates
}

export default async function HomePage() {
  const { data: spaces } = await supabase.from('spaces').select('*')
  const { data: bookings } = await supabase.from('bookings').select('*')

  const dates = generateTwoWeeksDates()

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
        
        {/* 画像エリア（2枚並び） */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 md:h-56 w-full rounded-lg overflow-hidden bg-gray-100 border">
            <img src="/space1.JPG" alt="スペース画像1" className="w-full h-full object-cover" />
          </div>
          <div className="h-48 md:h-56 w-full rounded-lg overflow-hidden bg-gray-100 border">
            <img src="/space2.JPG" alt="スペース画像2" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* スペース情報・修正した料金案内 */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">COCOKARA レンタルスペース</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            アミューズメントポーカーテーブル完備！ポーカーイベント、各種撮影、ボードゲーム会、教室利用などに最適な完全プライベート空間です。
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-emerald-950 space-y-1">
            <p className="font-bold text-base">💰 利用料金プラン</p>
            <p className="text-sm font-semibold">
              ・基本料金（1〜6時間まで）： <span className="text-lg font-bold text-emerald-700">¥15,000</span>
            </p>
            <p className="text-sm font-semibold">
              ・6時間超過分： <span className="text-emerald-700">1時間につき +¥2,500</span>
            </p>
          </div>
        </div>

        {spaces && spaces.length > 0 && (
          <div>
            {spaces.map((space) => {
              const spaceBookings = bookings?.filter((b) => b.space_id === space.id) || []

              return (
                <div key={space.id} className="mt-6 border-t pt-6">
                  <h2 className="text-base font-bold text-gray-800 mb-4">予約空き状況 (2週間)</h2>
                  
                  {/* カレンダー */}
                  <div className="grid grid-cols-7 gap-2 text-center text-xs">
                    {dates.map((date, idx) => {
                      const dateStr = date.toISOString().split('T')[0]
                      const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
                      const isSunday = date.getDay() === 0
                      const isSaturday = date.getDay() === 6

                      const hasBooking = spaceBookings.some((b) =>
                        b.date === dateStr || b.booking_date === dateStr || b.start_time?.startsWith(dateStr)
                      )

                      return (
                        <Link
                          key={idx}
                          href={`/book?space_id=${space.id}&date=${dateStr}`}
                          className="border border-gray-200 rounded-lg p-3 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-500 transition cursor-pointer flex flex-col justify-between items-center block"
                        >
                          <div className={`font-semibold ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-600'}`}>
                            {dayName}
                          </div>
                          <div className="text-gray-500 text-[11px] my-1">
                            {date.getMonth() + 1}/{date.getDate()}
                          </div>
                          <div className="text-base font-bold text-gray-500 mt-1">
                            {hasBooking ? '△' : '◎'}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}