'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

let socket;

export default function Home() {
  const [stock, setStock] = useState(100);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. CONNECT TO YOUR CLOUD SERVER ☁️
    // Replace localhost with your actual Render URL
    socket = io('https://flash-sale-engine.onrender.com', {
        transports: ['websocket'], // Force WebSocket for better performance
    });

    socket.on('stock_update', (newStock) => {
      setStock(newStock);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleBuy = async () => {
    setLoading(true);
    setStatus('Processing...');

    try {
      // 2. SEND BUY REQUEST TO CLOUD SERVER ☁️
      const res = await fetch('https://flash-sale-engine.onrender.com/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'user_' + Math.floor(Math.random() * 10000), 
          productId: 1 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ ' + data.message);
      } else {
        setStatus('❌ ' + data.message);
      }
    } catch (error) {
      setStatus('❌ Server Error');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4 font-sans">
      <div className="border border-gray-800 p-8 rounded-3xl bg-gray-950 shadow-2xl text-center max-w-md w-full relative overflow-hidden">
        
        {/* Stock Badge */}
        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${stock > 0 ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
          {stock > 0 ? `${stock} left` : 'SOLD OUT'}
        </div>

        <h1 className="text-5xl font-extrabold mb-2 bg-gradient-to-r from-blue-500 to-purple-600 text-transparent bg-clip-text">
          iPhone 15
        </h1>
        <p className="text-gray-500 mb-8 uppercase tracking-widest text-xs">Titanium Edition</p>

        {/* Product Image */}
        <div className="relative mb-8 group">
           <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
           <div className="relative bg-black rounded-xl overflow-hidden">
             <img 
               src="https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-titanium-blue-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692891194318" 
               alt="iPhone" 
               className="w-full object-cover transform hover:scale-105 transition duration-500"
             />
           </div>
        </div>

        {/* Buy Button */}
        <button
          onClick={handleBuy}
          disabled={loading || stock === 0}
          className={`w-full py-4 text-lg font-bold rounded-xl transition-all duration-300 transform active:scale-95 ${
            stock === 0
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : loading 
                ? 'bg-gray-700 text-gray-300 cursor-wait' 
                : 'bg-white text-black hover:bg-gray-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
          }`}
        >
          {stock === 0 ? 'SOLD OUT' : loading ? 'Checking Stock...' : 'BUY NOW - $999'}
        </button>

        {/* Status Message */}
        <div className="h-8 mt-4">
            {status && (
            <p className={`text-sm font-medium animate-fade-in ${status.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                {status}
            </p>
            )}
        </div>

      </div>
    </div>
  );
}