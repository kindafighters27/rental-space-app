'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function CustomersPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [customers, setCustomers] = useState<any[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'count' | 'name'>('latest')

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      fetchCustomers()
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      filterAndSortCustomers()
    }
  }, [searchTerm, sortBy, customers])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // パスワードを 0509 に変更
    if (password === '0509') {
      setIsAuthenticated(true)
      sessionStorage.setItem('admin_auth', 'true')
      fetchCustomers()
    } else {
      alert('パスワードが間違っています。')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    setPassword('')
  }

  const fetchCustomers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .neq('status', 'cancelled')
      .order('date', { ascending: false })

    if (error) {
      console.error('顧客データ取得エラー:', error)
      setLoading(false)
      return
    }

    const customerMap = new Map()

    data?.forEach((b) => {
      const key = b.email || b.user_name
      if (!key) return

      if (!customerMap.has(key)) {
        customerMap.set(key, {
          name: b.user_name || '名前なし',
          email: b.email || '未登録',
          totalBookings: 0,
          totalSpent: 0,
          lastBookingDate: b.date || '',
        })
      }

      const customer = customerMap.get(key)
      customer.totalBookings += 1
      customer.totalSpent += b.total_price || 0
      
      if (b.date && b.date > customer.lastBookingDate) {
        customer.lastBookingDate = b.date
      }
    })

    const customerList = Array.from(customerMap.values())
    setCustomers(customerList)
    setLoading(false)
  }

  const filterAndSortCustomers = () => {
    let result = [...customers]

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (c) =>
          c.name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term)
      )
    }

    if (sortBy === 'latest') {
      result.sort((a, b) => (b.lastBookingDate || '').localeCompare(a.lastBookingDate || ''))
    } else if (sortBy === 'count') {
      result.sort((a, b) => b.totalBookings - a.totalBookings)
    } else if (sortBy === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'))
    }

    setFilteredCustomers(result)
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
          <h1 className="text-lg font-bold text-gray-900 mb-6 text-center">管理者ログイン（顧客リスト）</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力してください"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 placeholder:text-gray-400 placeholder:font-normal"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              ログイン
            </button>
            <div className="text-center mt-4">
              <Link href="/admin" className="text-xs text-gray-500 hover:underline">
                ← 予約一覧に戻る
              </Link>
            </div>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pb-12">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-bold text-gray-900">顧客リスト（顧客管理）</h1>
        <div className="flex space-x-3 items-center">
          <Link href="/admin" className="bg-gray-200 hover:bg-gray-300 font-bold px-4 py-2 rounded-xl text-xs transition">
            予約一覧へ戻る
          </Link>
          <button onClick={fetchCustomers} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm">
            更新
          </button>
          <button onClick={handleLogout} className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl text-xs transition">
            ログアウト
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
            <input
              type="text"
              placeholder="お名前やメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 text-xs text-gray-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
            <span className="text-xs font-bold text-gray-600">並び替え:</span>
            <button
              onClick={() => setSortBy('latest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'latest' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              最近の予約日
            </button>
            <button
              onClick={() => setSortBy('count')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'count' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              総予約回数
            </button>
            <button
              onClick={() => setSortBy('name')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${sortBy === 'name' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              お名前順
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">読み込み中...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
            条件に一致する顧客データはありません。
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200 text-gray-600">
                    <th className="p-4 font-bold">お名前</th>
                    <th className="p-4 font-bold">メールアドレス</th>
                    <th className="p-4 font-bold">総予約回数</th>
                    <th className="p-4 font-bold">利用総額</th>
                    <th className="p-4 font-bold">直近の予約日</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-900">{c.name}</td>
                      <td className="p-4 text-gray-600">{c.email}</td>
                      <td className="p-4 font-semibold">{c.totalBookings} 回</td>
                      <td className="p-4 font-bold text-emerald-600">¥{c.totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-gray-600">{c.lastBookingDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}