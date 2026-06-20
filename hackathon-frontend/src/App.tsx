import { useState } from "react";
import { api } from "./api";

export default function App() {
  // ログインモードか、新規登録モードかを管理
  const [isLogin, setIsLogin] = useState(true);

  // 入力フォームの状態管理
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(""); // 新規登録時のみ使用

  // エラー・成功メッセージ、ローディング状態
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);

  // フォーム送信時の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        //  ログイン実行
        const res = await api.login({ email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      } else {
        // 新規会員登録実行
        const res = await api.register({ name, email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      }
    } catch (err: any) {
      setError(err.message || "おっと、通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  // ログアウト処理
  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setEmail("");
    setPassword("");
    setName("");
  };

  //  ログイン成功時の画面
  if (user) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-100">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">ようこそ、{user.name} さん！</h2>
            <p className="text-slate-500 mb-6 text-sm">ID: {user.id}</p>
            <p className="text-emerald-600 font-medium mb-6 bg-emerald-50 py-2 rounded-lg text-sm">
              本番の Cloud SQL データベースとの接続・認証に成功しました！
            </p>
            <button
                onClick={handleLogout}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-xl transition duration-200 text-sm"
            >
              ログアウト
            </button>
          </div>
        </div>
    );
  }

  // ログイン / 会員登録 フォーム画面
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 transition-all duration-300">

          {/* ヘッダー部分 */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">
              AIフリマアプリ
            </h1>
            <p className="text-slate-400 text-xs mt-1">ハッカソン・プロトタイプ v1.0</p>
            <h2 className="text-xl font-bold text-slate-800 mt-4">
              {isLogin ? "アカウントにログイン" : "新しく会員登録"}
            </h2>
          </div>

          {/* エラー表示 */}
          {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium animate-pulse">
                ⚠️ {error}
              </div>
          )}

          {/* フォーム本体 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">お名前</label>
                  <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="山田 太郎"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">メールアドレス</label>
              <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">パスワード</label>
              <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition duration-200 disabled:opacity-50 text-sm mt-2"
            >
              {loading ? "通信中..." : isLogin ? "ログインする" : "登録して始める"}
            </button>
          </form>

          {/* モード切り替えリンク */}
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
            >
              {isLogin ? "まだアカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
            </button>
          </div>

        </div>
      </div>
  );
}