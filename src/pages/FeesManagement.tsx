import { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, AlertTriangle, 
  Clock, Search, BellRing, ChevronRight, 
  DollarSign, RefreshCw, X
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const FeesManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [cyclesMap, setCyclesMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [recordingStudent, setRecordingStudent] = useState<any | null>(null);
  const [viewingHistoryStudent, setViewingHistoryStudent] = useState<any | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'dueSoon' | 'paid' | 'unconfigured'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for configuring a fee cycle
  const [cycleForm, setCycleForm] = useState({
    feeAmount: 2000,
    feeType: 'Monthly Tuition',
    cycleDays: 30,
    nextDueDate: new Date().toISOString().split('T')[0]
  });

  // Record payment form state
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: 2000,
    paymentMethod: 'UPI',
    notes: 'Regular fee payment'
  });

  const [toastMessage, setToastMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const [statusMap, setStatusMap] = useState<Record<string, any>>({});

  const fetchStudents = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userEmail) headers['user-email'] = userEmail;

    try {
      const [stRes, cyclesRes, statusRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users?role=student`),
        fetch(`${API_BASE_URL}/api/fees/cycles`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/api/fees/all-status`, { headers }).catch(() => null)
      ]);

      const data = await stRes.json();
      const stList = Array.isArray(data) ? data : [];
      setStudents(stList);

      if (cyclesRes && cyclesRes.ok) {
        const cyclesData = await cyclesRes.json();
        if (Array.isArray(cyclesData)) {
          const map: Record<string, any> = {};
          cyclesData.forEach((c) => {
            const sKey = typeof c.studentId === 'object' && c.studentId?._id ? c.studentId._id : c.studentId;
            if (sKey) map[sKey.toString()] = c;
          });
          setCyclesMap(map);
        }
      }

      if (statusRes && statusRes.ok) {
        const statusData = await statusRes.json();
        if (Array.isArray(statusData)) {
          const map: Record<string, any> = {};
          statusData.forEach((item) => {
            if (item._id) map[item._id.toString()] = item;
            if (item.studentId) {
              map[item.studentId.toString()] = item;
              map[item.studentId.toString().toLowerCase()] = item;
            }
            if (item.email) {
              map[item.email.toString()] = item;
              map[item.email.toString().toLowerCase()] = item;
            }
          });
          setStatusMap(map);
        }
      }
    } catch (err) {
      console.error('Error fetching students & fee cycles:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStudentAllStatus = (st: any) => {
    if (!st) return null;
    if (st._id && statusMap[st._id.toString()]) return statusMap[st._id.toString()];
    if (st.studentId && statusMap[st.studentId]) return statusMap[st.studentId];
    if (st.studentId && statusMap[st.studentId.toLowerCase()]) return statusMap[st.studentId.toLowerCase()];
    if (st.email && statusMap[st.email]) return statusMap[st.email];
    if (st.email && statusMap[st.email.toLowerCase()]) return statusMap[st.email.toLowerCase()];
    return null;
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleStartConfigure = (student: any) => {
    const existing = cyclesMap[student._id] || (student.studentId ? cyclesMap[student.studentId] : null);
    if (existing) {
      setCycleForm({
        feeAmount: existing.feeAmount || 2000,
        feeType: existing.feeType || 'Monthly Tuition',
        cycleDays: existing.cycleDays || 30,
        nextDueDate: existing.nextDueDate ? new Date(existing.nextDueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setCycleForm({
        feeAmount: 2000,
        feeType: 'Monthly Tuition',
        cycleDays: 30,
        nextDueDate: new Date().toISOString().split('T')[0]
      });
    }
    setEditingStudent(student);
  };

  const handleSaveCycle = async () => {
    if (!editingStudent) return;
    setToastMessage({ type: '', text: '' });
    
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userEmail) headers['user-email'] = userEmail;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fees/cycle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: editingStudent._id,
          feeAmount: Number(cycleForm.feeAmount),
          feeType: cycleForm.feeType,
          cycleDays: Number(cycleForm.cycleDays),
          nextDueDate: cycleForm.nextDueDate
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to configure fee cycle');
      }

      setToastMessage({ type: 'success', text: `Fee cycle for ${editingStudent.fullName} updated successfully!` });
      setEditingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      console.error('Error saving fee cycle:', err);
      setToastMessage({ type: 'error', text: err.message || 'Error configuring fee cycle.' });
    }
  };

  const handleRecordPayment = async () => {
    if (!recordingStudent) return;
    const existing = cyclesMap[recordingStudent._id] || (recordingStudent.studentId ? cyclesMap[recordingStudent.studentId] : null);
    if (!existing) {
      alert("Please configure a fee cycle first before recording payments.");
      return;
    }

    const currentDue = existing.nextDueDate ? new Date(existing.nextDueDate) : new Date();
    const cycleDays = existing.cycleDays || 30;
    
    // Calculate new due date by adding cycle days from either today or previous due date
    const baseDate = currentDue.getTime() < Date.now() ? new Date() : currentDue;
    const newDueDate = new Date(baseDate.getTime() + cycleDays * 86400000).toISOString().split('T')[0];

    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userEmail) headers['user-email'] = userEmail;

    try {
      const res = await fetch(`${API_BASE_URL}/api/fees/cycle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          studentId: recordingStudent._id,
          feeAmount: existing.feeAmount,
          feeType: existing.feeType,
          cycleDays: existing.cycleDays,
          nextDueDate: newDueDate
        })
      });

      if (!res.ok) throw new Error("Failed to record payment");

      setToastMessage({
        type: 'success',
        text: `Payment of ₹${paymentForm.amountPaid} recorded for ${recordingStudent.fullName}! Next due: ${new Date(newDueDate).toLocaleDateString()}`
      });
      setRecordingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'Error recording payment.' });
    }
  };

  const handleSendReminder = (student: any) => {
    setToastMessage({
      type: 'success',
      text: `Fee reminder notification sent to parent of ${student.fullName}!`
    });
  };

  // Status calculation logic for each student
  const getStudentFeeStatus = (st: any) => {
    const cycle = cyclesMap[st._id] || (st.studentId ? cyclesMap[st.studentId] : null);
    const stStatus = getStudentAllStatus(st);

    if (!cycle) {
      if (stStatus?.isPaid || st.status === 'Paid') {
        const amt = stStatus?.latestPayment?.amount || parseFloat((st.termFee || '2000').replace(/[^0-9.]/g, '')) || 2000;
        return { status: 'paid', label: 'Paid / Up-to-Date', color: 'emerald', diffDays: 30, amount: amt, cycle: null };
      }
      return { status: 'unconfigured', label: 'Unconfigured', color: 'gray', diffDays: 0, amount: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(cycle.nextDueDate);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'overdue', label: `Overdue by ${Math.abs(diffDays)} days`, color: 'red', diffDays, amount: cycle.feeAmount || 0, cycle };
    } else if (diffDays <= 7) {
      return { status: 'dueSoon', label: diffDays === 0 ? 'Due Today' : `Due in ${diffDays} days`, color: 'amber', diffDays, amount: cycle.feeAmount || 0, cycle };
    } else {
      return { status: 'paid', label: `Paid (Next: ${diffDays}d)`, color: 'emerald', diffDays, amount: cycle.feeAmount || 0, cycle };
    }
  };

  // Compute Aggregate Metrics
  let totalConfiguredAmount = 0;
  let overdueAmount = 0;
  let dueSoonAmount = 0;
  let paidAmount = 0;

  let overdueCount = 0;
  let dueSoonCount = 0;
  let paidCount = 0;
  let unconfiguredCount = 0;

  students.forEach((st) => {
    const stStatus = getStudentFeeStatus(st);
    const stAllStatus = getStudentAllStatus(st);

    if (stStatus.status === 'unconfigured') {
      unconfiguredCount++;
    } else {
      totalConfiguredAmount += stStatus.amount;
      if (stStatus.status === 'overdue') {
        overdueCount++;
        overdueAmount += stStatus.amount;
      } else if (stStatus.status === 'dueSoon') {
        dueSoonCount++;
        dueSoonAmount += stStatus.amount;
      } else {
        paidCount++;
      }
    }

    // Sum all actual completed payments for this student
    if (stAllStatus && Array.isArray(stAllStatus.payments) && stAllStatus.payments.length > 0) {
      const studentPaidTotal = stAllStatus.payments
        .filter((p: any) => p.status === 'PAID')
        .reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
      paidAmount += studentPaidTotal;
    } else if (stStatus.status === 'paid') {
      paidAmount += stStatus.amount;
    }
  });

  const totalConfiguredStudents = students.length - unconfiguredCount;
  const paidPercent = totalConfiguredStudents > 0 ? Math.round((paidCount / totalConfiguredStudents) * 100) : 0;
  const overduePercent = totalConfiguredStudents > 0 ? Math.round((overdueCount / totalConfiguredStudents) * 100) : 0;
  const dueSoonPercent = totalConfiguredStudents > 0 ? Math.round((dueSoonCount / totalConfiguredStudents) * 100) : 0;

  // Build flattened payment transaction rows so every completed payment displays directly as its own row in the table
  const allPaymentRows: any[] = [];

  students.forEach((st) => {
    const stStatus = getStudentFeeStatus(st);
    const activeCycle = stStatus.cycle;
    const stAllStatus = getStudentAllStatus(st);
    const studentPayments = stAllStatus?.payments || [];

    if (studentPayments.length > 0) {
      studentPayments.forEach((p: any, idx: number) => {
        allPaymentRows.push({
          rowKey: `${st._id}_${p._id || idx}`,
          student: st,
          payment: p,
          stStatus,
          activeCycle,
          stAllStatus,
          totalTxns: studentPayments.length,
          txnIndex: studentPayments.length - idx
        });
      });
    } else {
      allPaymentRows.push({
        rowKey: st._id,
        student: st,
        payment: null,
        stStatus,
        activeCycle,
        stAllStatus,
        totalTxns: 0,
        txnIndex: 0
      });
    }
  });

  // Filter rows based on active Tab and Search Query
  const filteredRows = allPaymentRows.filter((item) => {
    const st = item.student;
    const p = item.payment;
    const stStatus = item.stStatus;

    if (filterTab === 'paid') {
      if (!p || p.status !== 'PAID') return false;
    } else if (filterTab === 'overdue') {
      if (stStatus.status !== 'overdue') return false;
    } else if (filterTab === 'dueSoon') {
      if (stStatus.status !== 'dueSoon') return false;
    } else if (filterTab === 'unconfigured') {
      if (stStatus.status !== 'unconfigured') return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      st.fullName?.toLowerCase().includes(q) ||
      st.email?.toLowerCase().includes(q) ||
      st.studentId?.toLowerCase().includes(q) ||
      p?.transactionId?.toLowerCase().includes(q) ||
      p?.paymentMethod?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Fee Payments & Revenue Intelligence</h2>
            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">Live Billing</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track student fee cycles, pending parent dues, next collection schedules, and payment receipts.
          </p>
        </div>

        <button
          onClick={() => fetchStudents()}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all border border-gray-200 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex justify-between items-center shadow-sm ${
          toastMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
      )}

      {/* Metric KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Monthly Expected</p>
            <h4 className="text-2xl font-black text-gray-900 mt-0.5">₹{totalConfiguredAmount.toLocaleString()}</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">{totalConfiguredStudents} students configured</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Collected / Up to Date</p>
            <h4 className="text-2xl font-black text-emerald-600 mt-0.5">₹{paidAmount.toLocaleString()}</h4>
            <p className="text-[11px] text-emerald-600 font-bold mt-0.5">{paidCount} students ({paidPercent}%)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Overdue Dues</p>
            <h4 className="text-2xl font-black text-red-600 mt-0.5">₹{overdueAmount.toLocaleString()}</h4>
            <p className="text-[11px] text-red-600 font-bold mt-0.5">{overdueCount} parents overdue ({overduePercent}%)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Due Next 7 Days</p>
            <h4 className="text-2xl font-black text-amber-600 mt-0.5">₹{dueSoonAmount.toLocaleString()}</h4>
            <p className="text-[11px] text-amber-600 font-bold mt-0.5">{dueSoonCount} collections upcoming</p>
          </div>
        </div>
      </div>

      {/* Visual Pie/Donut Chart & Forecast Analytics Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pie / Donut Chart Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Fee Status Distribution</h3>
              <p className="text-xs text-gray-500">Visual ratio of paid, upcoming & overdue parent payments</p>
            </div>
            <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200">
              {students.length} Total Students
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-around gap-8 my-4">
            
            {/* SVG Donut Chart */}
            <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                {/* Background Ring */}
                <path
                  className="text-gray-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                
                {/* Segment 1: Paid (Green) */}
                <path
                  className="text-emerald-500 transition-all duration-700"
                  strokeDasharray={`${paidPercent}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Segment 2: Overdue (Red) - strokeDashoffset shifted */}
                <path
                  className="text-red-500 transition-all duration-700"
                  strokeDasharray={`${overduePercent}, 100`}
                  strokeDashoffset={`-${paidPercent}`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />

                {/* Segment 3: Due Soon (Yellow) */}
                <path
                  className="text-amber-400 transition-all duration-700"
                  strokeDasharray={`${dueSoonPercent}, 100`}
                  strokeDashoffset={`-${paidPercent + overduePercent}`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-gray-900">{paidPercent}%</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected</span>
              </div>
            </div>

            {/* Chart Legend Breakdown */}
            <div className="space-y-3.5 w-full sm:w-auto">
              <div className="flex items-center justify-between gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Paid & Up to Date</span>
                </div>
                <span className="font-bold text-gray-900">{paidCount} ({paidPercent}%)</span>
              </div>

              <div className="flex items-center justify-between gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Overdue Dues</span>
                </div>
                <span className="font-bold text-red-600">{overdueCount} ({overduePercent}%)</span>
              </div>

              <div className="flex items-center justify-between gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="font-semibold text-gray-700">Due Next 7 Days</span>
                </div>
                <span className="font-bold text-amber-600">{dueSoonCount} ({dueSoonPercent}%)</span>
              </div>

              <div className="flex items-center justify-between gap-6 text-xs pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-gray-300 shrink-0"></span>
                  <span className="font-semibold text-gray-500">Unconfigured Cycles</span>
                </div>
                <span className="font-bold text-gray-500">{unconfiguredCount}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Action Callout & Quick Statistics (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between border border-slate-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">
                Collection Priority
              </span>
              <BellRing className="w-5 h-5 text-red-400" />
            </div>

            <h4 className="text-2xl font-black text-white leading-tight mb-2">
              Action Required for Overdue Parents
            </h4>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
              There are <strong className="text-red-400 font-bold">{overdueCount} parent accounts</strong> currently overdue totaling <strong className="text-white">₹{overdueAmount.toLocaleString()}</strong>. Send direct payment reminders to collect dues on time.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Next Upcoming Collection:</span>
              <span className="font-bold text-amber-400">₹{dueSoonAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Overall Collection Rate:</span>
              <span className="font-bold text-emerald-400">{paidPercent}% Healthy</span>
            </div>

            <button
              onClick={() => setFilterTab('overdue')}
              className="w-full mt-2 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>View All Overdue Accounts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Main Student Fee List Container */}
      <div className="bg-white rounded-3xl shadow-xs border border-gray-200 overflow-hidden">
        
        {/* Table Top Controls & Search Bar */}
        <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-gray-100 rounded-2xl border border-gray-200 shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {[
              { id: 'all', label: `All (${students.length})` },
              { id: 'overdue', label: `Overdue (${overdueCount})` },
              { id: 'dueSoon', label: `Due Soon (${dueSoonCount})` },
              { id: 'paid', label: `Paid (${paidCount})` },
              { id: 'unconfigured', label: `Unconfigured (${unconfiguredCount})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold">Student Info</th>
                <th className="px-6 py-4 font-bold text-red-700">Student ID</th>
                <th className="px-6 py-4 font-bold">Fee Cycle & Amount</th>
                <th className="px-6 py-4 font-bold">Next Payment Due</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400 font-medium">Loading student fee records...</td>
                </tr>
              ) : filteredRows.length > 0 ? (
                filteredRows.map((item) => {
                  const st = item.student;
                  const p = item.payment;
                  const stStatus = item.stStatus;
                  const activeCycle = item.activeCycle;

                  const displayAmount = p?.amount || activeCycle?.feeAmount || stStatus.amount || parseFloat((st.termFee || '2000').replace(/[^0-9.]/g, '')) || 2000;
                  const displayType = activeCycle?.feeType || 'Monthly Tuition';
                  const isPaidDoc = p?.status === 'PAID';

                  return (
                    <tr key={item.rowKey} className="hover:bg-gray-50/80 transition-colors">
                      {/* Student Info */}
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-black text-xs shrink-0">
                            {st.fullName ? st.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-900">{st.fullName}</p>
                              {item.totalTxns > 1 && isPaidDoc && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-md border border-purple-200">
                                  Txn #{item.txnIndex}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 font-normal">{st.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-6 py-4 font-mono font-bold text-red-700">
                        {st.studentId || 'N/A'}
                      </td>

                      {/* Fee Cycle & Amount */}
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-extrabold text-gray-900 text-base">₹{displayAmount.toLocaleString('en-IN')}</span>
                          <p className="text-[11px] text-gray-500 font-medium">
                            {displayType} • {p?.paymentMethod && p.paymentMethod !== 'NONE' ? p.paymentMethod : 'Regular'}
                          </p>
                        </div>
                      </td>

                      {/* Payment Date / Due Date */}
                      <td className="px-6 py-4">
                        {p?.paymentDate ? (
                          <div>
                            <span className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline" />
                              Paid: {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                              {new Date(p.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ) : (p?.dueDate || activeCycle?.nextDueDate) ? (
                          <div>
                            <span className="font-bold text-gray-900 text-xs">
                              Due: {new Date(p?.dueDate || activeCycle.nextDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <p className={`text-[11px] font-bold ${
                              stStatus.status === 'overdue' ? 'text-red-600' : stStatus.status === 'dueSoon' ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                              {stStatus.label}
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>

                      {/* Status & Ref */}
                      <td className="px-6 py-4">
                        {isPaidDoc ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              PAID ({p.paymentMethod || 'ONLINE'})
                            </span>
                            {p.transactionId && (
                              <p className="text-[10px] font-mono text-gray-400 mt-1 truncate max-w-[150px]" title={p.transactionId}>
                                Ref: {p.transactionId}
                              </p>
                            )}
                          </div>
                        ) : stStatus.status === 'overdue' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-red-100 text-red-700 border border-red-200 shadow-2xs">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                            Overdue
                          </span>
                        ) : stStatus.status === 'dueSoon' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Due Soon
                          </span>
                        ) : stStatus.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Paid / Up-to-Date
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            Unconfigured
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(activeCycle || stStatus.status === 'paid' || isPaidDoc) && (
                            <button
                              onClick={() => {
                                setRecordingStudent(st);
                                setPaymentForm({
                                  amountPaid: displayAmount,
                                  paymentMethod: 'UPI',
                                  notes: 'Regular tuition fee payment'
                                });
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                              title="Record payment received from parent"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Record Payment</span>
                            </button>
                          )}

                          {stStatus.status === 'overdue' && (
                            <button
                              onClick={() => handleSendReminder(st)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                              title="Send payment reminder to parent"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>Remind Parent</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleStartConfigure(st)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-all border border-gray-200 cursor-pointer"
                          >
                            {activeCycle ? 'Edit Cycle' : 'Configure Cycle'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-500 font-medium">No payment records found matching your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Record Payment Modal */}
      {recordingStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Record Fee Payment</h3>
                <p className="text-xs text-gray-500 mt-0.5">Student: {recordingStudent.fullName}</p>
              </div>
              <button onClick={() => setRecordingStudent(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Amount Paid (₹)</label>
                <input
                  type="number"
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash Receipt</option>
                  <option value="NetBanking">Net Banking</option>
                  <option value="Card">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Notes / Reference No.</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  placeholder="e.g. Received via UPI Ref #192837"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl text-xs font-medium border border-emerald-100">
                Recording this payment will automatically advance the next due date by {cyclesMap[recordingStudent._id]?.cycleDays || 30} days.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setRecordingStudent(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configure Cycle Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Configure Fee Cycle</h3>
                <p className="text-xs text-gray-500 mt-0.5">Student: {editingStudent.fullName}</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Fee Amount (₹)</label>
                <input
                  type="number"
                  value={cycleForm.feeAmount}
                  onChange={(e) => setCycleForm({ ...cycleForm, feeAmount: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Fee Label / Category</label>
                <input
                  type="text"
                  value={cycleForm.feeType}
                  onChange={(e) => setCycleForm({ ...cycleForm, feeType: e.target.value })}
                  placeholder="e.g. Monthly Tuition Fee"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Cycle Frequency</label>
                <select
                  value={cycleForm.cycleDays}
                  onChange={(e) => setCycleForm({ ...cycleForm, cycleDays: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value={7}>Weekly (Every 7 Days)</option>
                  <option value={15}>Bi-Weekly (Every 15 Days)</option>
                  <option value={30}>Monthly (Every 30 Days)</option>
                  <option value={90}>Quarterly (Every 90 Days)</option>
                  <option value={365}>Yearly (Every 365 Days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Next Payment Due Date</label>
                <input
                  type="date"
                  value={cycleForm.nextDueDate}
                  onChange={(e) => setCycleForm({ ...cycleForm, nextDueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setEditingStudent(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCycle}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-md"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Transaction History & Receipts Modal */}
      {viewingHistoryStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">Payment & Receipt History</h3>
                <p className="text-xs text-gray-500 mt-0.5">Student: {viewingHistoryStudent.fullName} ({viewingHistoryStudent.studentId || 'N/A'})</p>
              </div>
              <button onClick={() => setViewingHistoryStudent(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Total Money Collected</p>
                <p className="text-2xl font-black text-emerald-900 mt-0.5">
                  ₹{((viewingHistoryStudent.payments || []).filter((p: any) => p.status === 'PAID').reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)).toLocaleString('en-IN')}
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold text-xs rounded-full shadow-xs">
                {(viewingHistoryStudent.payments || []).filter((p: any) => p.status === 'PAID').length} Completed Receipts
              </span>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">All Payment Transactions</h4>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-100 uppercase">
                    <tr>
                      <th className="px-4 py-3">Date / Due</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Status / Method</th>
                      <th className="px-4 py-3">Transaction Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {(viewingHistoryStudent.payments || []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-400">No payment records found for this student.</td>
                      </tr>
                    ) : (
                      (viewingHistoryStudent.payments || []).map((p: any) => (
                        <tr key={p._id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="font-bold text-gray-900">Due: {p.dueDate ? new Date(p.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
                            {p.paymentDate && <p className="text-[10px] text-gray-400">Paid: {new Date(p.paymentDate).toLocaleDateString('en-IN')}</p>}
                          </td>
                          <td className="px-4 py-3 font-extrabold text-gray-900">
                            ₹{p.amount || 2000}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              p.status === 'PAID' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status} {p.paymentMethod !== 'NONE' ? `(${p.paymentMethod})` : ''}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[10px] text-gray-600">
                            {p.transactionId || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setViewingHistoryStudent(null)}
                className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
