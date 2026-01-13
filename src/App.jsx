import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  deleteDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  Users, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle,
  Menu,
  X,
  UserPlus,
  Lock,
  Unlock,
  LogOut,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  User,
  Pencil,
  RotateCcw,
  AlertTriangle,
  Cloud,
  CloudOff,
  Smartphone,
  Tablet,
  Check,
  Download
} from 'lucide-react';

// --- Configuration ---
const ENABLE_SHARED_DATA = true; 

// --- Firebase Configuration ---
let firebaseConfig;
try {
  if (typeof __firebase_config !== 'undefined') {
    firebaseConfig = JSON.parse(__firebase_config);
  } else {
    firebaseConfig = {
      apiKey: "AIzaSyAzuFU6enoi0CjhI40gF3ncjTisKWCUcl0",
      authDomain: "school-service-app-baf5e.firebaseapp.com",
      projectId: "school-service-app-baf5e",
      storageBucket: "school-service-app-baf5e.firebasestorage.app",
      messagingSenderId: "1088172496852",
      appId: "1:1088172496852:web:06f7102960dbe55a84a841",
      measurementId: "G-QF92J5LMWT"
    };
  }
} catch (error) {
  console.error("Error parsing firebase config:", error);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'school-record-system';
const APP_ID = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_'); 

// --- Constants ---
const ADMIN_PASSWORD = 'qwerTyuiop1234'; 
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];
const THAI_NUMBERS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

// --- Helpers ---
const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
const toThaiNumber = (num) => num.toString().replace(/[0-9]/g, (d) => THAI_NUMBERS[d]);

// *** Helper Function for Correct Collection Paths ***
const getCollectionRef = (collectionName, uid) => {
  if (ENABLE_SHARED_DATA) {
    // Public: artifacts/{appId}/public/data/{collectionName}
    return collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
  } else {
    // Private: artifacts/{appId}/users/{userId}/{collectionName}
    if (!uid) throw new Error("User ID required for private mode");
    return collection(db, 'artifacts', APP_ID, 'users', uid, collectionName);
  }
};

// --- Components ---

const LoadingOverlay = ({ message = "กำลังประมวลผล..." }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center rounded-xl animate-fade-in print:hidden">
    <Loader2 size={40} className="text-blue-600 animate-spin mb-3" />
    <span className="text-gray-600 font-medium animate-pulse">{message}</span>
  </div>
);

const Badge = ({ children, color = "blue", icon: Icon }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    purple: "bg-purple-100 text-purple-700 border-purple-200",
    green: "bg-green-100 text-green-700 border-green-200",
    red: "bg-red-100 text-red-700 border-red-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-semibold border whitespace-nowrap ${colorClasses[color] || colorClasses.gray}`}>
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
};

const LoginModal = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { onLogin(password); setPassword(''); setLoading(false); }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in print:hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Lock size={20} /> ผู้ดูแลระบบ</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 md:p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
               <ShieldCheck size={32} className="text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm text-center">กรุณากรอกรหัสผ่านเพื่อเข้าถึงส่วนจัดการ</p>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-4 pr-4 py-3 mb-6 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 focus:bg-white"
            placeholder="รหัสผ่าน"
            autoFocus
          />
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg transition-all font-medium flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
        signInAnonymously(auth).catch(err => console.error("Anonymous fallback failed", err));
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = (password) => {
    if (password === ADMIN_PASSWORD) { 
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setActiveTab('report'); 
    } else {
      alert('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('attendance'); 
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-sans">
        <Loader2 size={40} className="animate-spin text-blue-600 mb-4" />
        <p className="font-medium animate-pulse text-lg">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col lg:flex-row print:bg-white overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        body { font-family: 'Sarabun', sans-serif; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
        
        /* ==================== CLASSIC PRINT STYLES (Updated Margins) ==================== */
        @media print {
          /* Setup Pages */
          @page {
            size: A4 portrait;
            margin: 0;
          }
          @page landscape-page {
            size: A4 landscape;
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Hide UI elements explicitly */
          .print-hidden, nav, aside, button, header, .screen-only {
            display: none !important;
          }

          /* General hide logic */
          body > *:not(#print-root) { display: none !important; }
          #print-root { display: block !important; }

          /* Page 1: Portrait with Exact Margins */
          /* Top/Left: 3.81cm, Bottom/Right: 2.54cm */
          .print-page-portrait {
            page: auto;
            page-break-after: always;
            width: 210mm;
            min-height: 297mm;
            padding: 38.1mm 25.4mm 25.4mm 38.1mm;
            background: white;
            display: flex;
            flex-direction: column;
            overflow: hidden; 
            box-sizing: border-box;
          }

          /* Page 2: Landscape with Exact Margins */
          /* Top/Left: 3.81cm, Bottom/Right: 2.54cm */
          .print-page-landscape {
            page: landscape-page;
            page-break-before: always;
            width: 297mm;
            min-height: 210mm;
            padding: 38.1mm 25.4mm 25.4mm 38.1mm;
            background: white;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-sizing: border-box;
          }
        }
      `}</style>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-2xl bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex items-start gap-3 animate-fade-in print:hidden">
          <AlertTriangle size={24} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">เชื่อมต่อฐานข้อมูลไม่ได้ (Permission Denied)</p>
            <p className="text-xs md:text-sm mt-1">กรุณาตรวจสอบว่าได้ตั้งค่า Security Rules ใน Firebase หรือยัง</p>
            <button onClick={() => setPermissionError(false)} className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition">ปิดคำเตือน</button>
          </div>
        </div>
      )}

      {/* Mobile/Tablet Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow-lg z-50 print:hidden relative">
        <div className="flex items-center gap-3">
             <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><FileText size={18} /></div>
             <h1 className="font-bold text-base">Service Report</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/20 transition active:scale-95"><Menu size={24} /></button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl 
        transform transition-transform duration-300 ease-out border-r border-gray-100 
        lg:relative lg:translate-x-0 print:hidden flex flex-col 
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
            <div className="flex justify-between items-start lg:hidden mb-4">
                <div></div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>
            <div className="flex flex-col items-center p-6 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6">
                <div className={`p-4 rounded-full mb-3 shadow-sm ${isAdmin ? 'bg-white text-purple-600 ring-4 ring-purple-100' : 'bg-white text-blue-600 ring-4 ring-blue-100'}`}>
                    {isAdmin ? <Unlock size={32} /> : <User size={32} />}
                </div>
                <h2 className="text-lg font-bold text-gray-800 text-center">งานทะเบียนนักเรียน</h2>
                <div className="mt-2">{isAdmin ? <Badge color="purple" icon={ShieldCheck}>ผู้ดูแลระบบ</Badge> : <Badge color="blue" icon={User}>ผู้ใช้งานทั่วไป</Badge>}</div>
            </div>
            <nav className="space-y-2">
                <p className="px-4 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">เมนูหลัก</p>
                <NavButton active={activeTab === 'attendance'} onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }} icon={<Calendar size={20} />} label="บันทึกการให้บริการ" desc="Check-in รายวัน" />
                {isAdmin && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <p className="px-4 text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">ส่วนจัดการ (Admin)</p>
                        <NavButton active={activeTab === 'report'} onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); }} icon={<Printer size={20} />} label="พิมพ์รายงานสรุป" desc="แบบฟอร์มราชการ" isAdmin={true} />
                        <NavButton active={activeTab === 'students'} onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }} icon={<UserPlus size={20} />} label="จัดการรายชื่อ" desc="เพิ่ม/ลบ นักเรียน" isAdmin={true} />
                    </div>
                )}
            </nav>
        </div>
        <div className="mt-auto p-4 border-t bg-gray-50/50">
           {isAdmin ? (
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium border border-red-100"><LogOut size={18} /> ออกจากระบบ</button>
          ) : (
            <button onClick={() => setIsLoginModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 border border-gray-200"><Lock size={18} /> เข้าสู่ระบบ Admin</button>
          )}
          <div className="mt-4 text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
             v9.0 (Classic Restored) • {ENABLE_SHARED_DATA ? <Cloud size={10} className="text-blue-500" /> : <CloudOff size={10} />}
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden print:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Main Content */}
      <main className="flex-1 p-0 md:p-4 lg:p-8 overflow-y-auto h-[100dvh] lg:h-screen print:h-auto print:overflow-visible bg-slate-100/50 print:bg-white print:p-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:pb-0 print:max-w-none print:h-auto print:block">
          <div className={`flex-1 bg-white md:rounded-3xl shadow-sm border-x md:border border-slate-100 relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:border-none print:overflow-visible print:block`}>
            <div className="h-1 md:h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full absolute top-0 left-0 print:hidden z-10"></div>
            
            {activeTab === 'attendance' && <AttendanceView user={user} setPermissionError={setPermissionError} />}
            {activeTab === 'report' && isAdmin && <ReportView user={user} setPermissionError={setPermissionError} />}
            {activeTab === 'students' && isAdmin && <StudentManager user={user} setPermissionError={setPermissionError} />}
            
            {(activeTab === 'report' || activeTab === 'students') && !isAdmin && (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center print:hidden">
                  <div className="bg-gray-100 p-6 rounded-full mb-6"><Lock size={48} className="text-gray-400" /></div>
                  <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">จำกัดสิทธิ์การเข้าถึง 🔒</h3>
                  <button onClick={() => setIsLoginModalOpen(true)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg">เข้าสู่ระบบผู้ดูแล</button>
               </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const NavButton = ({ active, onClick, icon, label, desc, isAdmin }) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${active ? (isAdmin ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'hover:bg-gray-50 text-gray-600'}`}>
    {active && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>}
    <div className="flex items-center gap-4 relative z-10">
        <div className={`${active ? (isAdmin ? "text-purple-600" : "text-blue-600") : "text-gray-400 group-hover:text-gray-600"}`}>{icon}</div>
        <div className="text-left"><span className="block font-semibold text-sm">{label}</span>{desc && <span className="block text-[10px] opacity-70 font-light">{desc}</span>}</div>
    </div>
    {active && <ChevronRight size={16} className={`opacity-50 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />}
  </button>
);

// --- Responsive Student Manager ---
const StudentManager = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('ชาย');
  const [loading, setLoading] = useState(false); 
  const [dataLoading, setDataLoading] = useState(true); 
  const [editMode, setEditMode] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(getCollectionRef('students', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(data);
        setDataLoading(false);
      }, (error) => {
        if (error.code === 'permission-denied') setPermissionError(true);
        setDataLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error(err);
      setDataLoading(false);
    }
  }, [user]);

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      if (editMode && currentStudentId) {
         await updateDoc(doc(getCollectionRef('students', user.uid), currentStudentId), { name: newName.trim(), gender: newGender });
      } else {
         await setDoc(doc(getCollectionRef('students', user.uid)), {
            name: newName.trim(),
            gender: newGender,
            createdAt: new Date().toISOString()
         });
      }
      setNewName(''); setNewGender('ชาย'); setEditMode(false); setCurrentStudentId(null);
    } catch (error) {
      if (error.code === 'permission-denied') setPermissionError(true);
      else alert('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
    }
    setLoading(false);
  };

  const handleEditClick = (student) => { setNewName(student.name); setNewGender(student.gender); setEditMode(true); setCurrentStudentId(student.id); };
  const handleDeleteStudent = async (id) => {
    if (!window.confirm('ยืนยันการลบรายชื่อนักเรียน?')) return;
    setLoading(true); 
    try {
      await deleteDoc(doc(getCollectionRef('students', user.uid), id));
      if (editMode && currentStudentId === id) { setNewName(''); setEditMode(false); }
    } catch (error) {
      if (error.code === 'permission-denied') setPermissionError(true);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {loading && <LoadingOverlay message={editMode ? "กำลังบันทึก..." : "กำลังเพิ่ม..."} />}
      <div className="p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 print:hidden">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><UserPlus size={20} /></div>
          จัดการรายชื่อ
        </h2>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar flex-1 pb-20 lg:pb-8 print:hidden">
        {/* Form */}
        <div className="lg:col-span-1 order-1">
            <div className={`bg-white p-5 rounded-2xl border shadow-sm lg:sticky lg:top-2 transition-all duration-300 ${editMode ? 'border-yellow-200 ring-2 ring-yellow-100' : 'border-gray-100'}`}>
                <h3 className={`font-bold text-gray-800 mb-4 flex items-center gap-2 ${editMode ? 'text-yellow-600' : ''}`}>
                    {editMode ? <Pencil size={18} /> : <Plus size={18} className="text-green-500" />} 
                    {editMode ? 'แก้ไขข้อมูล' : 'เพิ่มรายชื่อใหม่'}
                </h3>
                <form onSubmit={handleSaveStudent} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">ชื่อ-นามสกุล</label>
                        <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="ระบุชื่อ..." className={`w-full p-3 border rounded-xl outline-none bg-gray-50 focus:bg-white text-sm ${editMode ? 'border-yellow-200 focus:ring-2 focus:ring-yellow-500' : 'border-gray-200 focus:ring-2 focus:ring-purple-500'}`} required />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">เพศ</label>
                        <div className="grid grid-cols-2 gap-3">
                            {['ชาย', 'หญิง'].map(g => (
                                <button key={g} type="button" onClick={() => setNewGender(g)} className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-sm ${newGender === g ? (g==='ชาย'?'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-300':'bg-pink-50 border-pink-200 text-pink-700 ring-1 ring-pink-300') : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}>
                                    {g === 'ชาย' ? '👦 ชาย' : '👧 หญิง'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={`w-full text-white py-3 rounded-xl hover:shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 font-medium text-sm ${editMode ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}>
                        {editMode ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
                    </button>
                    {editMode && <button type="button" onClick={() => {setNewName(''); setEditMode(false);}} className="w-full py-2 text-gray-500 text-xs flex justify-center items-center gap-1"><RotateCcw size={12} /> ยกเลิก</button>}
                </form>
            </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 order-2">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
            <div className="bg-gray-50/80 backdrop-blur px-5 py-3 border-b flex justify-between items-center sticky top-0 z-10">
              <span className="font-bold text-gray-700 flex items-center gap-2 text-sm"><Users size={16} className="text-gray-400" /> รายชื่อทั้งหมด <Badge color="gray">{students.length}</Badge></span>
            </div>
            <div className="divide-y divide-gray-50">
                {dataLoading ? <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-purple-500" /></div> : students.length === 0 ? <div className="p-10 text-center text-gray-400 text-sm"><Users size={32} className="mx-auto mb-2 opacity-30" />ยังไม่มีข้อมูล</div> : 
                students.map((student, index) => (
                    <div key={student.id} className={`px-4 py-3 flex items-center justify-between hover:bg-purple-50 transition-colors ${currentStudentId === student.id ? 'bg-yellow-50' : ''}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 w-6 font-mono text-xs bg-gray-50 rounded px-1 text-center">{index + 1}</span>
                            <div>
                                <p className="font-semibold text-gray-800 text-sm">{student.name}</p>
                                <div className="flex mt-0.5">{student.gender === 'ชาย' ? <Badge color="blue">ชาย</Badge> : <Badge color="pink">หญิง</Badge>}</div>
                            </div>
                        </div>
                        <div className="flex gap-1">
                             <button onClick={() => handleEditClick(student)} className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg"><Pencil size={16} /></button>
                             <button onClick={() => handleDeleteStudent(student.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Responsive Attendance View ---
const AttendanceView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [focusedDay, setFocusedDay] = useState(new Date().getDate()); // For Mobile View
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(getCollectionRef('students', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(data);
      }, (error) => { if (error.code === 'permission-denied') setPermissionError(true); });
      return () => unsubscribe();
    } catch(err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const docId = `attendance_${selectedYear}_${selectedMonth}`;
    try {
        const unsubscribe = onSnapshot(doc(getCollectionRef('attendance', user.uid), docId), (docSnap) => {
            setAttendanceData(docSnap.exists() ? docSnap.data() : {});
            setDataLoading(false);
        }, (error) => { if (error.code === 'permission-denied') setPermissionError(true); setDataLoading(false); });
        return () => unsubscribe();
    } catch(err) { setDataLoading(false); }
  }, [user, selectedMonth, selectedYear]);

  const toggleAttendance = async (studentId, day) => {
    const currentData = attendanceData[studentId] || {};
    const updatedStudentData = { ...currentData, [day]: !currentData[day] };
    const docId = `attendance_${selectedYear}_${selectedMonth}`;
    try {
      await setDoc(doc(getCollectionRef('attendance', user.uid), docId), { [studentId]: updatedStudentData }, { merge: true });
    } catch (e) { if (e.code === 'permission-denied') setPermissionError(true); }
  };

  const handleDayChange = (increment) => {
    let newDay = focusedDay + increment;
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    if (newDay < 1) newDay = 1;
    if (newDay > maxDays) newDay = maxDays;
    setFocusedDay(newDay);
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Daily Stats for Mobile
  const dailyStats = useMemo(() => {
    let present = 0;
    students.forEach(s => {
      if (attendanceData[s.id]?.[focusedDay]) present++;
    });
    return { present, absent: students.length - present };
  }, [students, attendanceData, focusedDay]);

  return (
    <div className="h-full flex flex-col relative">
      {dataLoading && <LoadingOverlay message="โหลดข้อมูล..." />}
      
      {/* Header (Shared) */}
      <div className="p-4 md:p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-30 print:hidden">
        <div>
           <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-start gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600 mt-0.5"><Calendar size={18} /></div>
            <span className="leading-snug text-base md:text-lg">บันทึกการให้บริการ (รายวัน)</span>
          </h2>
          <div className="flex items-center gap-2 mt-1 ml-9">
            <span className="text-xs text-gray-500 lg:inline hidden">คลิกช่องเพื่อเช็คชื่อ</span>
            <span className="text-xs text-gray-500 lg:hidden inline">เลือกวันที่แล้วกดปุ่มด้านขวา</span>
            <div className="w-[1px] h-3 bg-gray-300"></div>
             {ENABLE_SHARED_DATA ? <Badge color="blue" icon={Cloud}>Shared</Badge> : <Badge color="gray" icon={CloudOff}>Private</Badge>}
          </div>
        </div>
        
        <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 self-end lg:self-auto text-sm">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 bg-transparent outline-none font-medium text-gray-700 max-w-[100px]">{MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <div className="w-[1px] bg-gray-200 my-1"></div>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 bg-transparent outline-none font-medium text-gray-700"><option value={selectedYear - 1}>{selectedYear - 1 + 543}</option><option value={selectedYear}>{selectedYear + 543}</option><option value={selectedYear + 1}>{selectedYear + 1 + 543}</option></select>
        </div>
      </div>

      {/* --- Mobile View (Daily Card List) --- */}
      <div className="lg:hidden flex-1 overflow-y-auto bg-slate-50/50 p-4 pb-20 custom-scrollbar print:hidden">
         {/* Date Navigator */}
         <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm border border-slate-200 mb-4 sticky top-0 z-20">
            <button onClick={() => handleDayChange(-1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 active:scale-95 transition-transform" disabled={focusedDay <= 1}><ChevronLeft /></button>
            <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 font-medium">เลือกวันที่ต้องการเช็คชื่อ</span>
                <span className="font-bold text-blue-700 text-lg">วันที่ {focusedDay}</span>
            </div>
            <button onClick={() => handleDayChange(1)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-500 active:scale-95 transition-transform" disabled={focusedDay >= daysInMonth}><ChevronRight /></button>
         </div>

         {/* Summary Cards */}
         <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex flex-col items-center">
                <span className="text-2xl font-bold text-green-600">{dailyStats.present}</span>
                <span className="text-xs text-green-700 font-medium">มาใช้บริการ</span>
            </div>
            <div className="bg-white border border-slate-100 p-3 rounded-xl flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-400">{dailyStats.absent}</span>
                <span className="text-xs text-slate-500 font-medium">ไม่ได้มา</span>
            </div>
         </div>

         {/* Student List Cards */}
         <div className="space-y-3">
            {students.length === 0 ? (
                <div className="text-center p-8 text-slate-400">
                    <Users size={40} className="mx-auto mb-2 opacity-30"/>
                    <p>ยังไม่มีรายชื่อนักเรียน</p>
                </div>
            ) : (
                students.map((student) => {
                    const isPresent = attendanceData[student.id]?.[focusedDay];
                    return (
                        <div key={student.id} 
                             onClick={() => toggleAttendance(student.id, focusedDay)}
                             className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${isPresent ? 'bg-white border-green-200 ring-2 ring-green-100' : 'bg-white border-slate-100'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${student.gender === 'ชาย' ? 'bg-blue-100 text-blue-500' : 'bg-pink-100 text-pink-500'}`}>
                                    {student.gender === 'ชาย' ? '👦' : '👧'}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-700">{student.name}</div>
                                    <div className="text-xs text-slate-400">{student.gender}</div>
                                </div>
                            </div>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPresent ? 'bg-green-500 text-white shadow-green-200 shadow-md' : 'bg-slate-100 text-slate-300'}`}>
                                {isPresent ? <Check size={24} strokeWidth={3} /> : <div className="w-3 h-3 bg-slate-300 rounded-full"></div>}
                            </div>
                        </div>
                    );
                })
            )}
         </div>
         
         <div className="h-10"></div> {/* Spacer */}
      </div>

      {/* --- Desktop View (Full Table) --- */}
      <div className="hidden lg:flex flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-auto custom-scrollbar pb-20 lg:pb-0">
          <table className="min-w-max w-full text-sm border-collapse">
            <thead className="bg-gray-50 text-gray-600 sticky top-0 z-20 shadow-sm font-semibold">
              <tr>
                <th className="p-2 md:p-3 text-center border-b border-r w-10 md:w-12 sticky left-0 bg-gray-50 z-30 text-[10px] md:text-xs uppercase">#</th>
                <th className="p-2 md:p-3 text-left border-b border-r min-w-[120px] md:min-w-[220px] sticky left-10 md:left-12 bg-gray-50 z-30 text-[10px] md:text-xs uppercase">ชื่อ-นามสกุล</th>
                {daysArray.map(day => <th key={day} className={`p-1 w-8 md:w-10 text-center border-b border-r font-medium text-[10px] md:text-xs ${day === focusedDay ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>{day}</th>)}
                <th className="p-2 text-center min-w-[50px] md:min-w-[80px] bg-blue-50 text-blue-700 border-b sticky right-0 z-20 text-[10px] md:text-xs">รวม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student, idx) => {
                const studentRecord = attendanceData[student.id] || {};
                const totalPresent = daysArray.reduce((acc, day) => acc + (studentRecord[day] ? 1 : 0), 0);
                return (
                  <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-2 md:p-3 text-center border-r text-gray-400 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 font-mono text-xs">{idx + 1}</td>
                    <td className="p-2 md:p-3 text-left border-r font-medium text-gray-700 sticky left-10 md:left-12 bg-white group-hover:bg-blue-50/30 z-10 truncate max-w-[120px] md:max-w-[220px] border-b-0 text-xs md:text-sm">
                        <div className="flex items-center gap-2">
                           <div className={`w-1 h-6 md:h-8 rounded-full shrink-0 ${student.gender === 'ชาย' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                           <span className="truncate">{student.name}</span>
                        </div>
                    </td>
                    {daysArray.map(day => (
                      <td key={day} className={`p-0 border-r border-gray-100 text-center cursor-pointer relative select-none ${day === focusedDay ? 'bg-blue-50/30' : ''}`} onClick={() => toggleAttendance(student.id, day)}>
                        <div className={`w-full h-10 md:h-12 flex items-center justify-center ${studentRecord[day] ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                           {studentRecord[day] ? <CheckCircle size={16} className="text-green-500 fill-green-100" /> : <div className="w-1 h-1 rounded-full bg-gray-200"></div>}
                        </div>
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/50 sticky right-0 border-l border-blue-100 z-10 text-xs md:text-sm">{totalPresent}</td>
                  </tr>
                );
              })}
              {students.length === 0 && !dataLoading && <tr><td colSpan={daysArray.length + 3} className="p-10 text-center text-gray-400"><Users size={32} className="mx-auto opacity-20 mb-2"/>ไม่มีข้อมูล</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Report View ---
const ReportView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(getCollectionRef('students', user.uid));
      const unsubStudents = onSnapshot(q, 
        (s) => setStudents(s.docs.map(d => ({id:d.id, ...d.data()}))), 
        (e) => {if(e.code==='permission-denied')setPermissionError(true)}
      );
      const unsubAtt = onSnapshot(
        doc(getCollectionRef('attendance', user.uid), `attendance_${selectedYear}_${selectedMonth}`), 
        (s) => {setAttendanceData(s.exists()?s.data():{}); setLoading(false)}, 
        (e) => {setLoading(false)}
      );
      return () => { unsubStudents(); unsubAtt(); };
    } catch(err) { setLoading(false); }
  }, [user, selectedMonth, selectedYear]);

  const reportData = useMemo(() => {
    const data = students.map((s, i) => {
      const rec = attendanceData[s.id] || {};
      const count = Array.from({length: getDaysInMonth(selectedMonth, selectedYear)}, (_,k)=>k+1)
        .reduce((a,d) => a + (rec[d]?1:0), 0);
      return { ...s, no: i+1, count };
    });
    return { data, totalVisits: data.reduce((s, i) => s + i.count, 0) };
  }, [students, attendanceData, selectedMonth, selectedYear]);

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // --- NEW HANDLE PRINT FUNCTION ---
  // ใช้ window.open เพื่อสร้างหน้าต่างใหม่สำหรับการพิมพ์โดยเฉพาะ (Isolation Mode)
  // วิธีนี้แก้ปัญหา CSS ตีกัน และการจัดหน้า A4 ได้ดีที่สุด
  const handlePrint = () => {
    const printContent = document.getElementById('print-root').innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>พิมพ์รายงาน - ${MONTHS_TH[selectedMonth]} ${selectedYear + 543}</title>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
          
          body { 
            font-family: 'Sarabun', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: white;
            color: black;
          }
          
          /* Define A4 Portrait Page with Specific Margins */
          .print-page-portrait {
            width: 210mm;
            min-height: 297mm;
            padding: 38.1mm 25.4mm 25.4mm 38.1mm; /* Top Right Bottom Left */
            margin: 0 auto;
            page-break-after: always;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          
          /* Define A4 Landscape Page with Specific Margins */
          .print-page-landscape {
            width: 297mm;
            min-height: 210mm;
            padding: 38.1mm 25.4mm 25.4mm 38.1mm; /* Top Right Bottom Left */
            margin: 0 auto;
            page-break-before: always;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          
          /* Specific Print CSS Rule */
          @media print {
            @page {
              size: A4 portrait;
              margin: 0;
            }
            
            /* CSS rule to rotate the second page to landscape */
            @page landscape-page {
              size: A4 landscape;
              margin: 0;
            }
            
            .print-page-landscape {
              page: landscape-page;
              width: 297mm;
              height: 210mm;
            }
            
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
          
          /* Common Styles */
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14pt;
            margin-bottom: 20px;
          }
          
          th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
          }
          
          td.text-left { text-align: left; padding-left: 8px; }
          
          /* Font Sizes for Header */
          h1 { font-size: 18pt; margin: 0 0 10px 0; font-weight: bold; line-height: 1.2; }
          p { font-size: 16pt; margin: 0 0 20px 0; font-weight: bold; }
          
          .print-header { text-align: center; margin-bottom: 20px; }
          .print-footer { text-align: center; font-size: 12pt; color: #666; margin-top: auto; padding-top: 10px; }
          
          /* Grid for Signatures */
          .grid { display: grid; }
          .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
          .gap-4 { gap: 1rem; }
          .gap-y-6 { row-gap: 1.5rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mb-4 { margin-bottom: 1rem; }
          .text-xs { font-size: 14pt; } /* Signature text size */
          .text-center { text-align: center; }
          .flex { display: flex; }
          .flex-col { flex-direction: column; }
          .justify-end { justify-content: flex-end; }
          .mb-1 { margin-bottom: 0.25rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mt-4 { margin-top: 1rem; }
          .mt-8 { margin-top: 2rem; }
          .col-span-3 { grid-column: span 3 / span 3; }
          .justify-center { justify-content: center; }
          .gap-16 { gap: 4rem; }
          .mt-2 { margin-top: 0.5rem; }
          
          /* Hide helper elements */
          .print-hidden { display: none; }
          
          /* Empty Cells styling */
          td:empty { height: 30px; }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="h-full flex flex-col relative bg-slate-200/50 print:bg-white print-hidden">
      {loading && <LoadingOverlay />}
      <div className="p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><div className="p-2 bg-purple-100 rounded-lg text-purple-600"><FileText size={20} /></div> สรุปรายงาน</h2>
          <p className="text-gray-500 text-xs ml-10 hidden md:block">ใช้คอมพิวเตอร์เพื่อสั่งพิมพ์ (A4)</p>
        </div>
        <div className="flex gap-2 text-sm">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 bg-white rounded-lg border shadow-sm outline-none">{MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 bg-white rounded-lg border shadow-sm outline-none"><option value={selectedYear}>{selectedYear + 543}</option></select>
          
          {/* Updated Print Button with New Function */}
          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-md font-medium"
          >
            <Printer size={16} /> <span className="hidden md:inline">พิมพ์ (แบบใหม่)</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 print:p-0 flex justify-center items-start custom-scrollbar" style={{ display: 'none' }} id="print-root">
         
         <div className="flex flex-col gap-0 origin-top">
            {/* Page 1 Portrait */}
            <div className="print-page-portrait relative text-black bg-white">
                <div className="print-header">
                    <div className="text-center mb-4">
                        <h1>สรุปรายงานผลการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกาย<br/>หรือการเคลื่อนไหวหรือสุขภาพ</h1>
                        <p>ประจำเดือน {MONTHS_TH[selectedMonth]} พ.ศ. {toThaiNumber(selectedYear + 543)}</p>
                    </div>
                </div>
                
                <table className="w-full border-collapse border border-black mb-1 text-sm"> 
                    <thead><tr className="bg-gray-200"><th className="border border-black p-2 w-12">ที่</th><th className="border border-black p-2">ชื่อ-นามสกุล</th><th className="border border-black p-2 w-40">จำนวนครั้ง (ครั้ง)</th></tr></thead>
                    <tbody>
                        {reportData.data.slice(0, 12).map((item, index) => (<tr key={item.id}><td className="border border-black p-1.5 text-center">{toThaiNumber(index + 1)}</td><td className="border border-black p-1.5 pl-4 text-left">{item.name}</td><td className="border border-black p-1.5 text-center">{item.count>0?item.count:'-'}</td></tr>))}
                        {/* Filler rows */}
                        {Array.from({length: Math.max(0, 12 - reportData.data.length)}).map((_, i) => <tr key={`e-${i}`}><td className="border border-black h-8"></td><td className="border border-black"></td><td className="border border-black"></td></tr>)}
                        <tr className="bg-gray-100 font-bold"><td className="border border-black p-2 text-center" colSpan="2">รวม</td><td className="border border-black p-2 text-center">{reportData.totalVisits}</td></tr>
                    </tbody>
                </table>
                
                {/* Signatures */}
                <div className="print-signatures grid grid-cols-3 gap-y-6 gap-x-2 text-[10px] mt-1 mb-4">
                    <div className="text-center flex flex-col justify-end"><div className="mt-4 mb-2">ลงชื่อ ........................................ ผู้รายงาน</div><div className="mb-1">(นางสาวจุฬาลักษณ์ จุฬารมย์)</div><div>หัวหน้าห้องกายภาพบำบัด</div></div>
                    <div className="text-center flex flex-col justify-end"><div className="mt-4 mb-2">ลงชื่อ ........................................ ผู้รายงาน</div><div className="mb-1">(นายฐกฤต มิ่งขวัญ)</div><div>ครูผู้สอน</div></div>
                    <div className="text-center flex flex-col justify-end"><div className="mt-4 mb-2">ลงชื่อ ........................................ ผู้รายงาน</div><div className="mb-1">(นายพโนมล ชมโฉม)</div><div>ครูผู้สอน</div></div>

                    <div className="text-center flex flex-col justify-end"><div className="mt-8 mb-2">ลงชื่อ ........................................ ผู้รายงาน</div><div className="mb-1">(นายฐิติกานต์ พรมโสภา)</div><div>หัวหน้าห้องบุคคลที่มีความบกพร่องทางร่างกาย</div></div>
                    <div className="text-center flex flex-col justify-end"><div className="mt-8 mb-2">ลงชื่อ ........................................ ผู้รายงาน</div><div className="mb-1">(นายณรงค์ฤทธิ์ ปกป้อง)</div><div>ครูผู้สอน</div></div>
                    <div className="text-center flex flex-col justify-end"><div className="mt-8 mb-2">ลงชื่อ ........................................ ผู้รับรอง</div><div className="mb-1">(นายยุทธชัย แก้วพิลา)</div><div>หัวหน้ากลุ่มบริหารวิชาการ</div></div>

                    <div className="col-span-3 flex justify-center gap-16 mt-2">
                        <div className="text-center flex flex-col justify-end"><div className="mt-8 mb-2">ลงชื่อ ........................................ ผู้รับรอง</div><div className="mb-1">(นายอานนท์ สีดาพรม)</div><div>รองผู้อำนวยการศูนย์การศึกษาพิเศษ ประจำจังหวัดยโสธร</div></div>
                        <div className="text-center flex flex-col justify-end"><div className="mt-8 mb-2">ลงชื่อ ........................................ ผู้รับรอง</div><div className="mb-1">(นายกำพล พาภักดี)</div><div>ผู้อำนวยการศูนย์การศึกษาพิเศษ ประจำจังหวัดยโสธร</div></div>
                    </div>
                </div>

                <div className="print-footer absolute bottom-2 left-0 w-full text-center text-[8px] text-gray-400 opacity-50">ระบบบันทึกการมารับบริการของห้องเรียน--ออกแบบและพัฒนาโดย--NARONGLIT</div>
            </div>

            {/* Page 2 Landscape */}
            <div className="print-page-landscape relative text-black bg-white">
                <div className="print-header">
                    <div className="text-center mb-3">
                        <h1>แบบบันทึกการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกายหรือการเคลื่อนไหวหรือสุขภาพ</h1>
                        <p>ประจำเดือน {MONTHS_TH[selectedMonth]} พ.ศ. {toThaiNumber(selectedYear + 543)}</p>
                    </div>
                </div>
                
                <table className="w-full border-collapse border border-black mb-4 text-[9px]">
                    <thead><tr className="bg-gray-200"><th className="border border-black p-1 w-8">ที่</th><th className="border border-black p-1 min-w-[120px] text-left">ชื่อ-นามสกุล</th>{daysArray.map(d=><th key={d} className="border border-black p-0.5 w-5">{toThaiNumber(d)}</th>)}<th className="border border-black p-1 w-10">รวม</th></tr></thead>
                    <tbody>
                        {reportData.data.map((item, index) => (
                            <tr key={item.id}>
                                <td className="border border-black p-1 text-center">{toThaiNumber(index + 1)}</td>
                                <td className="border border-black p-1 pl-2 truncate max-w-[150px] text-left">{item.name}</td>
                                {daysArray.map(d=><td key={d} className="border border-black p-0 text-center h-6">{(attendanceData[item.id]||{})[d]?'✓':''}</td>)}
                                <td className="border border-black p-1 text-center font-bold">{item.count>0?toThaiNumber(item.count):'-'}</td>
                            </tr>
                        ))}
                        {Array.from({length: Math.max(0, 15 - reportData.data.length)}).map((_, i) => <tr key={`em-${i}`}><td className="border border-black h-6"></td><td className="border border-black"></td>{daysArray.map(d=><td key={d} className="border border-black"></td>)}<td className="border border-black"></td></tr>)}
                        <tr className="bg-gray-100 font-bold"><td className="border border-black p-1 text-center" colSpan={daysArray.length + 2}>รวมจำนวนครั้งที่ให้บริการทั้งหมด</td><td className="border border-black p-1 text-center">{toThaiNumber(reportData.totalVisits)}</td></tr>
                    </tbody>
                </table>
                <div className="print-footer absolute bottom-2 left-0 w-full text-center text-[8px] text-gray-400 opacity-50">ระบบบันทึกการมารับบริการของห้องเรียน--ออกแบบและพัฒนาโดย--NARONGLIT</div>
            </div>
         </div>
      </div>
      
      {/* Show preview in main view too (optional, but good for UX so user sees what they print) */}
       <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start custom-scrollbar">
           <div className="bg-white p-8 shadow-lg text-center text-gray-500">
               <Printer size={48} className="mx-auto mb-4 text-purple-300" />
               <p className="text-lg font-medium">พร้อมพิมพ์รายงาน</p>
               <p className="text-sm mt-2">กดปุ่ม "พิมพ์ (แบบใหม่)" ด้านบนเพื่อเริ่มพิมพ์</p>
               <p className="text-xs mt-1 text-gray-400">(ระบบจะจัดหน้า A4 แนวตั้งและแนวนอนให้อัตโนมัติ)</p>
           </div>
       </div>

    </div>
  );
};