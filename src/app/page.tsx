import { createClient } from '@supabase/supabase-js'

// Supabaseクライアントの初期化
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const revalidate = 0 // 常に最新データを取得

export default async function HomePage() {
  // 1. スペース一覧の取得
  const { data: spaces, error: spacesError } = await supabase
    .from('spaces')
    .select('*')

  // 2. 予約一覧の取得
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('*')

  if (spacesError) {
    console.error('Spaces fetch error:', spacesError)
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50 text-gray-800">
      <h1 className="text-3xl font-bold mb-8 text-center">COCOKARA レンタルスペース</h1>

      {/* スペース一覧表示エリア */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">スペース一覧</h2>
        {spaces && spaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spaces.map((space) => (
              <div key={space.id} className="border rounded-lg p-4 bg-white shadow-sm">
                {space.image_url && (
                  <img
                    src={space.image_url}
                    alt={space.name}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                )}
                <h3 className="text-lg font-bold">{space.name}</h3>
                <p className="text-gray-600 mt-2">{space.description}</p>
                <p className="text-blue-600 font-bold mt-4">
                  ¥{Number(space.price_per_hour).toLocaleString()} / 時間
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">登録されているスペースがありません。</p>
        )}
      </section>

      {/* 予約状況表示エリア */}
      <section>
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">最新の予約状況</h2>
        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <p className="font-bold">予約者: {booking.user_name} 様</p>
                <p className="text-sm text-gray-600">
                  日時: {new Date(booking.start_time).toLocaleString('ja-JP')} 〜{' '}
                  {new Date(booking.end_time).toLocaleString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">現在予約はありません。</p>
        )}
      </section>
    </main>
  )
}