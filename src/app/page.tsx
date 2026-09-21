import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const revalidate = 0

// 今日から14日分の日付配列を生成する関数
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
  // スペース取得
  const { data: spaces } = await supabase.from('spaces').select('*')
  // 予約データ取得
  const { data: bookings } = await supabase.from('bookings').select('*')

  const dates = generateTwoWeeksDates()

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8 text-gray-800">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center">COCOKARA レンタルスペース</h1>

        <div className="space-y-6">
          {spaces && spaces.map((space) => {
            // このスペースに関連する予約を抽出
            const spaceBookings = bookings?.filter((b) => b.space_id === space.id) || []

            return (
              <div key={space.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                {/* メイン写真 */}
                {space.image_url && (
                  <div className="h-64 w-full bg-gray-200 overflow-hidden">
                    <img
                      src={space.image_url}
                      alt={space.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-xl font-bold mb-2">{space.name}</h2>
                  <p className="text-gray-600 text-sm mb-4">{space.description}</p>
                  <p className="text-xl font-bold text-emerald-600 mb-6">
                    ¥{Number(space.price_per_hour).toLocaleString()} <span className="text-sm text-gray-500 font-normal">/時間</span>
                  </p>

                  {/* 2週間カレンダーエリア */}
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">予約空き状況 (2週間)</h3>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {dates.map((date, idx) => {
                        const dateStr = date.toISOString().split('T')[0]
                        const dayName = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()]
                        const isSunday = date.getDay() === 0
                        const isSaturday = date.getDay() === 6

                        // 簡単な予約判定（予約データがあれば△や×を表示）
                        const hasBooking = spaceBookings.some((b) =>
                          b.start_time?.startsWith(dateStr)
                        )

                        return (
                          <div key={idx} className="border rounded p-2 bg-gray-50">
                            <div className={`font-semibold ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'text-gray-600'}`}>
                              {dayName}
                            </div>
                            <div className="text-gray-800 my-1">
                              {date.getMonth() + 1}/{date.getDate()}
                            </div>
                            <div className="text-base font-bold mt-1">
                              {hasBooking ? (
                                <span className="text-amber-500">△</span>
                              ) : (
                                <span className="text-emerald-500">◎</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}