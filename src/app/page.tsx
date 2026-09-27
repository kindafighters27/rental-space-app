'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function Home() {
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpaces()
  }, [])

  const fetchSpaces = async () => {
    const { data, error } = await supabase.from('spaces').select('*')
    if (error) {
      console.error('スペース取得エラー:', error)
    } else {
      setSpaces(data || [])
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-base font-bold text-gray-900 tracking-wider">COCOKARA レンタルスペース</h1>
        <div className="flex space-x-3">
          <Link
            href="/book"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            スペースを予約する
          </Link>
          <Link
            href="/admin"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-2 rounded-xl text-xs transition"
          >
            管理者ログイン
          </Link>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-emerald-50 to-gray-50 py-16 px-6 text-center border-b border-gray-200">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
            あなたの活動を、もっと自由に。
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            COCOKARAは、ワークスペース、ミーティング、撮影、イベントなど、様々な用途にご利用いただけるレンタルスペースです。
            簡単・スピーディーにオンラインからご予約いただけます。
          </p>
          <div className="pt-4">
            <Link
              href="/book"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 py-3 rounded-2xl text-xs transition shadow-md"
            >
              今すぐ予約へ進む
            </Link>
          </div>
        </div>
      </section>

      {/* スペース一覧セクション */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h3 className="text-sm font-bold text-gray-900 mb-6 border-l-4 border-emerald-600 pl-3">
          スペースのご案内
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-gray-500">読み込み中...</div>
        ) : spaces.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-gray-200 text-xs text-gray-500">
            現在公開中のスペースはありません。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {space.image_url && (
                    <div className="h-48 overflow-hidden bg-gray-100">
                      <img src={space.image_url} alt={space.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <h4 className="font-bold text-sm text-gray-900">{space.name}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{space.description}</p>
                    <div className="text-xs font-bold text-emerald-600">
                      ¥{space.price_per_hour?.toLocaleString()} / 時間
                    </div>
                  </div>
                </div>
                <div className="p-6 pt-0">
                  <Link
                    href="/book"
                    className="block text-center bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-800 font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    このスペースを予約する
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* フッター */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} COCOKARA All rights reserved.
      </footer>
    </main>
  )
}