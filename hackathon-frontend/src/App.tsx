import { useState, useEffect } from "react";
import { api } from "./api";
import "./index.css";

export default function App() {
  // ========================================================
  // 🪵 1. すべての useState を最上階に集結
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

  // 📸 【修正1】商品画像URLの状態をここに正しく定義！
  const [productImageUrl, setProductImageUrl] = useState("");

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
    error && setError("");
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

  // 🎯 Goのハンドラー(handleCreateItem)の必須チェックを絶対に突破する出品関数
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const loggedInUserId = localStorage.getItem("user_id") || "";

    try {
      await api.createItem({
        title: title,
        description: description,
        category: "一般",
        initial_price: Number(price),
        seller_id: loggedInUserId,
        image_url: productImageUrl, // 📸 【修正2】アップロードした画像URLをGoに渡す！
      });

      alert("出品が完了しました！");
      setTitle("");
      setPrice("");
      setDescription("");
      setProductImageUrl(""); // 📸 出品が終わったらプレビューを消す
      fetchItems(); // 一覧を再更新
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
    if (!newMessage.trim() || !activeRoomId || !user) return;

    const userMsg = newMessage;
    setNewMessage("");
    setChatLoading(true);

    try {
      await api.sendMessage(activeRoomId, user.id, userMsg);
      const updatedMsgs = await api.getMessages(activeRoomId);
      setMessages(updatedMsgs);
      fetchItems();
    } catch (err: any) {
      alert("メッセージの送信に失敗: " + err.message);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchItems();
    }
  }, [user]);

  // ========================================================
  // 🎨 3. 画面レンダリング（HTML部分）
  // ========================================================

  if (user) {
    if (activeRoomId && selectedItem) {
      return (
          <div className="min-h-screen bg-slate-50 flex flex-col" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

            {/* DM画面専用のヘッダー */}
            <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm" style={{ display: "flex", justifyContent: "between", alignItems: "center", padding: "16px", borderBottom: "1px solid #e2e8f0" }}>
              <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ fontSize: "24px" }}>💬</div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className="font-extrabold text-slate-800 text-base" style={{ fontWeight: "bold", fontSize: "16px" }}>
                    {selectedItem.seller_name || "出品者"} へのダイレクトメッセージ
                  </span>
                    <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold animate-pulse" style={{ backgroundColor: "#22c55e", color: "white", padding: "2px 8px", borderRadius: "9999px", fontSize: "12px" }}>
                    ● AI自動応答中
                  </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5" style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>
                    対象商品: <strong>「{selectedItem.title}」</strong> （現在の価格: <span className="text-indigo-600 font-bold">¥{(selectedItem.current_price || selectedItem.initial_price || 0).toLocaleString()}</span>）
                  </p>
                </div>
              </div>

              {/* 右上のボタン群（購入ボタン ＋ 戻るボタン） */}
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>

                {/* 💳 購入完了ボタン（デモ用） */}
                <button
                    onClick={() => {
                      alert("🎉 購入が完了しました！\n引き続き、出品者からの発送通知をお待ちください。");
                      // アラートを閉じたら自動で一覧画面に戻るおまけ付き！

                      setItems(items.filter(item => item.id !== selectedItem.id));

                      setActiveRoomId(null);
                      setSelectedItem(null);
                    }}
                    style={{ backgroundColor: "#ef4444", color: "#ffffff", padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                >
                  💳 この価格で購入する
                </button>

                {/* 戻るボタン */}
                <button
                    onClick={() => { setActiveRoomId(null); setSelectedItem(null); }}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                    style={{ backgroundColor: "#1e293b", color: "white", padding: "8px 16px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer" }}
                >
                  ← マーケットに戻る
                </button>
              </div>
            </div>

            {/* DMチャットのタイムライン */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-100" style={{ flex: 1, padding: "24px", overflowY: "auto", backgroundColor: "#f1f5f9" }}>
              {messages.map((msg: any) => {
                const isMe = msg.sender_id === user.id;
                const isAI = !msg.sender_id;
                const isSeller = selectedItem.seller_id === user.id;

                let label = "";
                if (isAI) {
                  label = isSeller ? "あなたのAI代行エージェント" : `${selectedItem.seller_name || "出品者"} (AI代行)`;
                } else if (isMe) {
                  label = isSeller ? "あなた（出品者）" : "あなた（購入希望者）";
                } else {
                  label = isSeller ? "購入希望者（相手）" : `${selectedItem.seller_name || "出品者"}`;
                }

                return (
                    <div
                        key={msg.id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"} animate-fade-in`}
                        style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: "16px" }}
                    >
                      <div
                          className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isMe ? "bg-indigo-600 text-white" : "bg-white text-slate-800"}`}
                          style={{
                            maxWidth: "75%",
                            padding: "12px 16px",
                            borderRadius: "16px",
                            backgroundColor: isMe ? "#4f46e5" : "#ffffff",
                            color: isMe ? "#ffffff" : "#1e293b",
                            border: isMe ? "none" : "1px solid #e2e8f0",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}
                      >
                        <div style={{ fontSize: "10px", opacity: 0.7, fontWeight: "bold", marginBottom: "4px" }}>
                          {label}
                        </div>
                        <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: "14px" }}>{msg.message}</p>
                      </div>
                    </div>
                );
              })}
              {chatLoading && (
                  <div style={{ display: "flex", justifyContent: "flex-start", color: "#64748b", fontSize: "14px" }}>
                    🤖 出品者AIがDMを入力中...
                  </div>
              )}
            </div>

            {/* DM送信フッター */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 bg-white flex gap-3" style={{ display: "flex", padding: "16px", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff", gap: "12px" }}>
              <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="価格のご相談や、商品についての質問をDMしてみましょう！"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #cbd5e1", backgroundColor: "#f8fafc" }}
              />
              <button
                  type="submit"
                  disabled={chatLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition"
                  style={{ backgroundColor: "#4f46e5", color: "white", padding: "12px 24px", borderRadius: "12px", fontWeight: "bold", border: "none", cursor: "pointer", opacity: chatLoading ? 0.5 : 1 }}
              >
                DM送信 🚀
              </button>
            </form>

          </div>
      );
    }

    // ========================================================
    // 📦 通常のダッシュボード画面
    // ========================================================
    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8" style={{ padding: "24px", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
          <div className="max-w-7xl mx-auto bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center mb-8" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#ffffff", padding: "16px", borderRadius: "16px", marginBottom: "32px", border: "1px solid #f1f5f9" }}>
            <div>
              <h1 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600" style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
                フリマカセ 取引ダッシュボード
              </h1>
              <p className="text-xs text-slate-500" style={{ fontSize: "12px", color: "#64748b", margin: "4px 0 0 0" }}>ログイン中: {user.name} さん</p>
            </div>
            <button onClick={handleLogout} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition" style={{ padding: "8px 16px", borderRadius: "12px", backgroundColor: "#f1f5f9", border: "none", cursor: "pointer" }}>
              ログアウト
            </button>
          </div>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>

            {/* 左：AI出品サポート */}
            <div style={{ flex: "1 1 300px", backgroundColor: "#ffffff", padding: "20px", borderRadius: "16px", border: "1px solid #f1f5f9", height: "fit-content" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>✨ AI高速出品サポート</h2>

              <div className="mb-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50">
                <label className="block text-[10px] font-bold text-indigo-700 mb-1">📷 商品写真を撮る・選ぶ</label>

                {productImageUrl && (
                    <img src={productImageUrl} alt="プレビュー" className="w-full h-32 object-cover rounded-lg mb-2 border-2 border-indigo-200" style={{ width: "100%", height: "128px", objectFit: "cover", borderRadius: "8px", marginBottom: "8px", border: "2px solid #c7d2fe" }} />
                )}

                <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={async (e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAiLoading(true);
                        try {
                          const imageUrl = await api.uploadImage(e.target.files[0]);
                          setProductImageUrl(imageUrl);

                          const res = await api.getAISuggest([imageUrl]);
                          setTitle(res.title || "");
                          setPrice(res.recommended_price ? String(res.recommended_price) : "");
                          setDescription(res.description || "");
                        } catch (err: any) {
                          alert("画像の処理に失敗: " + err.message);
                        } finally {
                          setAiLoading(false);
                        }
                      }
                    }}
                    className="w-full text-xs p-1 bg-white border border-slate-200 rounded-lg mb-2"
                    style={{ width: "100%", fontSize: "12px", padding: "4px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", marginBottom: "8px" }}
                />
                <p className="text-[9px] text-slate-400 text-center" style={{ fontSize: "10px", color: "#94a3b8", textAlign: "center" }}>※ 写真を選ぶと、AIが自動で商品名を鑑定します</p>
              </div>

              <form onSubmit={handleCreateItem} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b" }}>商品名</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b" }}>希望価格 (円)</label>
                  <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", color: "#64748b" }}>商品説明</label>
                  <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
                <button type="submit" style={{ backgroundColor: "#1e293b", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "bold" }}>🚀 この内容で出品</button>
              </form>
            </div>

            {/* 右：商品一覧タイムライン */}
            <div style={{ flex: "2 1 500px", backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>📦 タイムラインマーケット</h2>
                <button onClick={fetchItems} style={{ color: "#4f46e5", background: "none", border: "none", cursor: "pointer", fontSize: "14px" }}>🔄 更新</button>
              </div>
              {items.length === 0 ? (
                  <p style={{ color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>商品がありません。左側から出品してみましょう！</p>
              ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                    {items.map((item: any) => (
                        <div key={item.id} style={{ padding: "16px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc", borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <div>
                            {/* 📸 【修正3】画像URLがあれば画面に貼り付ける！ */}
                            {item.image_url && (
                                <img
                                    src={item.image_url}
                                    alt={item.title}
                                    style={{ width: "100%", height: "140px", objectFit: "cover", borderRadius: "8px", marginBottom: "12px", backgroundColor: "#e2e8f0" }}
                                />
                            )}
                            <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 4px 0" }}>{item.title}</h3>
                            <div style={{ display: "inline-block", fontSize: "12px", backgroundColor: "#e0e7ff", color: "#4f46e5", padding: "2px 8px", borderRadius: "6px", fontWeight: "bold", marginBottom: "8px" }}>
                              👤 出品者: {item.seller_name || "不明なユーザー"}
                            </div>
                            <p style={{ fontSize: "12px", color: "#64748b", margin: "8px 0" }}>{item.description}</p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center" style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1e293b" }}>
                              ¥{(item.current_price || item.initial_price || 0).toLocaleString()}
                            </span>

                            {item.seller_id === user.id ? (
                                <button
                                    onClick={() => handleOpenChat(item)}
                                    style={{ backgroundColor: "#10b981", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}
                                >
                                  📥 届いたDMを確認・返信
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleOpenChat(item)}
                                    style={{ backgroundColor: "#4f46e5", color: "white", padding: "6px 12px", borderRadius: "8px", fontWeight: "bold", border: "none", cursor: "pointer", fontSize: "12px" }}
                                >
                                  💬 出品者にDMを送る
                                </button>
                            )}
                          </div>
                        </div>
                    ))}
                  </div>
              )}
            </div>

          </div>
        </div>
    );
  }

  // 🚪 未ログイン時のサインイン / 会員登録画面
  return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 tracking-tight">AIフリマアプリ　フリマカセ</h1>
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