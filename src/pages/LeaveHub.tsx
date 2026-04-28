import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { LeaveRequest, LeaveType } from '../types';

export default function LeaveHub() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<LeaveType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'leaveRequests'),
        where('employeeId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LeaveRequest)));
        setLoading(false);
      }, () => setLoading(false));
      return unsubscribe;
    } catch {
      setLoading(false);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'leaveRequests'), {
        employeeId: user.uid,
        type,
        startDate,
        endDate,
        reason,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (error) {
      console.error("Error submitting leave:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-600 border-green-100';
      case 'rejected': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-orange-50 text-orange-600 border-orange-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-light text-black">
            Leave <span className="font-medium italic">Hub</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Manage your time off and track request status.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all hover:scale-105 active:scale-95 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Request Leave
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Available', value: '20', sub: 'Days', icon: Calendar, color: 'bg-orange-50 text-orange-600' },
          { label: 'Pending', value: requests.filter(r => r.status === 'pending').length.toString(), sub: 'Requests', icon: Clock, color: 'bg-blue-50 text-blue-600' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length.toString(), sub: 'This year', icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shrink-0`}>
              <item.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-bold">{item.value}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">{item.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50">
          <h3 className="font-bold text-lg">Request History</h3>
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-400">Loading...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="p-4 bg-gray-50 rounded-full w-fit mx-auto">
              <AlertCircle className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No leave requests found. Start by creating one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  <th className="px-8 py-4">Type</th>
                  <th className="px-8 py-4">Duration</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Created</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="text-sm font-bold capitalize">{req.type}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm">
                      <div className="space-y-0.5">
                        <p className="font-medium">{new Date(req.startDate).toLocaleDateString()}</p>
                        <p className="text-xs text-gray-400">to {new Date(req.endDate).toLocaleDateString()}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusStyle(req.status)}`}>
                        {getStatusIcon(req.status)}
                        {req.status}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-400 font-mono">
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-gray-100">
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl z-[101]"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-3xl" />
              <h2 className="text-2xl font-serif mb-6">Request Time Off</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Leave Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as LeaveType)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                    required
                  >
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-gray-400">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Reason (Optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Briefly explain your request..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 text-gray-500 rounded-2xl text-sm font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-black text-white rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
