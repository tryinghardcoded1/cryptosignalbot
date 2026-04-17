import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { LogOut, Activity, TrendingUp, TrendingDown, Clock, PlusCircle, Users, Shield, ShieldOff } from 'lucide-react';
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

interface UserDoc {
  id: string;
  email: string;
  createdAt: number;
  isAdmin?: boolean;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'feed' | 'users'>('feed');

  useEffect(() => {
    // Realtime Listener to Firestore Signals
    if (activeTab === 'feed') {
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
    }
    
    // Realtime Listener to Users only if admin looking at users tab
    if (activeTab === 'users' && user?.isAdmin) {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const liveUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserDoc[];
        setUsers(liveUsers);
        setLoading(false);
      }, (error) => {
        console.error("Firestore Users Error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, user?.isAdmin]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const triggerTelegramSignal = async (signalData: Partial<Signal>) => {
    try {
      await fetch('/api/send-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signalData)
      });
    } catch (err) {
      console.error("Error triggering telegram signal:", err);
    }
  };

  const handleTestSignal = async () => {
    if (!user) return;
    const isBuy = Math.random() > 0.5;
    const testSignal = {
      pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'][Math.floor(Math.random() * 4)],
      signal: isBuy ? 'BUY' : 'SELL' as const,
      entry: isBuy ? 60000 : 65000,
      takeProfit: isBuy ? 62000 : 61000,
      stopLoss: isBuy ? 58000 : 67000,
      timestamp: Date.now(),
      createdBy: user.uid
    };
    try {
      await addDoc(collection(db, 'signals'), testSignal);
      // Trigger telegram notification
      await triggerTelegramSignal(testSignal);
    } catch (err) {
      console.error("Failed to add test signal:", err);
    }
  };

  const toggleAdminStatus = async (targetUserId: string, currentStatus: boolean) => {
    // Prevent accidental self-demotion
    if (targetUserId === user?.uid && currentStatus === true) {
      alert("You cannot remove your own admin status.");
      return;
    }
    try {
      await updateDoc(doc(db, 'users', targetUserId), {
        isAdmin: !currentStatus
      });
    } catch (err) {
      console.error("Failed to toggle admin status:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gb-bg text-gb-text-primary font-sans selection:bg-gb-accent/30 flex flex-col">
      {/* Header */}
      <header className="border-b border-gb-line bg-gb-surface sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Activity className="h-6 w-6 text-gb-accent" />
            <h1 className="text-xl font-bold tracking-tight">CRYPTO SIGNAL BOT</h1>
            <div className="hidden sm:flex items-center ml-4 px-2.5 py-0.5 rounded-full bg-gb-success/10 border border-gb-success/20 text-gb-success text-xs font-semibold space-x-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-gb-success animate-pulse"></div>
               <span>{activeTab === 'users' ? 'Admin Panel' : 'Live Feed'}</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-2 border-l border-gb-line pl-6">
             <button
                onClick={() => setActiveTab('feed')}
                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeTab === 'feed' ? 'bg-gb-accent/10 text-gb-accent' : 'text-gb-text-secondary hover:text-gb-text-primary'}`}
             >
                Dashboard
             </button>
             {user?.isAdmin && (
               <button
                  onClick={() => setActiveTab('users')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${activeTab === 'users' ? 'bg-gb-accent/10 text-gb-accent' : 'text-gb-text-secondary hover:text-gb-text-primary'}`}
               >
                  <Users className="w-4 h-4" />
                  <span>Manage Users</span>
               </button>
             )}
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {user?.isAdmin && activeTab === 'feed' && (
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
            className="flex items-center space-x-2 text-sm text-gb-text-secondary hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-7xl mx-auto w-full flex-1">
        
        {/* Signals Tab */}
        {activeTab === 'feed' && (
          loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gb-accent"></div>
            </div>
          ) : signals.length === 0 ? (
            <div className="text-center py-20 bg-gb-surface border border-gb-line rounded-xl">
              <Activity className="h-12 w-12 text-gb-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gb-text-primary">No Signals Yet</h3>
              <p className="text-gb-text-secondary mt-1">Waiting for the first trading signal to arrive.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {signals.map((signal) => (
                <div 
                  key={signal.id} 
                  className="bg-gb-bg border border-gb-line rounded-xl overflow-hidden hover:border-gb-text-secondary transition-colors relative"
                >
                  <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-md ${signal.signal === 'BUY' ? 'bg-gb-success' : 'bg-gb-danger'}`}></div>
                  <div className="p-5 border-b border-gb-line flex justify-between items-center bg-gb-surface pl-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-white tracking-wide">{signal.pair}</span>
                      <div className="flex items-center space-x-1 text-[11px] font-mono text-gb-text-secondary mt-0.5">
                        <span>TIMESTAMP: {format(signal.timestamp, 'HH:mm:ss')}</span>
                      </div>
                    </div>
                    <div className={`text-[14px] uppercase font-bold ${signal.signal === 'BUY' ? 'text-gb-success' : 'text-gb-danger'}`}>
                      {signal.signal === 'BUY' ? 'Buy Signal' : 'Sell Signal'}
                    </div>
                  </div>
                  
                  <div className="p-5 pb-0 pl-6">
                     <div className="flex flex-col mb-4">
                       <span className="text-[10px] text-gb-text-secondary uppercase font-semibold mb-1">Entry Price</span>
                       <span className="font-mono text-[14px] text-gb-text-primary">{signal.entry}</span>
                     </div>
                  </div>

                  <div className="p-5 pt-0 pl-6 grid grid-cols-2 gap-4">
                     <div className="flex flex-col">
                       <span className="text-[10px] text-gb-text-secondary uppercase font-semibold mb-1">Take Profit</span>
                       <span className="font-mono text-gb-success font-semibold">{signal.takeProfit}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-[10px] text-gb-text-secondary uppercase font-semibold mb-1">Stop Loss</span>
                       <span className="font-mono text-gb-danger font-semibold">{signal.stopLoss}</span>
                     </div>
                  </div>
                  
                  {signal.isWebhook && (
                    <div className="px-5 pb-4 pl-6">
                      <span className="inline-flex text-[10px] uppercase font-bold tracking-wider text-gb-accent bg-gb-accent/10 px-2 py-0.5 rounded border border-gb-accent/20">
                        Via Webhook
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Users Admin Tab */}
        {activeTab === 'users' && user?.isAdmin && (
          <div className="bg-gb-surface border border-gb-line rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gb-line flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gb-text-primary">Manage Access</h2>
                <p className="text-sm text-gb-text-secondary mt-1">Control who can send verified trading signals into the system.</p>
              </div>
            </div>
            {loading ? (
               <div className="flex justify-center items-center h-48">
                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gb-accent"></div>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gb-text-secondary">
                  <thead className="bg-gb-bg text-xs uppercase text-gb-text-secondary font-semibold border-b border-gb-line">
                    <tr>
                      <th scope="col" className="px-6 py-4">Account Email</th>
                      <th scope="col" className="px-6 py-4">Joined</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gb-line hover:bg-gb-bg/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gb-text-primary">
                          {u.email}
                          {u.id === user.uid && <span className="ml-2 text-[10px] bg-gb-text-secondary/20 px-2 py-0.5 rounded text-gb-text-primary">YOU</span>}
                        </td>
                        <td className="px-6 py-4">
                          {format(u.createdAt, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                           {u.isAdmin ? (
                             <span className="inline-flex items-center space-x-1 text-gb-accent bg-gb-accent/10 px-2.5 py-1 rounded-md text-xs font-bold border border-gb-accent/20">
                               <Shield className="w-3 h-3" />
                               <span>Admin</span>
                             </span>
                           ) : (
                             <span className="inline-flex items-center space-x-1 text-gb-text-secondary bg-gb-line px-2.5 py-1 rounded-md text-xs font-semibold">
                               <span>User</span>
                             </span>
                           )}
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button
                             onClick={() => toggleAdminStatus(u.id, !!u.isAdmin)}
                             disabled={u.id === user.uid}
                             className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                               u.id === user.uid 
                                 ? 'opacity-50 cursor-not-allowed bg-gb-line text-gb-text-secondary'
                                 : u.isAdmin 
                                   ? 'bg-gb-danger/10 text-gb-danger hover:bg-gb-danger/20 border border-gb-danger/20' 
                                   : 'bg-gb-success/10 text-gb-success hover:bg-gb-success/20 border border-gb-success/20'
                             }`}
                           >
                              {u.isAdmin ? (
                                <>
                                  <ShieldOff className="w-3.5 h-3.5" />
                                  <span>Revoke Admin</span>
                                </>
                              ) : (
                                <>
                                  <Shield className="w-3.5 h-3.5" />
                                  <span>Make Admin</span>
                                </>
                              )}
                           </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
