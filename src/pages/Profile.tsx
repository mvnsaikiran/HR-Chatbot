import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Building, Calendar, Settings } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { profile } = useAuth();

  const details = [
    { label: 'Full Name', value: profile?.displayName, icon: User },
    { label: 'Email Address', value: profile?.email, icon: Mail },
    { label: 'Role', value: profile?.role, icon: Shield },
    { label: 'Department', value: profile?.department, icon: Building },
    { label: 'Join Date', value: profile?.joinDate ? new Date(profile.joinDate).toLocaleDateString() : 'August 2024', icon: Calendar },
  ];

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <header className="flex items-center gap-8">
        <div className="relative group">
          <div className="w-32 h-32 rounded-3xl bg-gray-100 overflow-hidden border-2 border-white shadow-xl">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <User className="w-full h-full p-6 text-gray-300" />
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95">
            <Settings className="w-4 h-4 text-black" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-serif font-light">{profile?.displayName}</h1>
            <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-100">{profile?.status}</span>
          </div>
          <p className="text-gray-400 font-medium">Employee ID: <span className="font-mono">{profile?.uid.slice(0, 8).toUpperCase()}</span></p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50">
            <h3 className="font-bold text-lg">Work Information</h3>
          </div>
          <div className="p-6 space-y-6">
            {details.map((item, i) => (
              <motion.div 
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                  <p className="text-sm font-medium text-black capitalize">{item.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="bg-black text-white p-6 rounded-3xl space-y-4 shadow-xl">
            <h3 className="font-bold text-lg">System Permissions</h3>
            <div className="space-y-3">
              {[
                { name: 'Policy Access', granted: true },
                { name: 'Self-Service Leave', granted: true },
                { name: 'Admin Dashboard', granted: profile?.role === 'admin' }
              ].map((perm, i) => (
                <div key={i} className="flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                  <span className="text-sm font-medium">{perm.name}</span>
                  {perm.granted ? (
                    <span className="text-[8px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Granted</span>
                  ) : (
                    <span className="text-[8px] font-bold bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full uppercase tracking-tighter">Locked</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl space-y-2">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest">Privacy Notice</p>
            <p className="text-[11px] text-orange-800 leading-relaxed opacity-80">Your profile information is strictly available to the HR department and your direct manager. Chat history with Lumina AI is encrypted and used solely for improving your employee experience.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
