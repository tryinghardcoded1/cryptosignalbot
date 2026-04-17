import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Activity, TrendingUp, TrendingDown, Clock, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';

interface Signal {
  id: string;
  pair: string;
  signal: 'BUY' | 'SELL';
  entry: number;
  takeProfit: number;
  stopLoss: number;
  timestamp: number;
  createdBy?: string;
  isWebhook?: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Realtime Listener to Firestore
    const q = query(collection(db, 'signals'), orderBy('timestamp', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveSignals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Signal[];
      setSignals(liveSignals);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleTestSignal = async () => {
    if (!user) return;
    
    // Generate a test signal
    const isBuy = Math.random() > 0.5;
    const testSignal = {
      pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'][Math.floor(Math.random() * 4)],
      signal: isBuy ? 'BUY' : 'SELL',
      entry: isBuy ? 60000 : 65000,
      takeProfit: isBuy ? 62000 : 61000,
      stopLoss: isBuy ? 58000 : 67000,
      timestamp: Date.now(),
      createdBy: user.uid
    };

    try {
      await addDoc(collection(db, 'signals'), testSignal);
    } catch (err) {
      console.error("Failed to add test signal:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-sm sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-emerald-500" />
          <h1 className="text-xl font-semibold tracking-tight">Crypto Signal Dashboard</h1>
          <div className="hidden sm:flex items-center ml-4 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium space-x-1.5">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span>Live Updates</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user?.isAdmin && (
            <button 
              onClick={handleTestSignal}
              className="flex items-center space-x-2 text-sm bg-gb-surface hover:brightness-125 text-gb-text-primary border border-gb-line font-medium px-4 py-2 rounded-md transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-gb-accent" />
              <span className="hidden sm:inline">Test Signal</span>
            </button>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : signals.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Activity className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-300">No Signals Yet</h3>
            <p className="text-zinc-500 mt-1">Waiting for the first trading signal to arrive.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signals.map((signal) => (
              <div 
                key={signal.id} 
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors"
              >
                <div className="p-5 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/50">
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-white tracking-wide">{signal.pair}</span>
                    <div className="flex items-center space-x-1 text-xs text-zinc-500 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{format(signal.timestamp, 'MMM d, HH:mm:ss')}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-sm font-bold ${
                    signal.signal === 'BUY' 
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {signal.signal === 'BUY' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{signal.signal}</span>
                  </div>
                </div>
                
                <div className="p-5 grid grid-cols-3 gap-4 text-center">
                   <div className="flex flex-col items-center p-3 bg-zinc-950 rounded-lg">
                     <span className="text-xs text-zinc-500 uppercase font-semibold mb-1">Entry</span>
                     <span className="font-mono text-zinc-200">{signal.entry}</span>
                   </div>
                   <div className="flex flex-col items-center p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                     <span className="text-xs text-emerald-500/70 uppercase font-semibold mb-1">Target</span>
                     <span className="font-mono text-emerald-400">{signal.takeProfit}</span>
                   </div>
                   <div className="flex flex-col items-center p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                     <span className="text-xs text-red-500/70 uppercase font-semibold mb-1">Stop</span>
                     <span className="font-mono text-red-400">{signal.stopLoss}</span>
                   </div>
                </div>
                
                {/* Source tracking marker */}
                {signal.isWebhook && (
                  <div className="px-5 pb-4">
                    <span className="inline-flex text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                      Via Webhook
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
