import { useState, useEffect, useCallback } from 'react';
import { Trash2, Edit, X, Settings2 } from 'lucide-react';
import { useBlocker } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

const DEFAULT_COURSE_STATE = {
  subject: '',
  title: '',
  instructor: 'Senior Faculty @ YashEdu',
  rating: 5,
  location: '',
  price: 0,
  students: '12.5k Enrolled',
  isTrending: true,
  image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  videoUrl: '',
  overview: '',
  whatYouWillLearn: '',
  target: '',
  duration: '32 Hours',
  materials: 'Notes & Practice Sets',
  certificate: 'Certified Track'
};

export const CoursesManagement = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  
  const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const [showManageSubjectsModal, setShowManageSubjectsModal] = useState(false);
  
  const [newCourse, setNewCourse] = useState(DEFAULT_COURSE_STATE);
  const [initialCourseState, setInitialCourseState] = useState(DEFAULT_COURSE_STATE);

  // Check if form is dirty
  const isFormDirty = showAddForm && JSON.stringify(newCourse) !== JSON.stringify(initialCourseState);

  // React Router Navigation Blocker
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isFormDirty && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmLeave = window.confirm("Changes have not been applied. Are you sure you want to continue?");
      if (confirmLeave) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Browser refresh/close blocker
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = "Changes have not been applied. Are you sure you want to continue?";
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const fetchCourses = () => {
    fetch(`${API_BASE_URL}/api/courses`)
      .then(res => res.json())
      .then(data => {
        setCourses(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching courses:', err);
        setLoading(false);
      });
  };

  const fetchSubjects = () => {
    fetch(`${API_BASE_URL}/api/subjects`)
      .then(res => res.json())
      .then(data => setSubjects(data))
      .catch(err => console.error('Error fetching subjects:', err));
  };

  useEffect(() => {
    fetchCourses();
    fetchSubjects();
  }, []);

  const handleSaveNewSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName.trim() })
      });
      if (res.ok) {
        const created = await res.json();
        setSubjects([...subjects, created]);
        setNewCourse({ ...newCourse, subject: created.name });
        setShowNewSubjectInput(false);
        setNewSubjectName('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    const hasCourses = courses.some(c => c.subject === subjectName);
    
    let confirmMessage = "Are you sure you want to delete this subject?";
    if (hasCourses) {
      confirmMessage = "This subject contains courses. Deleting it may affect the courses assigned to this subject. Are you sure you want to continue?";
    }

    if (!window.confirm(confirmMessage)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSubjects();
        // If the deleted subject was selected, clear it
        if (newCourse.subject === subjectName) {
          setNewCourse({ ...newCourse, subject: '' });
        }
      }
    } catch (err) {
      console.error("Error deleting subject:", err);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCourse({ ...newCourse, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.subject) {
      alert('Please select or add a Target Subject first.');
      return;
    }
    if (!newCourse.title.trim()) {
      alert('Please enter a Course Title.');
      return;
    }

    try {
      let courseImage = newCourse.image;

      // If image is a local base64 file string, upload to server disk
      if (courseImage && courseImage.startsWith('data:image/')) {
        try {
          const uploadRes = await fetch(`${API_BASE_URL}/api/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: courseImage,
              fileName: `${newCourse.title.replace(/[^a-zA-Z0-9]/g, '_')}_course.jpg`
            })
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            if (uploadData.imageUrl) courseImage = uploadData.imageUrl;
          }
        } catch (imgErr) {
          console.warn('Could not upload image to server, fallback to payload image');
        }
      }

      const payload = {
        ...newCourse,
        instructor: newCourse.instructor || 'YashEdu Instructor',
        students: newCourse.students || '100+ Students',
        rating: Number(newCourse.rating || 5),
        price: Number(newCourse.price || 0),
        image: courseImage
      };

      const url = editingCourseId 
        ? `${API_BASE_URL}/api/courses/${editingCourseId}` 
        : `${API_BASE_URL}/api/courses`;
      const method = editingCourseId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowAddForm(false);
        setEditingCourseId(null);
        setNewCourse(DEFAULT_COURSE_STATE);
        setInitialCourseState(DEFAULT_COURSE_STATE);
        fetchCourses();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to save course: ${errData.message || 'Server error'}`);
      }
    } catch (err: any) {
      console.error(err);
      alert(`Error creating course: ${err.message || 'Network error'}`);
    }
  };

  const handleEditClick = (course: any) => {
    if (isFormDirty) {
      if (!window.confirm("Changes have not been applied. Are you sure you want to continue?")) return;
    }
    
    setEditingCourseId(course._id);
    const courseToEdit = {
      subject: course.subject || '',
      title: course.title,
      instructor: course.instructor || 'Senior Faculty @ YashEdu',
      rating: course.rating || 5,
      location: course.location || course.duration || '',
      price: course.price || 0,
      students: course.students || '12.5k Enrolled',
      isTrending: course.isTrending || false,
      image: course.image,
      videoUrl: course.videoUrl || '',
      overview: course.overview || '',
      whatYouWillLearn: course.whatYouWillLearn || '',
      target: course.target || '',
      duration: course.duration || '32 Hours',
      materials: course.materials || 'Notes & Practice Sets',
      certificate: course.certificate || 'Certified Track'
    };
    
    setNewCourse(courseToEdit);
    setInitialCourseState(courseToEdit);
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleForm = () => {
    if (showAddForm) {
      if (isFormDirty) {
        if (!window.confirm("Changes have not been applied. Are you sure you want to continue?")) return;
      }
      setShowAddForm(false);
      setEditingCourseId(null);
      setNewCourse(DEFAULT_COURSE_STATE);
      setInitialCourseState(DEFAULT_COURSE_STATE);
      setShowNewSubjectInput(false);
    } else {
      setShowAddForm(true);
      setNewCourse(DEFAULT_COURSE_STATE);
      setInitialCourseState(DEFAULT_COURSE_STATE);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Courses Management</h2>
        <button 
          onClick={handleToggleForm}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {showAddForm ? 'Cancel' : 'Add Course'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddCourse} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col gap-1 mb-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-600 font-medium">Target Subject</label>
              <button 
                type="button" 
                onClick={() => setShowManageSubjectsModal(true)}
                className="text-xs text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
              >
                <Settings2 className="w-3 h-3" /> Manage Subjects
              </button>
            </div>
            
            {!showNewSubjectInput ? (
              <>
                <select
                  required
                  className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 bg-white w-full"
                  value={newCourse.subject}
                  onChange={e => {
                    if (e.target.value === 'ADD_NEW') {
                      setShowNewSubjectInput(true);
                    } else {
                      setNewCourse({ ...newCourse, subject: e.target.value });
                    }
                  }}
                >
                  <option value="" disabled>Select a Subject</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s.name}>{s.name}</option>
                  ))}
                  <option value="ADD_NEW" className="font-bold text-red-600">+ Add New Subject</option>
                </select>

                {/* Subject Delete Chips */}
                {subjects.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500 mr-1">Quick Delete Subject:</span>
                    {subjects.map(s => (
                      <span 
                        key={s._id} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-700 hover:text-red-700 text-xs font-semibold border border-gray-200 hover:border-red-200 transition-colors"
                      >
                        <span>{s.name}</span>
                        <button 
                          type="button"
                          onClick={() => handleDeleteSubject(s._id, s.name)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded-full hover:bg-red-100 transition-colors ml-0.5 cursor-pointer"
                          title={`Delete subject "${s.name}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Enter new subject name"
                  className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 flex-1"
                  value={newSubjectName}
                  onChange={e => setNewSubjectName(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSaveNewSubject}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewSubjectInput(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Course Title</label>
              <input required className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Course Location</label>
              <input required className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900" placeholder="e.g. uppal / Main Campus" value={newCourse.location} onChange={e => setNewCourse({...newCourse, location: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Course Image</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="border p-1.5 rounded-lg text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
              {newCourse.image && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={newCourse.image} alt="Preview" className="w-10 h-10 object-cover rounded" />
                  <span className="text-xs text-gray-500">Current image</span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">YouTube / Instagram Video URL (Optional)</label>
              <input 
                type="text" 
                className="border p-2 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 w-full" 
                placeholder="e.g. YouTube URL or Instagram Reel" 
                value={newCourse.videoUrl || ''} 
                onChange={e => setNewCourse({...newCourse, videoUrl: e.target.value})} 
              />
              <span className="text-xs text-gray-400">Plays video when students view course demo.</span>
            </div>
          </div>

          {/* Detailed Course Content Section */}
          <div className="border-t border-gray-200 pt-4 mt-2 space-y-4">
            <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Course Details & Content Options</h4>
            
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Course Overview Description</label>
              <textarea 
                rows={3} 
                className="border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm" 
                placeholder="Join this course at Yash Educational Institute. Our program provides conceptual clarity..." 
                value={newCourse.overview || ''} 
                onChange={e => setNewCourse({...newCourse, overview: e.target.value})} 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">What You Will Learn (Separate points with commas or newlines)</label>
              <textarea 
                rows={3} 
                className="border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm" 
                placeholder="Complete conceptual clarity, Personalized 1-on-1 doubt solving, Regular tests & practice sets..." 
                value={newCourse.whatYouWillLearn || ''} 
                onChange={e => setNewCourse({...newCourse, whatYouWillLearn: e.target.value})} 
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600 font-medium">Target & Learning Goals</label>
              <textarea 
                rows={3} 
                className="border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-red-500 text-gray-900 text-sm" 
                placeholder="Our primary target is to empower students with comprehensive conceptual clarity..." 
                value={newCourse.target || ''} 
                onChange={e => setNewCourse({...newCourse, target: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 font-medium">Instructor Name</label>
                <input 
                  type="text" 
                  className="border p-2 rounded-lg text-sm text-gray-900" 
                  placeholder="Senior Faculty @ YashEdu" 
                  value={newCourse.instructor || ''} 
                  onChange={e => setNewCourse({...newCourse, instructor: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 font-medium">Duration</label>
                <input 
                  type="text" 
                  className="border p-2 rounded-lg text-sm text-gray-900" 
                  placeholder="32 Hours" 
                  value={newCourse.duration || ''} 
                  onChange={e => setNewCourse({...newCourse, duration: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 font-medium">Materials</label>
                <input 
                  type="text" 
                  className="border p-2 rounded-lg text-sm text-gray-900" 
                  placeholder="Notes & Practice Sets" 
                  value={newCourse.materials || ''} 
                  onChange={e => setNewCourse({...newCourse, materials: e.target.value})} 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600 font-medium">Certificate</label>
                <input 
                  type="text" 
                  className="border p-2 rounded-lg text-sm text-gray-900" 
                  placeholder="Certified Track" 
                  value={newCourse.certificate || ''} 
                  onChange={e => setNewCourse({...newCourse, certificate: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={handleToggleForm} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Cancel
            </button>
            <button type="submit" className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors">
              {editingCourseId ? 'Save Changes' : 'Create Course'}
            </button>
          </div>
        </form>
      )}

      {/* Manage Subjects Modal */}
      {showManageSubjectsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg text-gray-900">Manage Subjects</h3>
              <button onClick={() => setShowManageSubjectsModal(false)} className="text-gray-500 hover:bg-gray-100 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {subjects.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No subjects found.</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {subjects.map(subject => (
                    <li key={subject._id} className="py-3 flex items-center justify-between">
                      <span className="font-medium text-gray-800">{subject.name}</span>
                      <button 
                        onClick={() => handleDeleteSubject(subject._id, subject.name)}
                        className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-red-100 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 font-medium text-gray-600">Course</th>
                <th className="px-6 py-4 font-medium text-gray-600">Subject</th>
                <th className="px-6 py-4 font-medium text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="p-6 text-center text-gray-500">Loading courses...</td></tr>
              ) : courses.length > 0 ? (
                courses.map(course => (
                  <tr key={course._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img src={course.image} alt="" style={{ width: '48px', height: '48px', minWidth: '48px' }} className="rounded-lg object-cover" />
                        <div>
                          <p className="font-medium text-gray-900">{course.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{course.location || course.duration}</p>
                          {course.videoUrl && (
                            <span className="text-[11px] text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-200 mt-1 inline-block">
                              ▶ YouTube Video Linked
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
                        {course.subject || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleEditClick(course)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg transition-colors" title="Edit Course">
                        <Edit className="w-5 h-5" />
                      </button>
                      <button onClick={() => handleDeleteCourse(course._id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Delete Course">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No courses found. Add one above!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
