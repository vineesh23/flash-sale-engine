'use client';
import { useState } from 'react';

export default function Home() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    setStatus('Processing...');

    try {
      const res = await fetch('http://localhost:3000/buy', {
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
      setStatus('❌ Server Error. Is Backend running?');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <div className="border border-gray-700 p-10 rounded-2xl bg-gray-900 shadow-2xl text-center max-w-md w-full">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          iPhone 15 Pro
        </h1>
        <p className="text-gray-400 mb-8">Flash Sale Event</p>

        <div className="mb-8">
            <img 
                src="https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-15-pro-titanium-blue-select?wid=5120&hei=2880&fmt=p-jpg&qlt=80&.v=1692891194318" 
                alt="iPhone" 
                className="w-full rounded-lg"
            />
        </div>

        <button
          onClick={handleBuy}
          disabled={loading}
          className={`w-full py-4 text-xl font-bold rounded-lg transition-all ${
            loading 
              ? 'bg-gray-600 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-gray-200 active:scale-95'
          }`}
        >
          {loading ? 'Processing...' : 'BUY NOW ⚡'}
        </button>

        {status && (
          <p className="mt-6 text-lg font-mono animate-pulse">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}