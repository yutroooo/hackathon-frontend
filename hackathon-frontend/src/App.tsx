import { useState } from "react";
import { api } from "./api";

export default function App() {
  // ========================================================
  // 🪵 1. すべての useState を最上階に集結（if文の外側！）
  // ========================================================

  // 🔐 認証系
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ name: string; id: string } | null>(null);

  // 📦 商品系
  const [items, setItems] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [testImageUrl, setTestImageUrl] = useState("https://example.com/sample-item.jpg");

  // 💬 チャット系
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ========================================================
  // ⚙️ 2. 関数ロジックの定義
  // ========================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.login({ email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      } else {
        const res = await api.register({ name, email, password });
        localStorage.setItem("auth_token", res.token);
        localStorage.setItem("user_id", res.user_id);
        setUser({ name: res.name, id: res.user_id });
      }
    } catch (err: any) {
      setError(err.message || "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setEmail("");
    setPassword("");
    setName("");
    setItems([]);
    setActiveRoomId(null);
    setSelectedItem(null);
  };

  const fetchItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err: any) {
      alert("商品一覧の取得に失敗: " + err.message);
    }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    try {
      const res = await api.getAISuggest([testImageUrl]);
      setTitle(res.title || "");
      setPrice(res.recommended_price ? String(res.recommended_price) : "");
      setDescription(res.description || "");
    } catch (err: any) {
      alert("AI提案の取得に失敗: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createItem({
        title,
        description,
        price: Number(price),
        image_urls: [testImageUrl]
      });
      alert("出品が完了しました！");
      setTitle("");
      setPrice("");
      setDescription("");
      fetchItems();
    } catch (err: any) {
      alert("出品に失敗: " + err.message);
    }
  };

  const handleOpenChat = async (item: any) => {
    try {
      const res = await api.createRoom(item.id, "negotiation");
      setActiveRoomId(res.room_id);
      setSelectedItem(item);
      const msgData = await api.getMessages(res.room_id);
      setMessages(msgData);
    } catch (err: any) {
      alert("チャット部屋の起動に失敗: " + err.message);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRoomId) return;

    const userMsg = newMessage;
    setNewMessage("");
    setChatLoading(true);

    try {
      await api.sendMessage(activeRoomId, user.id, userMsg);
      const updatedMsgs = await api.getMessages(activeRoomId);
      setMessages(updatedMsgs);
    } catch (err: any) {
      alert("メッセージの送信に失敗: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  const refreshChat = async () => {
    if (!activeRoomId) return;
    const updatedMsgs = await api.getMessages(activeRoomId);
    setMessages(updatedMsgs);
  };

  // 最初の読み込みトリガー
  if (user && items.length === 0) {
    fetchItems();
  }

  // ========================================================
  // 🎨 3. 画面レンダリング（HTML部分）
  // ========================================================

  // ✨ Aパターン：ログイン成功時のメインダッシュボード画面
  if (user) {
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center mb-8">
            <div>
              <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600">
                AIフリマ 取引ダッシュボード
              </h1>
              <p className="text-xs text-slate-500">ログイン中: {user.name} さん</p>
            </div>
            <button onClick={handleLogout} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition">
              ログアウト
            </button>
          </div>

          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* 左カラム：AI出品サポート */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-fit">
              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">✨ AI高速出品サポート</h2>
              <div className="mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <label className="block text-[10px] font-bold text-indigo-700 mb-1">検証用画像URL</label>
                <input type="text" value={testImageUrl} onChange={(e) => setTestImageUrl(e.target.value)} className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded-lg mb-2" />
                <button type="button" onClick={handleAiSuggest} disabled={aiLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 rounded-lg text-[11px] transition disabled:opacity-50">
                  {aiLoading ? "Gemini鑑定中..." : "🔮 出品情報を自動生成"}
                </button>
              </div>
              <form onSubmit={handleCreateItem} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">商品名</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">希望価格 (円)</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">商品説明</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs" />
                </div>
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-xs transition">🚀 この内容で出品</button>
              </form>
            </div>

            {/* 中央カラム：商品一覧 */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 h-fit max-h-[75vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-bold text-slate-800">📦 出品中の商品</h2>
                <button onClick={fetchItems} className="text-xs text-indigo-600 hover:underline">🔄 更新</button>
              </div>
              {items.length === 0 ? (
                  <p className="text-slate-400 text-xs text-center py-8">商品がありません。</p>
              ) : (
                  <div className="space-y-3">
                    {items.map((item: any) => (
                        <div key={item.id} className={`p-3 border rounded-xl flex flex-col justify-between transition ${selectedItem?.id === item.id ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-slate-50/50'}`}>
                          <div>
                            <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                            <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{item.description}</p>
                          </div>
                          <div className="mt-3 pt-2 border-t border-slate-100 flex justify-between items-center">
                            <span className="font-extrabold text-slate-900 text-sm">¥{item.price?.toLocaleString()}</span>
                            <button onClick={() => handleOpenChat(item)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] px-2.5 py-1.5 rounded-lg transition shadow-sm">💬 交渉を始める</button>
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

            {/* 右カラム：リアルタイムチャット */}
            <div className="lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[75vh]">
              {activeRoomId && selectedItem ? (
                  <>
                    <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600">AI Negotiation Room</span>
                        <h3 className="font-bold text-slate-800 text-sm">「{selectedItem.title}」の価格交渉</h3>
                      </div>
                      <button onClick={refreshChat} className="text-xs bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md hover:bg-slate-50">🔄 同期</button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                      {messages.map((msg: any) => {
                        const isMe = msg.sender_id === user.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs shadow-sm ${isMe ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"}`}>
                                <div className="text-[9px] opacity-60 mb-0.5 font-bold">{isMe ? "あなた（購入希望者）" : "🤖 出品者代行AI"}</div>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            </div>
                        );
                      })}
                      {chatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white text-slate-400 border border-slate-100 rounded-2xl rounded-bl-none px-4 py-2 text-xs animate-pulse">🤖 AIが価格交渉の返答を熟考中...</div>
                          </div>
                      )}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2">
                      <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="1000円安くなりませんか？" className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                      <button type="submit" disabled={chatLoading} className="bg-slate-800 hover:bg-slate-900 text-white font-medium px-4 py-2 rounded-xl text-xs transition disabled:opacity-50">送信</button>
                    </form>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-slate-400">
                    <div className="text-3xl mb-2">💬</div>
                    <p className="text-xs font-medium">中央の商品一覧から「💬 交渉を始める」を押すと、<br />ここにリアルタイムAI交渉画面が起動します！</p>
                  </div>
              )}
            </div>
          </div>
        </div>
    );
  }

  // 🚪 Bパターン：未ログイン時のサインイン / 会員登録画面
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">AIフリマアプリ</h1>
            <p className="text-slate-400 text-xs mt-1">ハッカソン・プロトタイプ v1.0</p>
            <h2 className="text-xl font-bold text-slate-800 mt-4">{isLogin ? "アカウントにログイン" : "新しく会員登録"}</h2>
          </div>
          {error && <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl font-medium">⚠️ {error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">お名前</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
                </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">メールアドレス</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">パスワード</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-medium py-3 rounded-xl shadow-md shadow-indigo-100 hover:shadow-lg transition duration-200 disabled:opacity-50 text-sm mt-2">
              {loading ? "通信中..." : isLogin ? "ログインする" : "登録して始める"}
            </button>
          </form>
          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button onClick={() => { setIsLogin(!isLogin); setError(""); }} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition">
              {isLogin ? "まだアカウントをお持ちでない方はこちら" : "すでにアカウントをお持ちの方はこちら"}
            </button>
          </div>
        </div>
      </div>
  );
}