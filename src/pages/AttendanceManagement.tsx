import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle2, Clock, XCircle, BarChart3, UserCheck, Sparkles, Filter, Check, ShieldCheck, Download, FileText } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const AttendanceManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [chartFilter, setChartFilter] = useState<'all' | 'high' | 'low'>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: string; text: string }>({ type: '', text: '' });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users?role=student`);

      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching student attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const todayDateStr = new Date().toISOString().split('T')[0];

  // Persist student-indexed date attendance status map (studentId -> dateStr -> status)
  const [dateStatusMap, setDateStatusMap] = useState<Record<string, Record<string, 'Present' | 'Late' | 'Absent'>>>(() => {
    try {
      const saved = localStorage.getItem('yashedu_attendance_history_v3');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yashedu_attendance_history_v3', JSON.stringify(dateStatusMap));
    } catch (err) {
      console.error('Failed to save attendance history:', err);
    }
  }, [dateStatusMap]);

  // Helper to get status for a specific student on the selected date (returns null if not tapped)
  const getStatusForSelectedDate = (studentId: string) => {
    if (dateStatusMap[studentId] && dateStatusMap[studentId][selectedDate]) {
      return dateStatusMap[studentId][selectedDate];
    }
    return null;
  };

  // Helper to format 30-day percentage rate (3.33% per day present)
  const format30DayRate = (present: number, late: number = 0) => {
    const totalVal = (present + late * 0.5) * (100 / 30);
    if (totalVal === 0) return '0%';
    if (totalVal >= 100) return '100%';
    if (Number.isInteger(totalVal)) return `${totalVal}%`;
    return `${totalVal.toFixed(2)}%`;
  };

  // Helper to get 30-day attendance history starting from Day 1 (index 0) sequentially by explicit recorded dates
  const get30DayHistory = (student: any, customMap?: Record<string, Record<string, 'Present' | 'Late' | 'Absent'>>) => {
    const mapToUse = customMap || dateStatusMap;
    const studentMap = mapToUse[student._id] || {};
    const recordedDates = Object.keys(studentMap).sort();

    const days: ('Unmarked' | 'Present' | 'Late' | 'Absent')[] = new Array(30).fill('Unmarked');
    const dayDates: string[] = new Array(30).fill('');

    recordedDates.slice(0, 30).forEach((dateStr, idx) => {
      days[idx] = studentMap[dateStr];
      dayDates[idx] = dateStr;
    });

    const presentCount = days.filter(d => d === 'Present').length;
    const lateCount = days.filter(d => d === 'Late').length;
    const absentCount = days.filter(d => d === 'Absent').length;

    const hasMarkedDays = recordedDates.length > 0 || (student.attendanceStatus && student.attendanceStatus !== 'Not Marked');
    const rateStr = hasMarkedDays ? format30DayRate(presentCount, lateCount) : 'Not Marked';
    const percentage = hasMarkedDays ? parseFloat(format30DayRate(presentCount, lateCount).replace('%', '')) || 0 : null;

    return { percentage, rateStr, days, dayDates, presentCount, lateCount, absentCount, totalDaysRecorded: recordedDates.length, hasMarkedDays };
  };

  const markedHistories = students
    .map(s => get30DayHistory(s))
    .filter(h => h.hasMarkedDays && h.percentage !== null);

  const avgAttendance = markedHistories.length > 0
    ? Math.round(markedHistories.reduce((a, b) => a + (b.percentage || 0), 0) / markedHistories.length)
    : null;

  const markedStudentsCount = students.filter(s => {
    const hasHistory = dateStatusMap[s._id] && Object.keys(dateStatusMap[s._id]).length > 0;
    return hasHistory || (s.attendanceStatus && s.attendanceStatus !== 'Not Marked');
  }).length;

  const lateTodayCount = students.filter(s => s.attendanceStatus === 'Late').length;
  const absentTodayCount = students.filter(s => s.attendanceStatus === 'Absent').length;

  const latePercentage = markedStudentsCount > 0 ? Math.round((lateTodayCount / markedStudentsCount) * 100) : null;
  const absentPercentage = markedStudentsCount > 0 ? Math.round((absentTodayCount / markedStudentsCount) * 100) : null;

  // Quick 1-click attendance entry handler for selectedDate (deselects if tapping same status again)
  const handleQuickMarkAttendance = async (student: any, newStatus: 'Present' | 'Late' | 'Absent') => {
    setSavingId(student._id);
    setSaveMessage({ type: '', text: '' });

    const currentStatus = dateStatusMap[student._id]?.[selectedDate];
    const isTogglingOff = currentStatus === newStatus;
    const nextStatus = isTogglingOff ? null : newStatus;

    // Update date-specific attendance status for student
    const studentRecords = { ...(dateStatusMap[student._id] || {}) };
    if (isTogglingOff) {
      delete studentRecords[selectedDate];
    } else {
      studentRecords[selectedDate] = newStatus;
    }

    const updatedMap = {
      ...dateStatusMap,
      [student._id]: studentRecords
    };
    setDateStatusMap(updatedMap);

    // Calculate updated attendance rate synchronously from updatedMap
    const history = get30DayHistory(student, updatedMap);
    const updatedAttendance = history.rateStr;

    // Optimistic state update if marking today
    if (selectedDate === todayDateStr) {
      setStudents(prev => prev.map(s => {
        if (s._id === student._id || (s.email && s.email.toLowerCase() === student.email.toLowerCase())) {
          return { ...s, attendanceStatus: (nextStatus || 'Not Marked') as any, attendance: updatedAttendance };
        }
        return s;
      }));
    }

    try {
      const url = student._id 
        ? `${API_BASE_URL}/api/users/id/${student._id}`
        : `${API_BASE_URL}/api/users/${encodeURIComponent(student.email)}?role=student`;

      await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance: updatedAttendance,
          attendanceStatus: nextStatus || 'Not Marked'
        })
      });

      setSaveMessage({ 
        type: 'success', 
        text: isTogglingOff 
          ? `Cleared attendance for ${student.fullName} on ${selectedDate}.` 
          : `Marked ${student.fullName} as ${newStatus} for ${selectedDate}!` 
      });
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      setSaveMessage({ type: 'error', text: 'Error updating daily attendance record.' });
      fetchStudents();
    } finally {
      setSavingId(null);
    }
  };

  // Remove a specific day box from student 30-day matrix
  const handleRemoveDayBox = (studentId: string, dateStr: string) => {
    if (!studentId || !dateStr) return;
    setDateStatusMap(prev => {
      const studentRecords = { ...(prev[studentId] || {}) };
      delete studentRecords[dateStr];
      return {
        ...prev,
        [studentId]: studentRecords
      };
    });
  };

  // Bulk Mark All Present for selectedDate
  const handleMarkAllPresent = async () => {
    if (students.length === 0) return;
    setBulkSaving(true);
    setSaveMessage({ type: '', text: '' });

    // Store date-specific attendance status for all students
    setDateStatusMap(prev => {
      const updatedMap = { ...prev };
      students.forEach(st => {
        const studentRecords = { ...(updatedMap[st._id] || {}) };
        studentRecords[selectedDate] = 'Present';
        updatedMap[st._id] = studentRecords;
      });
      return updatedMap;
    });

    // Optimistic local state update
    if (selectedDate === todayDateStr) {
      setStudents(prev => prev.map(st => {
        return { ...st, attendanceStatus: 'Present' };
      }));
    }

    try {
      await Promise.all(
        students.map((st) => {
          const url = st._id 
            ? `${API_BASE_URL}/api/users/id/${st._id}`
            : `${API_BASE_URL}/api/users/${encodeURIComponent(st.email)}?role=student`;


          return fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attendanceStatus: 'Present'
            })
          });
        })
      );

      setSaveMessage({ type: 'success', text: `Successfully marked all ${students.length} students as Present for ${selectedDate}!` });
    } catch (err) {
      console.error('Error bulk updating attendance:', err);
      setSaveMessage({ type: 'error', text: 'Failed to mark all students present.' });
      fetchStudents();
    } finally {
      setBulkSaving(false);
    }
  };

  // Filter students for the 30-day chart list
  const filteredStudentsForChart = students.filter(st => {
    const percentage = parseInt((st.attendance || '0').replace('%', ''), 10) || 0;
    if (chartFilter === 'high') return percentage >= 80;
    if (chartFilter === 'low') return percentage < 80;
    return true;
  });

  // Generate PDF report for 30-day attendance data
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const studentsHtml = filteredStudentsForChart.map((st) => {
      const history = get30DayHistory(st);
      const matrixBoxesHtml = history.days.map((status, idx) => {
        const color = status === 'Present' ? '#10b981' :
                      status === 'Late' ? '#f59e0b' :
                      status === 'Absent' ? '#ef4444' : '#e5e7eb';
        const label = status === 'Present' ? 'P' :
                      status === 'Late' ? 'L' :
                      status === 'Absent' ? 'A' :
                      idx === 0 ? 'D1' : idx === 29 ? 'D30' : '';
        return `<td style="background-color: ${color}; width: 18px; height: 18px; border-radius: 3px; border: 1px solid #d1d5db; text-align: center; font-size: 8px; font-weight: bold; color: white;">${label}</td>`;
      }).join('');

      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 12px; font-weight: bold; color: #111827;">
            ${st.fullName}<br/>
            <span style="font-size: 11px; font-weight: normal; color: #6b7280;">${st.email}</span>
          </td>
          <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; color: #dc2626;">
            ${st.studentId || 'N/A'}
          </td>
          <td style="padding: 10px 12px;">
            <span style="background: #ecfdf5; color: #047857; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 11px; border: 1px solid #a7f3d0;">
              ${history.presentCount}/30 Days Present (${history.rateStr})
            </span>
          </td>
          <td style="padding: 10px 12px;">
            <table style="border-collapse: separate; border-spacing: 2px;">
              <tr>${matrixBoxesHtml}</tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>YashEdu - 30-Day Attendance Matrix Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1f2937; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ef4444; padding-bottom: 16px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; color: #111827; }
            .subtitle { font-size: 12px; color: #6b7280; margin-top: 4px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
            .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px; }
            .stat-title { font-size: 10px; color: #6b7280; font-weight: bold; text-transform: uppercase; }
            .stat-value { font-size: 18px; font-weight: bold; color: #111827; margin-top: 4px; }
            table.main-table { width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; color: #4b5563; font-weight: bold; border-bottom: 1px solid #e5e7eb; }
            .legend { display: flex; gap: 16px; margin-bottom: 16px; font-size: 11px; font-weight: 600; }
            .legend-item { display: flex; align-items: center; gap: 6px; }
            .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
            @media print {
              body { padding: 0; }
              @page { margin: 1cm; size: landscape; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">YashEdu - 30-Day Attendance Matrix Report</div>
              <div class="subtitle">Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #4b5563;">
              <strong>Total Records:</strong> ${filteredStudentsForChart.length}<br/>
              <strong>Filter:</strong> ${chartFilter.toUpperCase()}
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-title">30-Day Cohort Present</div>
              <div class="stat-value" style="color: #059669;">${avgAttendance}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Tracked Period</div>
              <div class="stat-value" style="color: #2563eb;">30 Days</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Late Attendance Rate</div>
              <div class="stat-value" style="color: #d97706;">${latePercentage}%</div>
            </div>
            <div class="stat-card">
              <div class="stat-title">Absenteeism Rate</div>
              <div class="stat-value" style="color: #dc2626;">${absentPercentage}%</div>
            </div>
          </div>

          <div class="legend">
            <div class="legend-item"><span class="dot" style="background: #e5e7eb;"></span> Empty (Unmarked)</div>
            <div class="legend-item"><span class="dot" style="background: #10b981;"></span> Present</div>
            <div class="legend-item"><span class="dot" style="background: #f59e0b;"></span> Late</div>
            <div class="legend-item"><span class="dot" style="background: #ef4444;"></span> Absent</div>
          </div>

          <table class="main-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Student ID</th>
                <th>Attendance Summary</th>
                <th>30-Day Attendance Matrix</th>
              </tr>
            </thead>
            <tbody>
              ${studentsHtml}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-red-600" /> Student Attendance Entry
          </h2>
          <p className="text-sm text-gray-500">Mark daily attendance directly for students (Present, Late, Absent)</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl font-bold shadow-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-600" /> Cohort Average: {avgAttendance}%
          </span>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export PDF Report
          </button>
        </div>
      </div>

      {saveMessage.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex justify-between items-center ${
          saveMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <span>{saveMessage.text}</span>
          <button onClick={() => setSaveMessage({ type: '', text: '' })} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
      )}

      {/* 1. Daily Attendance Entry Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Live Student Attendance Directory</h3>
            <p className="text-xs text-gray-500 mt-0.5">Selected Date: <span className="font-bold text-red-600">{selectedDate}</span></p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Selector */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs hover:border-red-300 focus-within:ring-2 focus-within:ring-red-500/20 text-xs font-bold text-gray-800 transition-all">
              <Calendar className="w-4 h-4 text-red-600 flex-shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-white text-gray-900 font-bold outline-none cursor-pointer text-xs"
              />
            </div>

            {/* Bulk Mark All Present Button */}
            <button
              onClick={handleMarkAllPresent}
              disabled={bulkSaving || students.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {bulkSaving ? 'Saving...' : 'Mark All Present'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Student Name</th>
                <th className="px-6 py-4 font-bold text-red-700">Student ID</th>
                <th className="px-6 py-4 font-bold text-green-700">Status ({selectedDate === todayDateStr ? 'Today' : selectedDate})</th>
                <th className="px-6 py-4 font-bold text-center">Mark Attendance for {selectedDate === todayDateStr ? 'Today' : selectedDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">Loading student attendance data...</td>
                </tr>
              ) : students.length > 0 ? (
                students.map((st) => {
                  const isSaving = savingId === st._id;
                  const currentStatus = getStatusForSelectedDate(st._id);

                  return (
                    <tr key={st._id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Student Name */}
                      <td className="px-6 py-4 font-bold text-gray-900">
                        <div>
                          <p>{st.fullName}</p>
                          <p className="text-xs text-gray-400 font-normal">{st.email}</p>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="px-6 py-4 font-mono font-bold">
                        <span className={`px-2.5 py-1 rounded-lg text-xs ${
                          st.studentId ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-100 text-gray-400 italic'
                        }`}>
                          {st.studentId || 'N/A'}
                        </span>
                      </td>

                      {/* Current Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          currentStatus === 'Absent' ? 'bg-red-100 text-red-700 border border-red-200' :
                          currentStatus === 'Late' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                          currentStatus === 'Present' ? 'bg-green-100 text-green-700 border border-green-200' :
                          'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          {currentStatus ? currentStatus : 'Not Marked'}
                        </span>
                      </td>

                      {/* Direct Daily Attendance Action Buttons */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleQuickMarkAttendance(st, 'Present')}
                            disabled={isSaving}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-xs ${
                              currentStatus === 'Present'
                                ? 'bg-green-600 text-white ring-2 ring-green-600/30'
                                : 'bg-white text-green-700 border border-green-200 hover:bg-green-50'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" /> Present
                          </button>

                          <button
                            onClick={() => handleQuickMarkAttendance(st, 'Late')}
                            disabled={isSaving}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-xs ${
                              currentStatus === 'Late'
                                ? 'bg-amber-500 text-white ring-2 ring-amber-500/30'
                                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" /> Late
                          </button>

                          <button
                            onClick={() => handleQuickMarkAttendance(st, 'Absent')}
                            disabled={isSaving}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 shadow-xs ${
                              currentStatus === 'Absent'
                                ? 'bg-red-600 text-white ring-2 ring-red-600/30'
                                : 'bg-white text-red-700 border border-red-200 hover:bg-red-50'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">No student records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. AUTOMATED 30-DAY ATTENDANCE CHART BOARD */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
        
        {/* Chart Board Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-50 rounded-xl text-red-600">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h3 className="text-xl font-bold text-gray-900">30-Day Attendance Matrix & History</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Auto-Synced Directory
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Visual 30-day attendance history calculated day-by-day from daily attendance entries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <button
                onClick={() => setChartFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartFilter === 'all' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Students ({students.length})
              </button>
              <button
                onClick={() => setChartFilter('high')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartFilter === 'high' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                High Attendance (≥80%)
              </button>
              <button
                onClick={() => setChartFilter('low')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  chartFilter === 'low' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Low Attendance (&lt;80%)
              </button>
            </div>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        </div>

        {/* Top Metric Cards (100% Real Database Calculations) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-emerald-50/80 to-emerald-50/20 rounded-2xl border border-emerald-100/80 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-emerald-800">30-Day Cohort Present</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{avgAttendance !== null ? `${avgAttendance}%` : 'Not Marked'}</p>
              <p className="text-[11px] text-emerald-600 mt-0.5 font-medium">{avgAttendance !== null ? 'Real student average' : 'Awaiting daily marking'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-blue-50/80 to-blue-50/20 rounded-2xl border border-blue-100/80 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-blue-800">Tracked Period</p>
              <p className="text-2xl font-black text-blue-600 mt-1">30 Days</p>
              <p className="text-[11px] text-blue-500 mt-0.5 font-medium">Rolling monthly window</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-amber-50/80 to-amber-50/20 rounded-2xl border border-amber-100/80 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-amber-800">Late Attendance Rate</p>
              <p className="text-2xl font-black text-amber-600 mt-1">
                {latePercentage !== null ? `${latePercentage}%` : 'Not Marked'}
              </p>
              <p className="text-[11px] text-amber-600 mt-0.5 font-medium">{lateTodayCount} of {students.length} students late</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 bg-gradient-to-br from-red-50/80 to-red-50/20 rounded-2xl border border-red-100/80 flex items-center justify-between shadow-2xs">
            <div>
              <p className="text-xs font-bold text-red-800">Absenteeism Rate</p>
              <p className="text-2xl font-black text-red-600 mt-1">
                {absentPercentage !== null ? `${absentPercentage}%` : 'Not Marked'}
              </p>
              <p className="text-[11px] text-red-500 mt-0.5 font-medium">{absentTodayCount} of {students.length} students absent</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Individual Student 30-Day Attendance Grid Matrix */}
        <div className="space-y-4 pt-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-900">
              Student 30-Day Attendance Matrix ({filteredStudentsForChart.length})
            </h4>
            <div className="flex items-center gap-3 text-[11px] font-semibold text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-200 border border-gray-300"></span> Empty (Unmarked)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Late</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent</span>
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredStudentsForChart.length > 0 ? (
              filteredStudentsForChart.map((student) => {
                const history = get30DayHistory(student);

                return (
                  <div
                    key={student._id}
                    className="p-4 rounded-xl border border-gray-100 hover:border-gray-200 bg-white transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center text-xs">
                          {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-gray-900 text-sm">{student.fullName}</h5>
                            <span className="text-[10px] font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              {student.studentId || 'No ID'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>

                      {/* 30-Day Attendance Status Badge */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className={`px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-2 ${
                          history.hasMarkedDays 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                        }`}>
                          <CheckCircle2 className={`w-3.5 h-3.5 ${history.hasMarkedDays ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span>{history.hasMarkedDays ? `${history.presentCount}/30 Days Present` : 'Not Marked'}</span>
                          {history.hasMarkedDays && (
                            <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100/90 px-1.5 py-0.5 rounded-md">
                              {history.rateStr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 30-Day Square Heatmap Grid with Empty Bars */}
                    <div className="space-y-1">
                      <div className="grid grid-cols-15 sm:grid-cols-30 gap-1 pt-1">
                        {history.days.map((dayStatus, idx) => {
                          const bg = dayStatus === 'Present' ? 'bg-emerald-500 text-white border-emerald-600' :
                                     dayStatus === 'Late' ? 'bg-amber-400 text-white border-amber-500' :
                                     dayStatus === 'Absent' ? 'bg-red-500 text-white border-red-600' :
                                     'bg-gray-100 border-gray-200/90 text-gray-400';
                          return (
                            <div
                              key={idx}
                              onClick={() => history.dayDates[idx] && handleRemoveDayBox(student._id, history.dayDates[idx])}
                              title={history.dayDates[idx] ? `Click to remove Day ${idx + 1} (${history.dayDates[idx]}: ${dayStatus})` : `Day ${idx + 1}: Unmarked`}
                              className={`h-6 rounded-md border ${bg} flex items-center justify-center text-[9px] font-bold shadow-2xs ${
                                history.dayDates[idx] ? 'cursor-pointer hover:opacity-80 hover:scale-105 transition-transform' : ''
                              }`}
                            >
                              {dayStatus === 'Present' ? 'P' : dayStatus === 'Late' ? 'L' : dayStatus === 'Absent' ? 'A' : idx === 0 ? 'D1' : idx === 29 ? 'D30' : ''}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5 pt-1">
                        <span>Day 1</span>
                        <span>Day 15</span>
                        <span>Day 30 (Today)</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                No student records match the selected filter criteria.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
