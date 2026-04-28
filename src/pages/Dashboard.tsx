import React from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  FileText, 
  TrendingUp,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile } = useAuth();

  const stats = [
    { label: 'Vacation Balance', value: '14.5', unit: 'Days', color: 'bg-blue-50 text-blue-600', icon: Calendar },
    { label: 'Sick Leave', value: '8.0', unit: 'Days', color: 'bg-green-50 text-green-600', icon: Clock },
    { label: 'Performance Score', value: '4.8', unit: '/ 5.0', color: 'bg-orange-50 text-orange-600', icon: Award },
    { label: 'Task Completion', value: '92', unit: '%', color: 'bg-purple-50 text-purple-600', icon: TrendingUp },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-serif font-light text-black">
          Welcome back, <span className="font-medium italic">{profile?.displayName?.split(' ')[0]}</span>.
        </h1>
        <p className="text-gray-400 text-sm mt-1">Here's what's happening at Lumina today.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-xs font-medium text-gray-400 font-mono">{stat.unit}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-bold text-lg">Announcements</h3>
              <button className="text-xs font-bold text-orange-600 hover:underline">View All</button>
            </div>
            <div className="p-0">
              {[
                { title: 'New Remote Work Policy', date: '2h ago', category: 'Policy', color: 'bg-blue-50 text-blue-600' },
                { title: 'Upcoming Wellness Week', date: '1d ago', category: 'Culture', color: 'bg-orange-50 text-orange-600' },
                { title: 'Q3 Financial Review', date: '3d ago', category: 'Finance', color: 'bg-green-50 text-green-600' }
              ].map((item, i) => (
                <div key={i} className="p-6 hover:bg-gray-50 transition-colors flex items-center gap-4 border-b border-gray-50 last:border-0 group cursor-pointer">
                  <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center shrink-0`}>
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm group-hover:text-orange-600 transition-colors">{item.title}</h4>
                    <p className="text-xs text-gray-400 mt-1">{item.category} • {item.date}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar / Quick Actions */}
        <div className="space-y-6">
          <section className="bg-black text-white p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600 opacity-20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
            <div className="relative z-10 space-y-4">
              <h3 className="text-2xl font-serif font-light leading-snug">
                Need help with <br />
                <span className="italic font-medium text-orange-400">anything?</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Lumina is your 24/7 partner for all HR and workstation inquiries.
              </p>
              <Link to="/chat" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl text-sm font-bold hover:bg-orange-400 transition-colors">
                Talk to Lumina
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-6">Upcoming Holidays</h3>
            <div className="space-y-4">
              {[
                { name: 'Labor Day', date: 'May 1st', days: '5 days left' },
                { name: 'Vesak Day', date: 'May 22nd', days: '26 days left' }
              ].map((day, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm font-bold">{day.name}</p>
                    <p className="text-xs text-gray-400">{day.date}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-sm uppercase tracking-wider">{day.days}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
