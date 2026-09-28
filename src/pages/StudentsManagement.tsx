import { useState, useEffect } from 'react';
import { StudentDetailModal } from './StudentDetailModal';
import { ChangeCourseModal } from './ChangeCourseModal';
import { adminAuth } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { API_BASE_URL } from '../config/api';

export const StudentsManagement = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectStudent, setInspectStudent] = useState<any | null>(null);
  const [changeCourseStudent, setChangeCourseStudent] = useState<any | null>(null);

  // Edit Modal State
  const [editStudent, setEditStudent] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    studentId: '',
    phone: '',
    status: 'Paid',
    courseName: '',
    profilePicUrl: ''
  });
  const [updatingStudent, setUpdatingStudent] = useState(false);

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    age: '',
    dob: '',
    gender: 'Male',
    status: 'Paid',
    studentId: '',
    profilePicUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users?role=student`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenEdit = (student: any) => {
    setEditStudent(student);
    setEditFormData({
      fullName: student.fullName || student.name || '',
      email: student.email || '',
      studentId: student.studentId || '',
      phone: student.phone || '',
      status: student.status || 'Paid',
      courseName: student.courseName || '',
      profilePicUrl: student.profilePicUrl || ''
    });
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (isEdit) {
          setEditFormData(prev => ({ ...prev, profilePicUrl: base64 }));
        } else {
          setFormData(prev => ({ ...prev, profilePicUrl: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;

    setUpdatingStudent(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${editStudent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editFormData.fullName.trim(),
          email: editFormData.email.trim(),
          studentId: editFormData.studentId.trim(),
          phone: editFormData.phone.trim(),
          status: editFormData.status,
          courseName: editFormData.courseName.trim(),
          profilePicUrl: editFormData.profilePicUrl
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update student details');
      }

      await fetchStudents();
      setEditStudent(null);
    } catch (err: any) {
      console.error('Error updating student:', err);
      alert(err.message || 'Failed to update student record.');
    } finally {
      setUpdatingStudent(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) return;

    setSubmitting(true);
    setErrorMsg('');

    const generatedId = formData.studentId.trim() || `YEDU-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const trimmedEmail = formData.email.trim();

    try {
      const userCredential = await createUserWithEmailAndPassword(
        adminAuth, 
        trimmedEmail, 
        formData.password
      );
      
      const firebaseUid = userCredential.user.uid;
      await signOut(adminAuth);

      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          fullName: formData.fullName.trim(),
          email: trimmedEmail,
          role: 'student',
          studentId: generatedId,
          phone: formData.phone.trim(),
          age: formData.age,
          dob: formData.dob,
          gender: formData.gender,
          status: formData.status || 'Paid',
          profilePicUrl: formData.profilePicUrl
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create student in database');
      }

      await fetchStudents();
      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        age: '',
        dob: '',
        gender: 'Male',
        status: 'Paid',
        studentId: '',
        profilePicUrl: ''
      });
    } catch (err: any) {
      console.error('Error adding student:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('This email is already registered. Please use a different one or login.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Password should be at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Error adding student record');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}"?`)) {
      return;
    }
    try {
      if (id) {
        await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE'
        });
      }
      await fetchStudents();
    } catch (err) {
      console.error('Failed to delete student:', err);
      alert('Error deleting student record.');
    }
  };

  const filteredStudents = students.filter(s => 
    (s.fullName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.studentId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Students Management</h2>
          <p className="text-xs sm:text-sm text-gray-500">View and manage all registered student accounts</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-xs transition-colors text-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
        >
          + Add Student
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or Student ID..." 
            className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
          <span className="text-xs text-gray-500 font-medium text-right sm:text-left">
            Showing {filteredStudents.length} of {students.length} students
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Loading registered students...
            </div>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = async (event) => {
                    const base64 = event.target?.result as string;
                    try {
                      await fetch(`${API_BASE_URL}/api/users/${student._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ profilePicUrl: base64 })
                      });
                      fetchStudents();
                    } catch (err) {
                      console.error('Error updating photo:', err);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              };

              return (
                <div key={student._id || student.studentId} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <label className="relative group cursor-pointer block w-12 h-12 shrink-0" title="Click to change student photo">
                      {student.profilePicUrl ? (
                        <img 
                          src={student.profilePicUrl} 
                          alt={student.fullName || student.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-red-200 shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 font-bold flex items-center justify-center text-base border border-red-200">
                          {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                        Photo
                      </div>
                      <input type="file" accept="image/*" onChange={handleDirectPhotoUpload} className="hidden" />
                    </label>

                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-bold text-gray-900 text-sm truncate">{student.fullName || student.name}</p>
                        <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-100 shrink-0">
                          {student.studentId || 'N/A'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 break-all mt-0.5">{student.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Phone: {student.phone || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => setInspectStudent(student)}
                      className="py-2 px-2 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-xl text-xs transition-colors border border-green-200 text-center cursor-pointer"
                    >
                      Checklist
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(student)}
                      className="py-2 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl text-xs transition-colors border border-amber-200 text-center cursor-pointer"
                    >
                      Edit Profile
                    </button>
                    <button 
                      onClick={() => setChangeCourseStudent(student)}
                      className="py-2 px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-xl text-xs transition-colors border border-indigo-200 text-center cursor-pointer"
                    >
                      Change Course
                    </button>
                    <button 
                      onClick={() => handleDeleteStudent(student._id, student.fullName || student.name)}
                      className="py-2 px-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors border border-red-100 text-center cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              No student records found matching search query.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[650px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Photo</th>
                <th className="px-6 py-4 font-bold">Student ID</th>
                <th className="px-6 py-4 font-bold">Name</th>
                <th className="px-6 py-4 font-bold">Email</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    Loading registered students...
                  </td>
                </tr>
              ) : filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (event) => {
                        const base64 = event.target?.result as string;
                        try {
                          await fetch(`${API_BASE_URL}/api/users/${student._id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ profilePicUrl: base64 })
                          });
                          fetchStudents();
                        } catch (err) {
                          console.error('Error updating photo:', err);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  };

                  return (
                    <tr key={student._id || student.studentId} className="hover:bg-gray-50/80 transition-colors">
                      {/* Photo Column */}
                      <td className="px-6 py-4">
                        <label className="relative group cursor-pointer block w-10 h-10" title="Click to change student photo">
                          {student.profilePicUrl ? (
                            <img 
                              src={student.profilePicUrl} 
                              alt={student.fullName || student.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-red-200 shadow-xs"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 font-bold flex items-center justify-center text-sm border border-red-200">
                              {(student.fullName || student.name || 'S').charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                            Change
                          </div>
                          <input type="file" accept="image/*" onChange={handleDirectPhotoUpload} className="hidden" />
                        </label>
                      </td>

                      <td className="px-6 py-4 font-mono font-bold text-red-600">{student.studentId || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{student.fullName || student.name}</td>
                      <td className="px-6 py-4 text-gray-600">{student.email}</td>
                      <td className="px-6 py-4 text-gray-500">{student.phone || 'N/A'}</td>
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button 
                          onClick={() => setInspectStudent(student)}
                          className="px-3 py-1 bg-green-50 text-green-700 hover:bg-green-100 font-bold rounded-lg text-xs transition-colors border border-green-200 whitespace-nowrap cursor-pointer"
                        >
                          Checklist
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(student)}
                          className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs transition-colors border border-amber-200 whitespace-nowrap cursor-pointer"
                        >
                          Edit Profile & Photo
                        </button>
                        <button 
                          onClick={() => setChangeCourseStudent(student)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded-lg text-xs transition-colors border border-indigo-200 whitespace-nowrap cursor-pointer"
                        >
                          Change Course Name
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student._id, student.fullName || student.name)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-100 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>
                    No student records found matching search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Inspector Modal */}
      {inspectStudent && (
        <StudentDetailModal 
          student={inspectStudent}
          onClose={() => setInspectStudent(null)}
          onUpdate={fetchStudents}
        />
      )}

      {/* Change Course Modal */}
      {changeCourseStudent && (
        <ChangeCourseModal 
          userEmail={changeCourseStudent.email}
          userName={changeCourseStudent.fullName || changeCourseStudent.name}
          currentCourse={changeCourseStudent.courseName}
          onClose={() => setChangeCourseStudent(null)}
          onSuccess={() => {
            setChangeCourseStudent(null);
            fetchStudents();
          }}
        />
      )}

      {/* Edit Student Modal */}
      {editStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Student Details</h3>

            <form onSubmit={handleUpdateStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Update Student Photo (Displayed on PDF Report Card)</label>
                <div className="flex items-center gap-3">
                  {editFormData.profilePicUrl ? (
                    <img 
                      src={editFormData.profilePicUrl} 
                      alt="Student Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-red-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                      Photo
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, true)}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student ID *</label>
                <input 
                  type="text" 
                  required
                  value={editFormData.studentId}
                  onChange={(e) => setEditFormData({...editFormData, studentId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Course Name</label>
                <input 
                  type="text" 
                  value={editFormData.courseName}
                  onChange={(e) => setEditFormData({...editFormData, courseName: e.target.value})}
                  placeholder="e.g. Class 10 Science"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditStudent(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingStudent}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {updatingStudent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Student</h3>
            
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Student Photo (Optional - Displayed on PDF Report Card)</label>
                <div className="flex items-center gap-3">
                  {formData.profilePicUrl ? (
                    <img 
                      src={formData.profilePicUrl} 
                      alt="Student Preview" 
                      className="w-12 h-12 rounded-xl object-cover border border-red-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                      Photo
                    </div>
                  )}
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageFileChange(e, false)}
                    className="text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  placeholder="e.g. Alex Johnson"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="alex@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-4.243-4.243L3 3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Custom Student ID (Optional)</label>
                <input 
                  type="text" 
                  value={formData.studentId}
                  onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                  placeholder="Leave empty to auto-generate (YEDU-2026-XXXX)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 555-0199"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
