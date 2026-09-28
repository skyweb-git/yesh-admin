import { useState, useEffect } from 'react';
import { StudentDetailModal } from './StudentDetailModal';
import { UploadReportCardModal } from './UploadReportCardModal';
import { adminAuth } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { API_BASE_URL } from '../config/api';
import { X } from 'lucide-react';

const getLinkedStudentIds = (studentIdStr?: string): string[] => {
  if (!studentIdStr) return [];
  return String(studentIdStr)
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
};

const MultiStudentPicker = ({
  selectedIds,
  onChange,
  studentsList,
  studentsMap
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  studentsList: any[];
  studentsMap: Record<string, any>;
}) => {
  const [customIdInput, setCustomIdInput] = useState('');

  const handleAddCustom = () => {
    if (!customIdInput.trim()) return;
    const tokens = customIdInput.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
    const updated = Array.from(new Set([...selectedIds, ...tokens]));
    onChange(updated);
    setCustomIdInput('');
  };

  const handleSelectStudent = (val: string) => {
    if (!val) return;
    if (!selectedIds.includes(val)) {
      onChange([...selectedIds, val]);
    }
  };

  const handleRemoveId = (idToRemove: string) => {
    onChange(selectedIds.filter(id => id !== idToRemove));
  };

  return (
    <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          Linked Students ({selectedIds.length})
        </label>
        <span className="text-[11px] text-gray-500 font-medium">Multiple students supported</span>
      </div>

      {/* Selected Student Badges/Chips */}
      {selectedIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-200 rounded-xl max-h-36 overflow-y-auto">
          {selectedIds.map(id => {
            const studentObj = studentsMap[id];
            return (
              <span 
                key={id} 
                className="inline-flex items-center gap-1.5 bg-red-50 text-red-900 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs"
              >
                <span className="w-4 h-4 rounded-full bg-red-200 text-red-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                  {studentObj ? studentObj.fullName.charAt(0) : 'S'}
                </span>
                <span className="text-gray-900 text-xs font-bold">{studentObj ? studentObj.fullName : 'Student'}</span>
                <span className="font-mono text-[11px] text-red-600 bg-white px-1.5 py-0.5 rounded border border-red-100 font-bold">{id}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveId(id)}
                  className="text-gray-400 hover:text-red-700 p-0.5 rounded transition-colors cursor-pointer"
                  title="Remove student"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            );
          })}
        </div>
      ) : (
        <div className="p-3 bg-white border border-dashed border-gray-300 rounded-xl text-center text-xs text-gray-400">
          No students linked yet. Pick from the dropdown below or enter a Student ID.
        </div>
      )}

      {/* Select Registered Student Dropdown */}
      <div>
        <select
          onChange={(e) => {
            handleSelectStudent(e.target.value);
            e.target.value = '';
          }}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer"
        >
          <option value="">+ Select a registered student to link...</option>
          {studentsList
            .filter(st => st.studentId && !selectedIds.includes(st.studentId))
            .map(st => (
              <option key={st._id} value={st.studentId}>
                {st.fullName} — ID: {st.studentId}
              </option>
            ))}
        </select>
      </div>

      {/* Manual Input Field for Custom or Multiple IDs */}
      <div className="flex gap-2">
        <input
          type="text"
          value={customIdInput}
          onChange={(e) => setCustomIdInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          placeholder="Or type/paste Student ID (e.g. YEDU-2026-9140)..."
          className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono outline-none focus:border-red-500 text-gray-900"
        />
        <button
          type="button"
          onClick={handleAddCustom}
          className="px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
        >
          + Add ID
        </button>
      </div>
    </div>
  );
};

export const ParentsManagement = () => {
  const [parents, setParents] = useState<any[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [studentsMap, setStudentsMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectItem, setInspectItem] = useState<{ student?: any, parent?: any } | null>(null);
  const [uploadUser, setUploadUser] = useState<any | null>(null);

  // Link Student Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkTargetParent, setLinkTargetParent] = useState<any>(null);
  const [newStudentId, setNewStudentId] = useState('');
  const [linkSubmitting, setLinkSubmitting] = useState(false);
  const [linkError, setLinkError] = useState('');

  // Edit Parent Modal State
  const [editParent, setEditParent] = useState<any | null>(null);
  const [editParentFormData, setEditParentFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    studentId: ''
  });
  const [updatingParent, setUpdatingParent] = useState(false);

  // Add Parent Modal State
  const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
  const [showParentPassword, setShowParentPassword] = useState(false);
  const [parentFormData, setParentFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    studentId: ''
  });
  const [parentSubmitting, setParentSubmitting] = useState(false);
  const [addParentError, setAddParentError] = useState('');

  const fetchParentsAndStudents = async () => {
    setLoading(true);
    try {
      const [parentsRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users?role=parent`),
        fetch(`${API_BASE_URL}/api/users?role=student`)
      ]);

      const parentsData = await parentsRes.json();
      const studentsData = await studentsRes.json();

      setParents(Array.isArray(parentsData) ? parentsData : []);
      const stList = Array.isArray(studentsData) ? studentsData : [];
      setStudentsList(stList);

      const map: Record<string, any> = {};
      stList.forEach(student => {
        if (student.studentId) {
          map[student.studentId.trim()] = student;
        }
      });
      setStudentsMap(map);
    } catch (err) {
      console.error('Error fetching parents/students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParentsAndStudents();
  }, []);

  const handleOpenEditParent = (parent: any) => {
    setEditParent(parent);
    setEditParentFormData({
      fullName: parent.fullName || '',
      email: parent.email || '',
      phone: parent.phone || '',
      studentId: parent.studentId || ''
    });
  };

  const handleUpdateParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editParent) return;

    setUpdatingParent(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${editParent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editParentFormData.fullName.trim(),
          email: editParentFormData.email.trim(),
          phone: editParentFormData.phone.trim(),
          studentId: editParentFormData.studentId.trim()
        })
      });

      if (!res.ok) {
        throw new Error('Failed to update parent details');
      }

      await fetchParentsAndStudents();
      setEditParent(null);
    } catch (err: any) {
      console.error('Error updating parent:', err);
      alert(err.message || 'Failed to update parent record.');
    } finally {
      setUpdatingParent(false);
    }
  };

  const handleDeleteParent = async (id: string, email: string) => {
    if (!window.confirm(`Are you sure you want to delete parent account "${email}"?`)) {
      return;
    }

    try {
      if (id) {
        await fetch(`${API_BASE_URL}/api/users/${id}`, {
          method: 'DELETE'
        });
      }
      await fetchParentsAndStudents();
    } catch (err) {
      console.error('Failed to delete parent account:', err);
      alert('Error deleting parent account.');
    }
  };

  const handleLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTargetParent || !linkTargetParent.email) return;
    
    setLinkSubmitting(true);
    setLinkError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${encodeURIComponent(linkTargetParent.email)}?role=parent`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: newStudentId.trim() })
      });

      if (!res.ok) {
        throw new Error('Failed to update student link');
      }

      await fetchParentsAndStudents();
      setIsLinkModalOpen(false);
      setLinkTargetParent(null);
      setNewStudentId('');
    } catch (err: any) {
      console.error('Error linking student:', err);
      setLinkError(err.message || 'Error updating student link');
    } finally {
      setLinkSubmitting(false);
    }
  };

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFormData.fullName || !parentFormData.email || !parentFormData.password) return;

    setParentSubmitting(true);
    setAddParentError('');

    try {
      const trimmedEmail = parentFormData.email.trim();
      const userCredential = await createUserWithEmailAndPassword(
        adminAuth, 
        trimmedEmail, 
        parentFormData.password
      );
      
      const firebaseUid = userCredential.user.uid;
      await signOut(adminAuth);

      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: firebaseUid,
          fullName: parentFormData.fullName.trim(),
          email: trimmedEmail,
          role: 'parent',
          studentId: parentFormData.studentId.trim(),
          phone: parentFormData.phone.trim(),
          status: 'Active'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create parent in database');
      }

      await fetchParentsAndStudents();
      setIsAddParentModalOpen(false);
      setParentFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        studentId: ''
      });
    } catch (err: any) {
      console.error('Error adding parent:', err);
      if (err.code === 'auth/email-already-in-use') {
        setAddParentError('This email is already registered. Please use a different one or login.');
      } else if (err.code === 'auth/weak-password') {
        setAddParentError('Password should be at least 6 characters.');
      } else {
        setAddParentError(err.message || 'Error adding parent record');
      }
    } finally {
      setParentSubmitting(false);
    }
  };

  const filteredParents = parents.filter(p => {
    const sIds = getLinkedStudentIds(p.studentId);
    const studentNames = sIds.map(id => studentsMap[id]?.fullName || '').join(' ');
    const query = searchTerm.toLowerCase();
    return (
      (p.fullName || '').toLowerCase().includes(query) ||
      (p.email || '').toLowerCase().includes(query) ||
      (p.studentId || '').toLowerCase().includes(query) ||
      studentNames.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Parents Management</h2>
          <p className="text-xs sm:text-sm text-gray-500">View registered parent accounts and their linked student details</p>
        </div>
        <button 
          onClick={() => setIsAddParentModalOpen(true)}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-xs transition-colors text-sm text-center flex items-center justify-center gap-1.5 cursor-pointer"
        >
          + Add Parent
        </button>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by parent email, student name, or Student ID..." 
            className="w-full sm:w-80 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
          />
          <span className="text-xs text-gray-500 font-medium text-right sm:text-left">
            Total Parent Accounts: {parents.length}
          </span>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Loading parent accounts and linked student details...
            </div>
          ) : filteredParents.length > 0 ? (
            filteredParents.map((parent) => {
              const sIds = getLinkedStudentIds(parent.studentId);
              const firstStudent = sIds.length > 0 ? studentsMap[sIds[0]] : null;
              return (
                <div key={parent._id || parent.email} className="p-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{parent.fullName || 'Parent Account'}</p>
                      <p className="text-xs text-gray-500 break-all">{parent.email}</p>
                    </div>
                    {sIds.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[150px]">
                        {sIds.map(id => (
                          <span key={id} className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded text-[11px] border border-red-100">
                            {id}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic shrink-0">Not linked</span>
                    )}
                  </div>

                  <div className="bg-red-50/40 rounded-xl p-2.5 space-y-1.5 border border-red-100/50">
                    <div className="flex items-center justify-between text-xs text-gray-600 font-medium">
                      <span>Linked Students ({sIds.length}):</span>
                    </div>
                    {sIds.length === 0 ? (
                      <p className="text-gray-400 italic text-xs">No student linked</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {sIds.map(id => {
                          const stObj = studentsMap[id];
                          return (
                            <div key={id} className="flex items-center justify-between text-xs bg-white/90 p-1.5 rounded-lg border border-red-100">
                              <div className="flex items-center gap-1.5 font-bold text-gray-800">
                                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                  {stObj ? stObj.fullName.charAt(0) : 'S'}
                                </span>
                                <span className="truncate max-w-[150px]">{stObj ? stObj.fullName : 'Student'}</span>
                              </div>
                              <span className="font-mono font-bold text-red-600 text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-100 shrink-0">
                                {id}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-0.5">
                    <span>Phone: {parent.phone || 'N/A'}</span>
                    <span>Joined: {parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : 'Recent'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button 
                      onClick={() => handleOpenEditParent(parent)}
                      className="py-2 px-2 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl text-xs transition-colors border border-amber-200 text-center cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setLinkTargetParent(parent);
                        setNewStudentId(parent.studentId || '');
                        setIsLinkModalOpen(true);
                      }}
                      className="py-2 px-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors border border-red-200 text-center cursor-pointer"
                    >
                      {sIds.length > 0 ? 'Edit Links' : 'Link Student'}
                    </button>
                    <button 
                      onClick={() => setUploadUser(firstStudent || parent)}
                      className="py-2 px-2 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors border border-red-200 text-center cursor-pointer"
                    >
                      Upload Report
                    </button>
                    <button 
                      onClick={() => handleDeleteParent(parent._id, parent.email)}
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
              No registered parent accounts found.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[750px]">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-bold">Parent Email</th>
                <th className="px-6 py-4 font-bold">Parent Name</th>
                <th className="px-6 py-4 font-bold text-red-700 bg-red-50/50">Linked Students</th>
                <th className="px-6 py-4 font-bold">Student IDs</th>
                <th className="px-6 py-4 font-bold">Phone</th>
                <th className="px-6 py-4 font-bold">Joined Date</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    Loading parent accounts and linked student details...
                  </td>
                </tr>
              ) : filteredParents.length > 0 ? (
                filteredParents.map((parent) => {
                  const sIds = getLinkedStudentIds(parent.studentId);
                  const firstStudent = sIds.length > 0 ? studentsMap[sIds[0]] : null;
                  return (
                    <tr key={parent._id || parent.email} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{parent.email}</td>
                      <td className="px-6 py-4 text-gray-700">{parent.fullName || 'Parent Account'}</td>
                      
                      {/* Student Name Column */}
                      <td className="px-6 py-4 font-bold text-red-900 bg-red-50/20">
                        {sIds.length === 0 ? (
                          <span className="text-gray-400 font-normal italic text-xs">
                            No student linked
                          </span>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {sIds.map(id => {
                              const stObj = studentsMap[id];
                              return (
                                <div key={id} className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                    {stObj ? stObj.fullName.charAt(0) : 'S'}
                                  </span>
                                  <span className="text-xs font-bold text-gray-900">
                                    {stObj ? stObj.fullName : `Student (${id})`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      {/* Linked Student ID Column */}
                      <td className="px-6 py-4">
                        {sIds.length === 0 ? (
                          <span className="text-gray-400 text-xs italic">Not linked</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {sIds.map(id => (
                              <span key={id} className="font-mono font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg text-xs border border-red-100">
                                {id}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{parent.phone || 'N/A'}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {parent.createdAt ? new Date(parent.createdAt).toLocaleDateString() : 'Recent'}
                      </td>

                      {/* Actions Column */}
                      <td className="px-6 py-4 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenEditParent(parent)}
                          className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg text-xs transition-colors border border-amber-200 whitespace-nowrap cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setLinkTargetParent(parent);
                            setNewStudentId(parent.studentId || '');
                            setIsLinkModalOpen(true);
                          }}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-200 whitespace-nowrap cursor-pointer"
                        >
                          {parent.studentId ? 'Change Link' : 'Link Student'}
                        </button>
                        <button 
                          onClick={() => setUploadUser(firstStudent || parent)}
                          className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 font-bold rounded-lg text-xs transition-colors border border-red-200 whitespace-nowrap cursor-pointer"
                        >
                          Upload Report Card
                        </button>
                        <button 
                          onClick={() => handleDeleteParent(parent._id, parent.email)}
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
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={7}>
                    No registered parent accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspector Modal */}
      {inspectItem && (
        <StudentDetailModal 
          student={inspectItem.student}
          parent={inspectItem.parent}
          onClose={() => setInspectItem(null)}
        />
      )}

      {/* Upload Report Card Modal */}
      {uploadUser && (
        <UploadReportCardModal 
          userEmail={uploadUser.email}
          userName={uploadUser.fullName || uploadUser.name || uploadUser.email}
          onClose={() => setUploadUser(null)}
          onSuccess={() => {
            setUploadUser(null);
            fetchParentsAndStudents();
          }}
        />
      )}

      {/* Edit Parent Modal */}
      {editParent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Parent Details</h3>

            <form onSubmit={handleUpdateParent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Parent Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={editParentFormData.fullName}
                  onChange={(e) => setEditParentFormData({...editParentFormData, fullName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={editParentFormData.email}
                  onChange={(e) => setEditParentFormData({...editParentFormData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={editParentFormData.phone}
                  onChange={(e) => setEditParentFormData({...editParentFormData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <MultiStudentPicker 
                selectedIds={getLinkedStudentIds(editParentFormData.studentId)}
                onChange={(ids) => setEditParentFormData({...editParentFormData, studentId: ids.join(', ')})}
                studentsList={studentsList}
                studentsMap={studentsMap}
              />

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setEditParent(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updatingParent}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {updatingParent ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Student Modal */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Link Student Account</h3>
            <p className="text-sm text-gray-500 mb-4">
              Linking student to parent: <strong className="text-gray-900">{linkTargetParent?.fullName || linkTargetParent?.email}</strong>
            </p>
            
            {linkError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4">
                {linkError}
              </div>
            )}

            <form onSubmit={handleLinkStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Linked Student(s)</label>
                <MultiStudentPicker 
                  selectedIds={getLinkedStudentIds(newStudentId)}
                  onChange={(ids) => setNewStudentId(ids.join(', '))}
                  studentsList={studentsList}
                  studentsMap={studentsMap}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={linkSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {linkSubmitting ? 'Saving...' : 'Save Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {isAddParentModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Parent</h3>
            
            {addParentError && (
              <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl mb-4">
                {addParentError}
              </div>
            )}

            <form onSubmit={handleAddParent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required
                  value={parentFormData.fullName}
                  onChange={(e) => setParentFormData({...parentFormData, fullName: e.target.value})}
                  placeholder="e.g. Jane Doe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input 
                  type="email" 
                  required
                  value={parentFormData.email}
                  onChange={(e) => setParentFormData({...parentFormData, email: e.target.value})}
                  placeholder="jane@example.com"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <input 
                    type={showParentPassword ? "text" : "password"} 
                    required
                    value={parentFormData.password}
                    onChange={(e) => setParentFormData({...parentFormData, password: e.target.value})}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowParentPassword(!showParentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                    title={showParentPassword ? "Hide password" : "Show password"}
                  >
                    {showParentPassword ? (
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  value={parentFormData.phone}
                  onChange={(e) => setParentFormData({...parentFormData, phone: e.target.value})}
                  placeholder="+1 555-0199"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-500 text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Linked Student(s) (Optional)</label>
                <MultiStudentPicker 
                  selectedIds={getLinkedStudentIds(parentFormData.studentId)}
                  onChange={(ids) => setParentFormData({...parentFormData, studentId: ids.join(', ')})}
                  studentsList={studentsList}
                  studentsMap={studentsMap}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsAddParentModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={parentSubmitting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md disabled:opacity-50"
                >
                  {parentSubmitting ? 'Creating...' : 'Create Parent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
