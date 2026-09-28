import { useState, useEffect } from 'react';
import { GraduationCap, Users, CheckCircle2, Clock, Search, Filter, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { API_BASE_URL } from '../config/api';

export const Dashboard = () => {
  const [studentCount, setStudentCount] = useState<number>(0);
  const [parentCount, setParentCount] = useState<number>(0);
  const [revenueData, setRevenueData] = useState<{
    totalRevenue: number;
    totalCollected: number;
    totalPending: number;
    paidCount: number;
    pendingCount: number;
  }>({
    totalRevenue: 0,
    totalCollected: 0,
    totalPending: 0,
    paidCount: 0,
    pendingCount: 0
  });
  const [feeStatusList, setFeeStatusList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  
  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userEmail) headers['user-email'] = userEmail;

      const [studentsRes, parentsRes, revenueRes, statusListRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users?role=student`),
        fetch(`${API_BASE_URL}/api/users?role=parent`),
        fetch(`${API_BASE_URL}/api/fees/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/fees/all-status`, { headers })
      ]);

      const students = await studentsRes.json();
      const parents = await parentsRes.json();

      setStudentCount(Array.isArray(students) ? students.length : 0);
      setParentCount(Array.isArray(parents) ? parents.length : 0);

      let rev = {
        totalRevenue: 0,
        totalCollected: 0,
        totalPending: 0,
        paidCount: 0,
        pendingCount: 0
      };

      if (revenueRes.ok) {
        const revJson = await revenueRes.json();
        rev = {
          totalRevenue: revJson.totalRevenue || 0,
          totalCollected: revJson.totalCollected || 0,
          totalPending: revJson.totalPending || 0,
          paidCount: revJson.paidCount || 0,
          pendingCount: revJson.pendingCount || 0
        };
      }

      let listData: any[] = [];
      if (statusListRes.ok) {
        const listJson = await statusListRes.json();
        if (Array.isArray(listJson) && listJson.length > 0) {
          listData = listJson;
        }
      }

      if (listData.length === 0 && Array.isArray(students) && students.length > 0) {
        listData = students.map((st: any) => {
          const isPaid = st.status === 'Paid' || st.status === 'Active';
          const numAmount = parseFloat((st.termFee || '2000').replace(/[^0-9.]/g, '')) || 2000;
          return {
            _id: st._id,
            fullName: st.fullName || 'Student',
            studentId: st.studentId || 'N/A',
            email: st.email || '',
            courseName: st.courseName || 'General Tuition',
            termFee: st.termFee || `₹${numAmount.toLocaleString('en-IN')}`,
            userStatus: st.status,
            parent: st.parentId ? {
              fullName: typeof st.parentId === 'object' ? st.parentId.fullName : 'Linked Parent',
              email: typeof st.parentId === 'object' ? st.parentId.email : ''
            } : null,
            isPaid: isPaid,
            latestPayment: {
              amount: numAmount,
              status: isPaid ? 'PAID' : 'PENDING',
              paymentMethod: isPaid ? 'ONLINE' : 'NONE',
              dueDate: new Date(),
              paymentDate: isPaid ? new Date() : null
            }
          };
        });
      }

      // Deduplicate student records for accurate revenue metrics
      const uniqueListMap = new Map();
      listData.forEach(st => {
        const key = (st.studentId && st.studentId !== 'N/A') ? st.studentId : st._id;
        if (!uniqueListMap.has(key)) {
          uniqueListMap.set(key, st);
        }
      });
      const uniqueStudentsList = Array.from(uniqueListMap.values());

      if (rev.totalRevenue === 0 && uniqueStudentsList.length > 0) {
        let coll = 0;
        let pend = 0;
        let pCount = 0;
        let uCount = 0;
        uniqueStudentsList.forEach((item: any) => {
          const amt = item.latestPayment?.amount || parseFloat((item.termFee || '2000').replace(/[^0-9.]/g, '')) || 2000;
          if (item.isPaid) {
            coll += amt;
            pCount++;
          } else {
            pend += amt;
            uCount++;
          }
        });
        rev = {
          totalRevenue: coll + pend,
          totalCollected: coll,
          totalPending: pend,
          paidCount: pCount,
          pendingCount: uCount
        };
      }

      setRevenueData(rev);
      setFeeStatusList(listData);
    } catch (err) {
      console.error('Error fetching admin dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleConfirmCash = async (paymentId: string) => {
    if (!paymentId) return;
    setConfirmingId(paymentId);
    try {
      const token = localStorage.getItem('token');
      const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('adminEmail');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (userEmail) headers['user-email'] = userEmail;

      const res = await fetch(`${API_BASE_URL}/api/fees/payments/${paymentId}/confirm-cash`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        await fetchStats();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to confirm payment');
      }
    } catch (err) {
      console.error('Error confirming cash payment:', err);
      alert('Network error confirming payment.');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleDownloadAdminReceipt = (st: any) => {
    try {
      const doc = new jsPDF();
      const sName = st.fullName || 'Student';
      const sId = st.studentId || 'N/A';
      const pName = st.parent?.fullName || 'N/A';
      const pEmail = st.parent?.email || st.email || 'N/A';
      const amountStr = st.termFee || (st.latestPayment?.amount ? `Rs. ${st.latestPayment.amount}` : 'Rs. 2,000');
      const paidDate = st.latestPayment?.paymentDate ? new Date(st.latestPayment.paymentDate).toLocaleDateString() : new Date().toLocaleDateString();
      const dueDate = st.latestPayment?.dueDate ? new Date(st.latestPayment.dueDate).toLocaleDateString() : new Date().toLocaleDateString();
      const txnId = st.latestPayment?.transactionId || `TXN-${st._id ? st._id.slice(-8) : Date.now()}`;
      const payMethod = st.latestPayment?.paymentMethod || 'CASH';

      // Header Banner
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('YASHEDU ACADEMY', 15, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('OFFICIAL FEE PAYMENT RECEIPT', 15, 28);

      // Status Badge
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(150, 12, 45, 14, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('PAID', 167, 21);

      // Receipt Details Header
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Receipt No: ${txnId}`, 15, 48);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date Issued: ${paidDate}`, 145, 48);

      doc.setDrawColor(226, 232, 240);
      doc.line(15, 53, 195, 53);

      // Student & Parent Information Box
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, 58, 180, 42, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('STUDENT & PARENT INFORMATION', 20, 68);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Student Name: ${sName}`, 20, 77);
      doc.text(`Student ID: ${sId}`, 20, 85);
      doc.text(`Course: ${st.courseName || 'General Tuition'}`, 20, 93);

      doc.text(`Parent Name: ${pName}`, 110, 77);
      doc.text(`Email: ${pEmail}`, 110, 85);
      doc.text(`Payment Method: ${payMethod}`, 110, 93);

      // Payment Breakdown Table
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(241, 245, 249);
      doc.rect(15, 110, 180, 10, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.text('DESCRIPTION', 20, 116.5);
      doc.text('DUE DATE', 110, 116.5);
      doc.text('AMOUNT', 165, 116.5);

      // Table Row
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text('Tuition Fee Payment', 20, 130);
      doc.text(dueDate, 110, 130);
      doc.text(amountStr, 165, 130);

      doc.line(15, 140, 195, 140);

      // Total Box
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.text(`TOTAL PAID: ${amountStr}`, 135, 152);

      // Footer Notes
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('This is a computer-generated official receipt issued by YashEdu Academy Administration.', 15, 180);
      doc.text('For queries, contact support@yashedu.com or visit admin portal.', 15, 187);

      doc.save(`Receipt-${sId}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF receipt', err);
      alert('Error generating PDF receipt.');
    }
  };

  const paidPct = revenueData.totalRevenue > 0
    ? Math.round((revenueData.totalCollected / revenueData.totalRevenue) * 100)
    : 0;

  const unpaidPct = revenueData.totalRevenue > 0
    ? Math.round((revenueData.totalPending / revenueData.totalRevenue) * 100)
    : 0;

  // Filter student list & deduplicate by studentId / _id
  const rawFiltered = feeStatusList.filter((item) => {
    // Status Filter
    if (statusFilter === 'PAID' && !item.isPaid) return false;
    if (statusFilter === 'UNPAID' && item.isPaid) return false;

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.fullName?.toLowerCase().includes(q);
      const matchId = item.studentId?.toLowerCase().includes(q);
      const matchEmail = item.email?.toLowerCase().includes(q);
      const matchParent = item.parent?.fullName?.toLowerCase().includes(q);
      return matchName || matchId || matchEmail || matchParent;
    }

    return true;
  });

  const filteredStudentsMap = new Map();
  rawFiltered.forEach(st => {
    const key = (st.studentId && st.studentId !== 'N/A') ? st.studentId : st._id;
    if (!filteredStudentsMap.has(key)) {
      filteredStudentsMap.set(key, st);
    }
  });
  const filteredStudents = Array.from(filteredStudentsMap.values());

  const uniqueFeeStatusMap = new Map();
  feeStatusList.forEach(st => {
    const key = (st.studentId && st.studentId !== 'N/A') ? st.studentId : st._id;
    if (!uniqueFeeStatusMap.has(key)) {
      uniqueFeeStatusMap.set(key, st);
    }
  });
  const uniqueFeeStatusList = Array.from(uniqueFeeStatusMap.values());

  const paidCountCalculated = uniqueFeeStatusList.filter(s => s.isPaid).length;
  const unpaidCountCalculated = uniqueFeeStatusList.filter(s => !s.isPaid).length;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Analytics Overview</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Real-time academy user metrics & financial revenue breakdown</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
          <button 
            onClick={fetchStats}
            className="p-2 text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 sm:px-3 py-1.5 rounded-full font-mono font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Backend Analytics
          </span>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div 
          onClick={() => setStatusFilter('ALL')}
          className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider">Total Students</h3>
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{loading ? '...' : studentCount}</p>
          <p className="text-xs text-green-600 mt-2 font-semibold">Registered in system</p>
        </div>
        
        <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-gray-500 font-bold text-xs uppercase tracking-wider">Total Parents</h3>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{loading ? '...' : parentCount}</p>
          <p className="text-xs text-blue-600 mt-2 font-semibold">Linked parent accounts</p>
        </div>

        <div 
          onClick={() => setStatusFilter('PAID')}
          className={`bg-white p-5 sm:p-6 rounded-2xl shadow-xs border transition-all cursor-pointer bg-gradient-to-br from-emerald-50/40 to-white ${
            statusFilter === 'PAID' ? 'ring-2 ring-emerald-500 border-emerald-300' : 'border-emerald-100 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-emerald-800 font-bold text-xs uppercase tracking-wider">Collected Revenue</h3>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900">
            {loading ? '...' : `₹${revenueData.totalCollected.toLocaleString('en-IN')}`}
          </p>
          <p className="text-xs text-emerald-700 mt-2 font-semibold">{revenueData.paidCount} Paid Invoices ({paidPct}%)</p>
        </div>

        <div 
          onClick={() => setStatusFilter('UNPAID')}
          className={`bg-white p-5 sm:p-6 rounded-2xl shadow-xs border transition-all cursor-pointer bg-gradient-to-br from-amber-50/40 to-white ${
            statusFilter === 'UNPAID' ? 'ring-2 ring-amber-500 border-amber-300' : 'border-amber-100 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-amber-800 font-bold text-xs uppercase tracking-wider">Unpaid / Pending</h3>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            {loading ? '...' : `₹${revenueData.totalPending.toLocaleString('en-IN')}`}
          </p>
          <p className="text-xs text-amber-700 mt-2 font-semibold">{revenueData.pendingCount} Pending Invoices ({unpaidPct}%)</p>
        </div>
      </div>

      {/* Main Revenue Analytics & Visual Progress Bar Section */}
      <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--color-primary)] inline-block"></span>
              <h3 className="text-xl font-bold text-gray-900">Academy Revenue Breakdown</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">Detailed comparison of paid collections versus outstanding unpaid tuition fees</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 font-medium block">Total Invoiced Amount</span>
            <p className="text-2xl font-black text-gray-900">₹{revenueData.totalRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Visual Revenue Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-emerald-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Paid Revenue: ₹{revenueData.totalCollected.toLocaleString('en-IN')} ({paidPct}%)
            </span>
            <span className="text-amber-700 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              Unpaid Pending: ₹{revenueData.totalPending.toLocaleString('en-IN')} ({unpaidPct}%)
            </span>
          </div>

          <div className="h-6 w-full bg-gray-100 rounded-full overflow-hidden p-1 flex gap-1 border border-gray-200/80 shadow-inner">
            <div 
              onClick={() => setStatusFilter('PAID')}
              style={{ width: `${revenueData.totalRevenue > 0 ? paidPct : 50}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700 shadow-sm relative group cursor-pointer"
              title={`Click to filter Paid: ₹${revenueData.totalCollected} (${paidPct}%)`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white">
                {paidPct > 10 ? `${paidPct}% PAID` : ''}
              </span>
            </div>

            <div 
              onClick={() => setStatusFilter('UNPAID')}
              style={{ width: `${revenueData.totalRevenue > 0 ? unpaidPct : 50}%` }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-700 shadow-sm relative group cursor-pointer"
              title={`Click to filter Unpaid: ₹${revenueData.totalPending} (${unpaidPct}%)`}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-extrabold text-white">
                {unpaidPct > 10 ? `${unpaidPct}% UNPAID` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div 
            onClick={() => setStatusFilter('PAID')}
            className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center justify-between cursor-pointer hover:bg-emerald-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <h4 className="font-bold text-emerald-950 text-sm">Paid Collections</h4>
                <p className="text-xs text-emerald-700 mt-0.5">{revenueData.paidCount} transactions completed</p>
              </div>
            </div>
            <p className="text-xl font-extrabold text-emerald-900">₹{revenueData.totalCollected.toLocaleString('en-IN')}</p>
          </div>

          <div 
            onClick={() => setStatusFilter('UNPAID')}
            className="p-5 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center justify-between cursor-pointer hover:bg-amber-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                !
              </div>
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Pending Outstandings</h4>
                <p className="text-xs text-amber-700 mt-0.5">{revenueData.pendingCount} invoices awaiting payment</p>
              </div>
            </div>
            <p className="text-xl font-extrabold text-amber-900">₹{revenueData.totalPending.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      {/* DETAILED WHO PAID & WHO NOT PAID STUDENT LIST */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xs overflow-hidden space-y-4 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>Student Fee Payment Status</span>
              <span className="text-[11px] sm:text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-semibold">
                Who Paid & Who Not Paid
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Live breakdown of individual student fee status, invoices, and parent contacts</p>
          </div>

          {/* Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student or parent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] w-full sm:w-56"
              />
            </div>

            {/* Filter Buttons */}
            <div className="grid grid-cols-3 sm:flex bg-gray-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all text-center ${
                  statusFilter === 'ALL' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({uniqueFeeStatusList.length})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Paid ({paidCountCalculated})</span>
              </button>
              <button
                onClick={() => setStatusFilter('UNPAID')}
                className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
                  statusFilter === 'UNPAID' ? 'bg-amber-600 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Unpaid ({unpaidCountCalculated})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-gray-400" />
              Loading student fee records...
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((st) => {
              const isPaid = st.isPaid;
              const latestP = st.latestPayment;

              return (
                <div key={st._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {st.fullName ? st.fullName.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-sm truncate">{st.fullName}</p>
                        <p className="text-xs text-red-700 font-mono font-bold">{st.studentId}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-sm text-gray-900">
                        {st.termFee || (latestP ? `₹${latestP.amount}` : '₹2,000')}
                      </p>
                      <p className="text-[10px] text-gray-400">{st.courseName || 'Tuition'}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Status:</span>
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>PAID</span>
                        {latestP?.paymentMethod && (
                          <span className="text-[9px] bg-emerald-100 px-1 rounded uppercase font-mono ml-0.5">
                            {latestP.paymentMethod}
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>UNPAID / PENDING</span>
                      </span>
                    )}
                  </div>

                  {st.parent && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Parent: {st.parent.fullName}</span>
                      <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{st.parent.email || st.parent.phone}</span>
                    </div>
                  )}

                  <div className="pt-1">
                    {!isPaid ? (
                      <button
                        onClick={() => handleConfirmCash(st.pendingPaymentId || st._id)}
                        disabled={confirmingId === (st.pendingPaymentId || st._id)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all text-center cursor-pointer"
                      >
                        {confirmingId === (st.pendingPaymentId || st._id) ? 'Confirming...' : 'Mark Cash Paid ✓'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDownloadAdminReceipt(st)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-700"
                        title="Download Official Fee PDF Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Receipt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-400 text-sm">No students match current filter</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[650px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider rounded-xl">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name & ID</th>
                <th className="px-6 py-4 font-bold">Linked Parent</th>
                <th className="px-6 py-4 font-bold">Fee Amount</th>
                <th className="px-6 py-4 font-bold">Payment Status</th>
                <th className="px-6 py-4 font-bold text-right">Action / Confirmation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                      <span>Loading student fee records...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const isPaid = st.isPaid;
                  const latestP = st.latestPayment;

                  return (
                    <tr key={st._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Student Name & ID */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {st.fullName ? st.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{st.fullName}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                              <span className="text-red-700 font-bold">{st.studentId}</span>
                              <span>•</span>
                              <span>{st.courseName || 'Student'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent */}
                      <td className="px-6 py-4">
                        {st.parent ? (
                          <div>
                            <p className="font-semibold text-gray-800 text-xs">{st.parent.fullName}</p>
                            <p className="text-[11px] text-gray-400">{st.parent.email || st.parent.phone || 'Linked'}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No parent linked</span>
                        )}
                      </td>

                      {/* Fee Amount */}
                      <td className="px-6 py-4 font-extrabold text-gray-900">
                        {st.termFee || (latestP ? `₹${latestP.amount}` : '₹2,000')}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>PAID (UP TO DATE)</span>
                              {latestP?.paymentMethod && (
                                <span className="text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded text-emerald-800 uppercase font-mono ml-1">
                                  {latestP.paymentMethod}
                                </span>
                              )}
                            </div>
                            {latestP?.paymentDate && (
                              <p className="text-[10px] text-gray-400 mt-1">
                                Paid on: {new Date(latestP.paymentDate).toLocaleDateString()}
                              </p>
                            )}
                            {st.nextDueDate && (
                              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                                Next Due: {new Date(st.nextDueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>NOT PAID / PENDING</span>
                            </div>
                            {latestP?.dueDate && (
                              <p className="text-[10px] text-amber-700 font-medium mt-1">
                                Due: {new Date(latestP.dueDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => handleConfirmCash(st.pendingPaymentId || st._id)}
                            disabled={confirmingId === (st.pendingPaymentId || st._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                          >
                            {confirmingId === (st.pendingPaymentId || st._id) ? 'Confirming...' : 'Mark Cash Paid ✓'}
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-200/60 hidden sm:inline-block">
                              Verified ✓
                            </span>
                            <button
                              onClick={() => handleDownloadAdminReceipt(st)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5 border border-emerald-700 cursor-pointer"
                              title="Download Official Fee PDF Receipt"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Receipt</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-gray-600">No students match current filter</p>
                      <p className="text-xs text-gray-400">Try changing status tab or clearing search query</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

