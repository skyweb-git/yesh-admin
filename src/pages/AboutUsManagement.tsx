import { useState, useEffect } from 'react';
import { 
  Save, 
  Info, 
  Award, 
  Users, 
  CheckCircle, 
  BookOpen, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  Image as ImageIcon,
  Sparkles,
  Target,
  GraduationCap,
  Heart,
  Layout,
  Upload
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export const AboutUsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'story' | 'mission' | 'whyUs' | 'stats' | 'values'>('hero');

  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingStory, setUploadingStory] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');

  const [aboutData, setAboutData] = useState({
    // Hero Section
    heroTitle: 'About Yash Educational Institute',
    heroDescription: 'At Yash Educational Institute, we believe every student has the potential to achieve greatness. We are committed to providing quality education, expert guidance, and a nurturing environment that inspires confidence, curiosity, and character.',
    heroImage: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80',
    heroCtaText: 'Explore Our Programs',
    heroCtaLink: '/courses',

    // Story Section
    storyTitle: 'Our Story',
    storyP1: 'Founded with the vision of making quality education accessible and effective for all, Yash Educational Institute has grown into a trusted learning partner for thousands of students.',
    storyP2: 'From a small beginning, we have built a strong academic community driven by passion, dedication, and a student-first approach.',
    storyCtaText: 'Know More About Us',
    storyCtaLink: '/courses',
    storyImage: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
    storyBadgeTitle: 'Trusted by',
    storyBadgeText: 'Thousands of Students & Parents',

    // Mission & Vision Section
    missionVisionTitle: 'Our Mission & Vision',
    missionTitle: 'Our Mission',
    ourMission: 'Yash Educational Institute empowers every student to realize their potential by providing quality education, strong values, and the right guidance. We are committed to nurturing confident, skilled, and responsible individuals who contribute positively to society.',
    visionTitle: 'Our Vision',
    ourVision: 'To be a leading institute recognized for academic excellence, innovative teaching, and holistic development, preparing students to excel in a dynamic global world.',

    // Why Choose Us Section
    whyChooseUsTitle: 'Why Choose Us?',
    whyChooseUs: [
      { title: 'Expert Faculty', description: 'Experienced and dedicated teachers committed to student success.' },
      { title: 'Comprehensive Programs', description: 'Curriculum designed for every academic milestone.' },
      { title: 'Proven Results', description: 'High success rate with countless achievers and top performers.' },
      { title: 'Student-Centered Approach', description: 'Personal attention and mentorship for overall growth.' },
      { title: 'Safe & Supportive Environment', description: 'A positive atmosphere that encourages learning and confidence.' },
      { title: 'Future-Ready Learning', description: 'Building skills, critical thinking, and leadership for tomorrow.' }
    ],

    // Statistics Banner Section
    stats: {
      studentsEnrolled: '5,000+',
      studentsEnrolledLabel: 'Students Enrolled',
      expertFaculty: '50+',
      expertFacultyLabel: 'Expert Faculty',
      successRate: '98%',
      successRateLabel: 'Success Rate',
      coursesOffered: '120+',
      coursesOfferedLabel: 'Courses Offered'
    },

    // Values Section
    valuesTitle: 'Our Values',
    coreValues: [
      { title: 'Excellence', description: 'We strive for the highest standards in teaching and learning.' },
      { title: 'Integrity', description: 'Honesty, transparency, and strong moral values guide us.' },
      { title: 'Respect', description: 'We respect every individual and celebrate diversity.' },
      { title: 'Growth', description: 'We believe in continuous improvement and lifelong learning.' },
      { title: 'Commitment', description: 'We are dedicated to shaping bright futures with care and passion.' }
    ]
  });

  const fetchAboutData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/about`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setAboutData(prev => ({
            ...prev,
            heroTitle: data.heroTitle || data.title || prev.heroTitle,
            heroDescription: data.heroDescription || data.subtitle || prev.heroDescription,
            heroImage: data.heroImage || prev.heroImage,
            heroCtaText: data.heroCtaText ?? prev.heroCtaText,
            heroCtaLink: data.heroCtaLink ?? prev.heroCtaLink,

            storyTitle: data.storyTitle || prev.storyTitle,
            storyP1: data.storyP1 ?? prev.storyP1,
            storyP2: data.storyP2 ?? prev.storyP2,
            storyCtaText: data.storyCtaText ?? prev.storyCtaText,
            storyCtaLink: data.storyCtaLink ?? prev.storyCtaLink,
            storyImage: data.storyImage || prev.storyImage,
            storyBadgeTitle: data.storyBadgeTitle ?? prev.storyBadgeTitle,
            storyBadgeText: data.storyBadgeText ?? prev.storyBadgeText,

            missionVisionTitle: data.missionVisionTitle || prev.missionVisionTitle,
            missionTitle: data.missionTitle || prev.missionTitle,
            ourMission: data.ourMission || prev.ourMission,
            visionTitle: data.visionTitle || prev.visionTitle,
            ourVision: data.ourVision || prev.ourVision,

            whyChooseUsTitle: data.whyChooseUsTitle || prev.whyChooseUsTitle,
            whyChooseUs: Array.isArray(data.whyChooseUs) && data.whyChooseUs.length > 0 ? data.whyChooseUs : prev.whyChooseUs,

            stats: {
              studentsEnrolled: data.stats?.studentsEnrolled || prev.stats.studentsEnrolled,
              studentsEnrolledLabel: data.stats?.studentsEnrolledLabel || prev.stats.studentsEnrolledLabel,
              expertFaculty: data.stats?.expertFaculty || prev.stats.expertFaculty,
              expertFacultyLabel: data.stats?.expertFacultyLabel || prev.stats.expertFacultyLabel,
              successRate: data.stats?.successRate || prev.stats.successRate,
              successRateLabel: data.stats?.successRateLabel || prev.stats.successRateLabel,
              coursesOffered: data.stats?.coursesOffered || prev.stats.coursesOffered,
              coursesOfferedLabel: data.stats?.coursesOfferedLabel || prev.stats.coursesOfferedLabel
            },

            valuesTitle: data.valuesTitle || prev.valuesTitle,
            coreValues: Array.isArray(data.coreValues) && data.coreValues.length > 0 ? data.coreValues : prev.coreValues
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch About Us data:', err);
    } finally {
      setLoading(false);
    }

  };

  useEffect(() => {
    fetchAboutData();
  }, []);

  const handleSave = async (dataToSave?: typeof aboutData, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = { ...(dataToSave || aboutData) };
      delete (payload as any)._id;

      const res = await fetch(`${API_BASE_URL}/api/about`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSavedSuccess(true);
        setStatusNotice('Saved and published to /about!');
        setTimeout(() => {
          setSavedSuccess(false);
          setStatusNotice('');
        }, 4000);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Failed to update About Us section: ${errData.message || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error saving About Us content:', err);
      alert(`Error saving About Us content: ${err.message || 'Network error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetField: 'heroImage' | 'storyImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (targetField === 'heroImage') setUploadingHero(true);
    if (targetField === 'storyImage') setUploadingStory(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (!reader.result) {
        setUploadingHero(false);
        setUploadingStory(false);
        return;
      }
      const base64Data = reader.result as string;

      try {
        const res = await fetch(`${API_BASE_URL}/api/upload-image`, {

          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData: base64Data,
            fileName: file.name
          })
        });

        let finalUrl = base64Data;
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) finalUrl = data.imageUrl;
        }
        
        const updatedState = { ...aboutData, [targetField]: finalUrl };
        setAboutData(updatedState);

        // Auto save to database so the public /about page immediately gets the new image!
        await handleSave(updatedState);
      } catch (err) {
        console.warn('Image upload fallback to base64:', err);
        const updatedState = { ...aboutData, [targetField]: base64Data };
        setAboutData(updatedState);
        await handleSave(updatedState);
      } finally {
        setUploadingHero(false);
        setUploadingStory(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handlers for dynamic lists
  const handleAddWhyChooseUs = () => {
    setAboutData({
      ...aboutData,
      whyChooseUs: [
        ...aboutData.whyChooseUs,
        { title: 'New Feature', description: 'Description of feature or advantage.' }
      ]
    });
  };

  const handleRemoveWhyChooseUs = (index: number) => {
    const updated = [...aboutData.whyChooseUs];
    updated.splice(index, 1);
    setAboutData({ ...aboutData, whyChooseUs: updated });
  };

  const handleWhyChooseUsChange = (index: number, field: 'title' | 'description', val: string) => {
    const updated = [...aboutData.whyChooseUs];
    updated[index][field] = val;
    setAboutData({ ...aboutData, whyChooseUs: updated });
  };

  const handleAddCoreValue = () => {
    setAboutData({
      ...aboutData,
      coreValues: [
        ...aboutData.coreValues,
        { title: 'New Core Value', description: 'Description of the core value.' }
      ]
    });
  };

  const handleRemoveCoreValue = (index: number) => {
    const updated = [...aboutData.coreValues];
    updated.splice(index, 1);
    setAboutData({ ...aboutData, coreValues: updated });
  };

  const handleCoreValueChange = (index: number, field: 'title' | 'description', val: string) => {
    const updated = [...aboutData.coreValues];
    updated[index][field] = val;
    setAboutData({ ...aboutData, coreValues: updated });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Info className="w-7 h-7 text-red-600" /> About Us Page Content Manager
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Edit and customize all sections, text, images, statistics, and features on the public <strong>/about</strong> page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all border ${
              previewMode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <Eye className="w-4 h-4" /> {previewMode ? 'Edit Mode' : 'Live Preview'}
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Changes
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-bold animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600" /> {statusNotice || 'About Us page updated and published successfully!'}
        </div>
      )}

      {previewMode ? (
        /* Full Live Preview Mockup */
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-md space-y-12">
          <div className="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-500 flex items-center justify-between">
            <span>LIVE PREVIEW - http://localhost:5173/about</span>
            <span className="text-red-600 font-extrabold">Public View</span>
          </div>

          {/* Hero Section Preview */}
          <div className="grid lg:grid-cols-2 gap-8 items-center border-b pb-8">
            <div className="space-y-4">
              <h1 className="text-3xl font-black text-gray-900">{aboutData.heroTitle}</h1>
              <p className="text-sm text-gray-600">{aboutData.heroDescription}</p>
              {aboutData.heroCtaText && (
                <span className="inline-block px-5 py-2 bg-gray-900 text-white text-xs font-bold rounded-full">
                  {aboutData.heroCtaText} →
                </span>
              )}
            </div>
            {aboutData.heroImage && (
              <img 
                src={aboutData.heroImage} 
                alt="Hero" 
                className="w-full h-56 object-cover rounded-2xl shadow-sm" 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=800&auto=format&fit=crop&q=80';
                }}
              />
            )}
          </div>

          {/* Story Preview */}
          <div className="grid lg:grid-cols-2 gap-8 items-center border-b pb-8">
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">{aboutData.storyTitle}</h2>
              <p className="text-sm text-gray-600">{aboutData.storyP1}</p>
              <p className="text-sm text-gray-600">{aboutData.storyP2}</p>
            </div>
            {aboutData.storyImage && (
              <div className="relative">
                <img 
                  src={aboutData.storyImage} 
                  alt="Story" 
                  className="w-full h-52 object-cover rounded-2xl shadow-sm" 
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80';
                  }}
                />
                <div className="absolute bottom-3 left-3 bg-white/90 p-3 rounded-xl shadow border text-xs">
                  <p className="font-bold text-gray-900">{aboutData.storyBadgeTitle}</p>
                  <p className="text-gray-600">{aboutData.storyBadgeText}</p>
                </div>
              </div>
            )}
          </div>

          {/* Mission Vision Preview */}
          <div className="space-y-4 border-b pb-8">
            <h2 className="text-xl font-bold text-center text-gray-900">{aboutData.missionVisionTitle}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-5 bg-red-50/60 rounded-2xl border border-red-100">
                <h3 className="font-bold text-red-700">{aboutData.missionTitle}</h3>
                <p className="text-xs text-gray-600 mt-2">{aboutData.ourMission}</p>
              </div>
              <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100">
                <h3 className="font-bold text-blue-700">{aboutData.visionTitle}</h3>
                <p className="text-xs text-gray-600 mt-2">{aboutData.ourVision}</p>
              </div>
            </div>
          </div>

          {/* Why Choose Us Preview */}
          <div className="space-y-4 border-b pb-8">
            <h2 className="text-xl font-bold text-center text-gray-900">{aboutData.whyChooseUsTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {aboutData.whyChooseUs.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center space-y-1">
                  <h4 className="text-xs font-bold text-gray-900">{item.title}</h4>
                  <p className="text-[11px] text-gray-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Preview */}
          <div className="p-6 bg-[#0f172a] text-white rounded-2xl text-center border-b pb-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-black text-red-500">{aboutData.stats.studentsEnrolled}</p>
                <p className="text-xs font-bold text-gray-300">{aboutData.stats.studentsEnrolledLabel}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">{aboutData.stats.expertFaculty}</p>
                <p className="text-xs font-bold text-gray-300">{aboutData.stats.expertFacultyLabel}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">{aboutData.stats.successRate}</p>
                <p className="text-xs font-bold text-gray-300">{aboutData.stats.successRateLabel}</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">{aboutData.stats.coursesOffered}</p>
                <p className="text-xs font-bold text-gray-300">{aboutData.stats.coursesOfferedLabel}</p>
              </div>
            </div>
          </div>

          {/* Core Values Preview */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-gray-900">{aboutData.valuesTitle}</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
              {aboutData.coreValues.map((val, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900">{val.title}</h4>
                  <p className="text-[10px] text-gray-500 mt-1">{val.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Section Navigation & Tabbed Editor */
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'hero' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Layout className="w-4 h-4" /> 1. Hero Banner
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('story')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'story' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4" /> 2. Our Story
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('mission')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'mission' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Target className="w-4 h-4" /> 3. Mission & Vision
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('whyUs')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'whyUs' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-4 h-4" /> 4. Why Choose Us
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'stats' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> 5. Statistics
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('values')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                activeTab === 'values' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-4 h-4" /> 6. Our Values
            </button>
          </div>

          <form onSubmit={e => handleSave(undefined, e)} className="space-y-6">

            {/* TAB 1: HERO BANNER */}
            {activeTab === 'hero' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Layout className="w-5 h-5 text-red-600" /> Hero Section Settings
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure main top banner heading, subtitle, button, and image.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Hero Main Heading</label>
                    <input
                      type="text"
                      value={aboutData.heroTitle}
                      onChange={e => setAboutData({ ...aboutData, heroTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Hero Subtitle / Description</label>
                    <textarea
                      rows={3}
                      value={aboutData.heroDescription}
                      onChange={e => setAboutData({ ...aboutData, heroDescription: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm text-gray-700"
                    ></textarea>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">CTA Button Text</label>
                      <input
                        type="text"
                        value={aboutData.heroCtaText}
                        onChange={e => setAboutData({ ...aboutData, heroCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">CTA Button Link</label>
                      <input
                        type="text"
                        value={aboutData.heroCtaLink}
                        onChange={e => setAboutData({ ...aboutData, heroCtaLink: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900"
                      />
                    </div>
                  </div>

                  {/* HERO IMAGE UPLOAD & URL BOX */}
                  <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-900">
                        <ImageIcon className="w-4 h-4 text-red-600" /> Hero Section Image
                      </span>
                      {uploadingHero && <span className="text-red-600 text-xs font-bold animate-pulse">Uploading Image...</span>}
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Upload file button */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Option 1: Upload Image File from Computer</label>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-red-200 hover:border-red-500 bg-white hover:bg-red-50/40 p-3 rounded-xl cursor-pointer transition-all text-xs font-bold text-red-600 shadow-sm">
                          <Upload className="w-4 h-4" />
                          <span>{uploadingHero ? 'Uploading File...' : 'Choose Image File to Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            disabled={uploadingHero}
                            onChange={e => handleImageFileUpload(e, 'heroImage')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Paste URL */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Option 2: Paste Web Image URL</label>
                        <input
                          type="text"
                          value={aboutData.heroImage}
                          onChange={e => setAboutData({ ...aboutData, heroImage: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>

                    {aboutData.heroImage && (
                      <div className="mt-2 relative w-full sm:w-64 h-36 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white pattern-checkered">
                        <img src={aboutData.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAboutData({ ...aboutData, heroImage: '' })}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: OUR STORY */}
            {activeTab === 'story' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-red-600" /> Our Story Section Settings
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure story title, paragraphs, story image, badge, and CTA button.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Story Section Title</label>
                    <input
                      type="text"
                      value={aboutData.storyTitle}
                      onChange={e => setAboutData({ ...aboutData, storyTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Story Paragraph 1</label>
                    <textarea
                      rows={3}
                      value={aboutData.storyP1}
                      onChange={e => setAboutData({ ...aboutData, storyP1: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
                    ></textarea>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Story Paragraph 2</label>
                    <textarea
                      rows={3}
                      value={aboutData.storyP2}
                      onChange={e => setAboutData({ ...aboutData, storyP2: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700"
                    ></textarea>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">Story CTA Button Text</label>
                      <input
                        type="text"
                        value={aboutData.storyCtaText}
                        onChange={e => setAboutData({ ...aboutData, storyCtaText: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">Story CTA Link</label>
                      <input
                        type="text"
                        value={aboutData.storyCtaLink}
                        onChange={e => setAboutData({ ...aboutData, storyCtaLink: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">Floating Badge Header</label>
                      <input
                        type="text"
                        value={aboutData.storyBadgeTitle}
                        onChange={e => setAboutData({ ...aboutData, storyBadgeTitle: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 uppercase">Floating Badge Text</label>
                      <input
                        type="text"
                        value={aboutData.storyBadgeText}
                        onChange={e => setAboutData({ ...aboutData, storyBadgeText: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800"
                      />
                    </div>
                  </div>

                  {/* STORY IMAGE UPLOAD & URL BOX */}
                  <div className="space-y-3 p-4 bg-gray-50/70 border border-gray-200 rounded-2xl">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-gray-900">
                        <ImageIcon className="w-4 h-4 text-red-600" /> Story Section Image
                      </span>
                      {uploadingStory && <span className="text-red-600 text-xs font-bold animate-pulse">Uploading Image...</span>}
                    </label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Upload file button */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Option 1: Upload Image File from Computer</label>
                        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-red-200 hover:border-red-500 bg-white hover:bg-red-50/40 p-3 rounded-xl cursor-pointer transition-all text-xs font-bold text-red-600 shadow-sm">
                          <Upload className="w-4 h-4" />
                          <span>{uploadingStory ? 'Uploading File...' : 'Choose Image File to Upload'}</span>
                          <input 
                            type="file" 
                            accept="image/*"
                            disabled={uploadingStory}
                            onChange={e => handleImageFileUpload(e, 'storyImage')}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {/* Paste URL */}
                      <div>
                        <label className="text-[11px] font-bold text-gray-500 block mb-1">Option 2: Paste Web Image URL</label>
                        <input
                          type="text"
                          value={aboutData.storyImage}
                          onChange={e => setAboutData({ ...aboutData, storyImage: e.target.value })}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-red-500 outline-none"
                        />
                      </div>
                    </div>

                    {aboutData.storyImage && (
                      <div className="mt-2 relative w-full sm:w-64 h-36 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-white pattern-checkered">
                        <img src={aboutData.storyImage} alt="Story Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAboutData({ ...aboutData, storyImage: '' })}
                          className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 3: MISSION & VISION */}
            {activeTab === 'mission' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-600" /> Mission & Vision Settings
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Edit title, mission statement, and vision statement.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Section Main Heading</label>
                    <input
                      type="text"
                      value={aboutData.missionVisionTitle}
                      onChange={e => setAboutData({ ...aboutData, missionVisionTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 pt-2">
                    {/* Mission Card */}
                    <div className="p-5 bg-red-50/40 rounded-2xl border border-red-100 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-red-600 uppercase">Mission Card Title</label>
                        <input
                          type="text"
                          value={aboutData.missionTitle}
                          onChange={e => setAboutData({ ...aboutData, missionTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-sm font-bold text-gray-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-red-600 uppercase">Mission Description</label>
                        <textarea
                          rows={5}
                          value={aboutData.ourMission}
                          onChange={e => setAboutData({ ...aboutData, ourMission: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-red-200 rounded-lg text-xs text-gray-700"
                        ></textarea>
                      </div>
                    </div>

                    {/* Vision Card */}
                    <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-600 uppercase">Vision Card Title</label>
                        <input
                          type="text"
                          value={aboutData.visionTitle}
                          onChange={e => setAboutData({ ...aboutData, visionTitle: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-gray-900"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-blue-600 uppercase">Vision Description</label>
                        <textarea
                          rows={5}
                          value={aboutData.ourVision}
                          onChange={e => setAboutData({ ...aboutData, ourVision: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-xs text-gray-700"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: WHY CHOOSE US */}
            {activeTab === 'whyUs' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-red-600" /> Why Choose Us Features
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Add, edit, or remove key institute feature cards shown in grid.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWhyChooseUs}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition-all border border-red-200"
                  >
                    <Plus className="w-4 h-4" /> Add Feature Card
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Section Heading</label>
                    <input
                      type="text"
                      value={aboutData.whyChooseUsTitle}
                      onChange={e => setAboutData({ ...aboutData, whyChooseUsTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {aboutData.whyChooseUs.map((item, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveWhyChooseUs(idx)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove Feature"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Feature Title #{idx + 1}</label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={e => handleWhyChooseUsChange(idx, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Feature Description</label>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={e => handleWhyChooseUsChange(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 resize-none"
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: STATISTICS */}
            {activeTab === 'stats' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-red-600" /> Institute Statistics Banner
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure numbers and label titles displayed in the dark statistic banner.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Stat 1 */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 1 Value</label>
                      <input
                        type="text"
                        value={aboutData.stats.studentsEnrolled}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, studentsEnrolled: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 1 Label</label>
                      <input
                        type="text"
                        value={aboutData.stats.studentsEnrolledLabel}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, studentsEnrolledLabel: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Stat 2 */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 2 Value</label>
                      <input
                        type="text"
                        value={aboutData.stats.expertFaculty}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, expertFaculty: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 2 Label</label>
                      <input
                        type="text"
                        value={aboutData.stats.expertFacultyLabel}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, expertFacultyLabel: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Stat 3 */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 3 Value</label>
                      <input
                        type="text"
                        value={aboutData.stats.successRate}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, successRate: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 3 Label</label>
                      <input
                        type="text"
                        value={aboutData.stats.successRateLabel}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, successRateLabel: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                      />
                    </div>
                  </div>

                  {/* Stat 4 */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 4 Value</label>
                      <input
                        type="text"
                        value={aboutData.stats.coursesOffered}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, coursesOffered: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-extrabold text-red-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Stat 4 Label</label>
                      <input
                        type="text"
                        value={aboutData.stats.coursesOfferedLabel}
                        onChange={e => setAboutData({ ...aboutData, stats: { ...aboutData.stats, coursesOfferedLabel: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: CORE VALUES */}
            {activeTab === 'values' && (
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-600" /> Our Core Values
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Add, edit, or remove institute values and guiding principles.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCoreValue}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-xs rounded-xl transition-all border border-red-200"
                  >
                    <Plus className="w-4 h-4" /> Add Core Value
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 uppercase">Section Main Heading</label>
                    <input
                      type="text"
                      value={aboutData.valuesTitle}
                      onChange={e => setAboutData({ ...aboutData, valuesTitle: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {aboutData.coreValues.map((val, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 relative group">
                        <button
                          type="button"
                          onClick={() => handleRemoveCoreValue(idx)}
                          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove Value"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Core Value Title #{idx + 1}</label>
                          <input
                            type="text"
                            value={val.title}
                            onChange={e => handleCoreValueChange(idx, 'title', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-900"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-600">Core Value Description</label>
                          <textarea
                            rows={2}
                            value={val.description}
                            onChange={e => handleCoreValueChange(idx, 'description', e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 resize-none"
                          ></textarea>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Floating/Fixed Save Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="text-xs text-gray-500 font-medium">
                Changes will take effect immediately on the public website at <strong>/about</strong>.
              </div>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save All Changes
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};
