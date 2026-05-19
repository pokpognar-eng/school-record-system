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
  Download,
  ZoomIn,
  ZoomOut
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
    return collection(db, 'artifacts', APP_ID, 'public', 'data', collectionName);
  } else {
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
        
        /* Preview container on screen */
        .print-page-landscape {
          width: 297mm;
          min-height: 210mm;
          margin: 20px auto 50px auto;
          padding: 10mm; 
          background: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          box-sizing: border-box;
        }

        .print-page-portrait {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto 50px auto; 
          padding: 10mm; 
          background: white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
          box-sizing: border-box;
        }

        /* Scale preview on small screens */
        @media screen and (max-width: 1200px) {
           .screen-preview-wrapper {
              transform: scale(0.6) !important;
              transform-origin: top center;
              margin-bottom: -400px !important; 
           }
        }
        
        /* ==================== PRINT STYLES ==================== */
        @media print {
          body, html, #root, #main-content {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            font-family: 'Sarabun', sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .no-print, header, nav, aside, footer, button, select, .screen-only, .print-controls, .login-modal, .loading-overlay {
            display: none !important;
            visibility: hidden !important;
          }

          aside, .lg\\:hidden, .no-print { display: none !important; }
          main { padding: 0 !important; margin: 0 !important; display: block !important; }
          .max-w-7xl { max-width: none !important; width: 100% !important; margin: 0 !important; }
          .md\\:rounded-3xl { border-radius: 0 !important; border: none !important; box-shadow: none !important; }
          .flex-1 { flex: none !important; display: block !important; }
          
          .screen-preview-wrapper {
             transform: none !important;
             margin: 0 !important;
             padding: 0 !important;
             display: block !important;
          }
          
          #print-root {
            display: block !important;
            visibility: visible !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
          }
          
          #print-root * {
             visibility: visible !important;
          }

          /* บังคับค่าเริ่มต้นเป็นแนวตั้ง */
          @page { size: A4 portrait; margin: 0; }
          
          /* กำหนดชื่อหน้าสำหรับแนวนอน */
          @page landscape-page { size: A4 landscape; margin: 0; }
          
          /* กำหนดชื่อหน้าสำหรับแนวตั้ง */
          @page portrait-page { size: A4 portrait; margin: 0; }
          
          .print-page-landscape {
            page: landscape-page; /* บังคับใช้ชื่อหน้าที่เป็นแนวนอน */
            break-after: always;
            break-after: page;
            width: 297mm !important;
            height: 210mm !important;
            padding: 10mm !important; 
            margin: 0 !important;
            position: relative;
            box-sizing: border-box;
            display: block !important;
            box-shadow: none !important;
            background: white !important;
          }

          .print-page-portrait {
            page: portrait-page; /* บังคับใช้ชื่อหน้าที่เป็นแนวตั้ง */
            break-before: always;
            break-before: page;
            width: 210mm !important;
            height: 297mm !important;
            /* ตั้งค่าขอบกระดาษตามกำหนด: บน 2.5ซม, ล่าง 2ซม, ซ้าย 3ซม, ขวา 2ซม */
            padding: 25mm 20mm 20mm 30mm !important; 
            margin: 0 !important;
            position: relative;
            box-sizing: border-box;
            display: block !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          table { width: 100% !important; border-collapse: collapse; }
          th, td { border: 1px solid black !important; padding: 4px 2px; text-align: center; }
          th { background-color: #f0f0f0 !important; font-weight: bold; }
          h1 { font-size: 14pt !important; font-weight: bold; text-align: center; margin: 0 0 5px 0; }
          p { font-size: 12pt !important; text-align: center; margin: 0 0 5px 0; }
          
          .print-footer {
             position: absolute;
             bottom: 5mm;
             left: 0;
             width: 100%;
             text-align: center;
             font-size: 8pt;
             color: #000;
             opacity: 0.5;
             visibility: visible !important;
          }
        }
      `}</style>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} onLogin={handleLogin} />

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

      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow-lg z-50 print:hidden relative no-print">
        <div className="flex items-center gap-3">
             <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm"><FileText size={18} /></div>
             <h1 className="font-bold text-base">Service Report</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/20 transition active:scale-95"><Menu size={24} /></button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl 
        transform transition-transform duration-300 ease-out border-r border-gray-100 
        lg:relative lg:translate-x-0 print:hidden flex flex-col no-print
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
             v11.9 (Final Print v3) • {ENABLE_SHARED_DATA ? <Cloud size={10} className="text-blue-500" /> : <CloudOff size={10} />}
          </div>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden print:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <main id="main-content" className="flex-1 p-0 md:p-4 lg:p-8 overflow-y-auto h-[100dvh] lg:h-screen print:h-auto print:overflow-visible bg-slate-100 print:bg-white print:p-0">
        <div className="max-w-7xl mx-auto h-full flex flex-col md:pb-0 print:max-w-none print:h-auto print:block">
          <div className={`flex-1 bg-white md:rounded-3xl shadow-sm border-x md:border border-slate-100 relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:border-none print:overflow-visible print:block`}>
            <div className="h-1 md:h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full absolute top-0 left-0 print:hidden z-10 no-print"></div>
            
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
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden no-print ${active ? (isAdmin ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700') : 'hover:bg-gray-50 text-gray-600'}`}>
    {active && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>}
    <div className="flex items-center gap-4 relative z-10">
        <div className={`${active ? (isAdmin ? "text-purple-600" : "text-blue-600") : "text-gray-400 group-hover:text-gray-600"}`}>{icon}</div>
        <div className="text-left"><span className="block font-semibold text-sm">{label}</span>{desc && <span className="block text-[10px] opacity-70 font-light">{desc}</span>}</div>
    </div>
    {active && <ChevronRight size={16} className={`opacity-50 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />}
  </button>
);

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
      <div className="p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 print:hidden no-print">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><UserPlus size={20} /></div>
          จัดการรายชื่อ
        </h2>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar flex-1 pb-20 lg:pb-8 print:hidden no-print">
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

const AttendanceView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [focusedDay, setFocusedDay] = useState(new Date().getDate()); 
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(getCollectionRef('students', user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        data.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(data);
      }, (error) => {
        if (error.code === 'permission-denied') setPermissionError(true);
      });
      return () => unsubscribe();
    } catch (err) { console.error(err); }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    try {
      const docRef = doc(getCollectionRef('attendance', user.uid), `attendance_${selectedYear}_${selectedMonth}`);
      const unsubscribe = onSnapshot(docRef, (snapshot) => {
        setAttendanceData(snapshot.exists() ? snapshot.data() : {});
        setDataLoading(false);
      }, (error) => {
        console.error("Attendance fetch error:", error);
        setDataLoading(false);
      });
      return () => unsubscribe();
    } catch (err) { console.error(err); setDataLoading(false); }
  }, [user, selectedMonth, selectedYear]);

  const toggleAttendance = async (studentId, day) => {
    const currentStatus = (attendanceData[studentId] || {})[day] || false;
    const newStatus = !currentStatus;
    const docRef = doc(getCollectionRef('attendance', user.uid), `attendance_${selectedYear}_${selectedMonth}`);
    try {
      await setDoc(docRef, {
        [studentId]: {
          ...(attendanceData[studentId] || {}),
          [day]: newStatus
        }
      }, { merge: true });
    } catch (error) {
      if (error.code === 'permission-denied') setPermissionError(true);
      else alert('บันทึกไม่สำเร็จ: ' + error.message);
    }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Calendar size={20} /></div>
          บันทึกการให้บริการ
        </h2>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="flex-1 md:flex-none p-2 bg-white rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm">{MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="flex-1 md:flex-none p-2 bg-white rounded-xl border border-gray-200 shadow-sm outline-none focus:ring-2 focus:ring-blue-500 text-sm"><option value={selectedYear}>{selectedYear + 543}</option></select>
        </div>
      </div>

      <div className="lg:hidden p-4 bg-blue-50/50 border-b no-print">
         <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">เลือกวันที่</span>
            <span className="text-xs text-gray-500 font-medium">{focusedDay} {MONTHS_TH[selectedMonth]}</span>
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {daysArray.map(day => (
                <button key={day} onClick={() => setFocusedDay(day)} className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${day === focusedDay ? 'bg-blue-600 text-white shadow-md scale-110' : 'bg-white text-gray-400 border border-gray-100'}`}>{day}</button>
            ))}
         </div>
      </div>

      <div className="lg:hidden flex-1 overflow-y-auto p-4 space-y-3 pb-24 no-print">
          {dataLoading ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div> : students.length === 0 ? <div className="text-center py-10 text-gray-400">ไม่มีรายชื่อนักเรียน</div> : 
          students.map(student => {
              const isPresent = (attendanceData[student.id] || {})[focusedDay];
              return (
                  <div key={student.id} onClick={() => toggleAttendance(student.id, focusedDay)} className={`p-4 rounded-2xl border transition-all flex items-center justify-between active:scale-[0.98] ${isPresent ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                          <div className={`w-1.5 h-10 rounded-full ${student.gender === 'ชาย' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                          <div>
                              <p className={`font-bold text-sm ${isPresent ? 'text-green-700' : 'text-gray-700'}`}>{student.name}</p>
                              <p className="text-[10px] text-gray-400 uppercase">{student.gender}</p>
                          </div>
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPresent ? 'bg-green-500 text-white rotate-0' : 'bg-gray-50 text-gray-200 -rotate-90'}`}><Check size={20} strokeWidth={3} /></div>
                  </div>
              );
          })}
      </div>

      <div className="hidden lg:flex flex-1 overflow-hidden relative no-print">
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

const ReportView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(0.65); 

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

  const handlePrint = () => {
    if (confirm("ระบบจะเปิดหน้าต่างพิมพ์\n\n1. เลือก 'Save as PDF' (บันทึกเป็น PDF)\n2. เลือกขนาดกระดาษ A4\n3. ตั้งค่าขอบ (Margins) เป็น 'Default' หรือ 'None'")) {
      window.print();
    }
  };

  const group1 = [
    { title: 'หัวหน้าห้องร่างกายและสห้องกายภาพบำบัด', name: '(นางสาวจุฬาลักษณ์ จุฬารมย์)' },
    { title: 'ครูผู้สอน', name: '(นายฐกฤต มิ่งขวัญ)' },
    { title: 'ครูผู้สอน', name: '(นายณรงค์ฤทธิ์ ปกป้อง)' }
  ];

  const group2 = [
    { title: 'รองผู้อำนวยการศูนย์การศึกษาพิเศษ ประจำจังหวัดยโสธร', name: '(นายอานนท์ สีดาพรม)' },
    { title: 'หัวหน้ากลุ่มบริหารวิชาการ', name: '(นายยุทธชัย แก้วพิลา)' }
  ];

  const group3 = [
    { title: 'ผู้อำนวยการศูนย์การศึกษาพิเศษ ประจำจังหวัดยโสธร', name: '(นายกำพล พาภักดี)' }
  ];

  return (
    <div className="h-full flex flex-col relative bg-slate-200/50 print:bg-white">
      {loading && <LoadingOverlay />}
      <div className="p-4 md:p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><div className="p-2 bg-purple-100 rounded-lg text-purple-600"><FileText size={20} /></div> สรุปรายงาน</h2>
          <p className="text-gray-500 text-xs ml-10 hidden md:block">ใช้คอมพิวเตอร์เพื่อสั่งพิมพ์ (A4)</p>
        </div>
        <div className="flex gap-2 text-sm">
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="p-2 bg-white rounded-lg border shadow-sm outline-none">{MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="p-2 bg-white rounded-lg border shadow-sm outline-none"><option value={selectedYear}>{selectedYear + 543}</option></select>
          
          <div className="flex bg-white rounded-lg border shadow-sm overflow-hidden">
             <button onClick={() => setZoomLevel(Math.max(0.3, zoomLevel - 0.1))} className="p-2 hover:bg-gray-100 border-r" title="Zoom Out"><ZoomOut size={16} /></button>
             <button onClick={() => setZoomLevel(Math.min(1.5, zoomLevel + 0.1))} className="p-2 hover:bg-gray-100" title="Zoom In"><ZoomIn size={16} /></button>
          </div>

          <button 
            onClick={handlePrint} 
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 shadow-md font-medium"
          >
            <Printer size={16} /> <span className="hidden md:inline">พิมพ์ / บันทึก PDF</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start custom-scrollbar print:overflow-visible print:p-0">
         <div 
            className="screen-preview-wrapper"
            style={{ 
               transform: `scale(${zoomLevel})`,
               transformOrigin: 'top center',
               marginBottom: '50px' 
            }}
         >
            <div id="print-root">
                {/* --- หน้าที่ 1: แนวนอน (Landscape) --- */}
                <div className="print-page-landscape relative text-black bg-white">
                    <div className="print-header">
                        <div className="text-center mb-3">
                            <h1 style={{fontSize: '14pt', fontWeight: 'bold'}}>รายงานผลการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกายหรือการเคลื่อนไหวหรือสุขภาพ</h1>
                            <p style={{fontSize: '12pt'}}>ประจำเดือน {MONTHS_TH[selectedMonth]} พ.ศ. {toThaiNumber(selectedYear + 543)}</p>
                        </div>
                    </div>
                    
                    <table className="print-table mb-4" style={{fontSize: '9pt', width: '100%', borderCollapse: 'collapse'}}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th style={{border: '1px solid black', padding: '2px', width: '30px'}}>ที่</th>
                            <th style={{border: '1px solid black', padding: '2px', minWidth: '150px'}}>ชื่อ-นามสกุล</th>
                            {daysArray.map(d=><th key={d} style={{border: '1px solid black', padding: '2px', width: '20px'}}>{toThaiNumber(d)}</th>)}
                            <th style={{border: '1px solid black', padding: '2px', width: '40px'}}>รวม</th>
                          </tr>
                        </thead>
                        <tbody>
                            {reportData.data.map((item, index) => (
                                <tr key={item.id}>
                                    <td style={{border: '1px solid black', padding: '2px', textAlign: 'center'}}>{toThaiNumber(index + 1)}</td>
                                    <td style={{border: '1px solid black', padding: '2px', paddingLeft: '5px', textAlign: 'left', whiteSpace: 'nowrap'}}>{item.name}</td>
                                    {daysArray.map(d=><td key={d} style={{border: '1px solid black', padding: '2px', textAlign: 'center'}}>{(attendanceData[item.id]||{})[d]?'/':''}</td>)}
                                    <td style={{border: '1px solid black', padding: '2px', textAlign: 'center', fontWeight: 'bold'}}>{item.count>0?toThaiNumber(item.count):'-'}</td>
                                </tr>
                            ))}
                            {Array.from({length: Math.max(0, 15 - reportData.data.length)}).map((_, i) => (
                              <tr key={`em-${i}`}>
                                <td style={{border: '1px solid black', padding: '2px', height: '22px'}}></td>
                                <td style={{border: '1px solid black', padding: '2px'}}></td>
                                {daysArray.map(d=><td key={d} style={{border: '1px solid black', padding: '2px'}}></td>)}
                                <td style={{border: '1px solid black', padding: '2px'}}></td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                              <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}} colSpan={daysArray.length + 2}>รวมจำนวนครั้งที่ให้บริการทั้งหมด</td>
                              <td style={{border: '1px solid black', padding: '4px', textAlign: 'center'}}>{toThaiNumber(reportData.totalVisits)}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div className="print-footer">ระบบบันทึกการมารับบริการของห้องเรียน - ออกแบบและพัฒนาโดย - NARONGLIT</div>
                </div>

                {/* --- หน้าที่ 2: แนวตั้ง (Portrait) --- */}
                <div className="print-page-portrait relative text-black bg-white">
                    <div className="text-center mb-6">
                        <h1 style={{fontSize: '14pt', fontWeight: 'bold'}}>สรุปรายงานผลการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกาย</h1>
                        <h1 style={{fontSize: '14pt', fontWeight: 'bold'}}>หรือการเคลื่อนไหวหรือสุขภาพ</h1>
                        <p style={{fontSize: '12pt'}}>ประจำเดือน {MONTHS_TH[selectedMonth]} พ.ศ. {toThaiNumber(selectedYear + 543)}</p>
                    </div>

                    {/* ตารางสรุปจำนวนครั้งในหน้าที่ 2 */}
                    <table className="print-table mb-8" style={{fontSize: '11pt', width: '100%', borderCollapse: 'collapse', maxWidth: '600px', margin: '0 auto'}}>
                        <thead>
                          <tr className="bg-gray-200">
                            <th style={{border: '1px solid black', padding: '6px', width: '50px'}}>ที่</th>
                            <th style={{border: '1px solid black', padding: '6px'}}>ชื่อ-นามสกุล</th>
                            <th style={{border: '1px solid black', padding: '6px', width: '150px'}}>จำนวนครั้ง (ครั้ง)</th>
                          </tr>
                        </thead>
                        <tbody>
                            {reportData.data.map((item, index) => (
                                <tr key={item.id}>
                                    <td style={{border: '1px solid black', padding: '6px', textAlign: 'center'}}>{toThaiNumber(index + 1)}</td>
                                    <td style={{border: '1px solid black', padding: '6px', paddingLeft: '10px', textAlign: 'left'}}>{item.name}</td>
                                    <td style={{border: '1px solid black', padding: '6px', textAlign: 'center'}}>{item.count>0?toThaiNumber(item.count):'-'}</td>
                                </tr>
                            ))}
                            {Array.from({length: Math.max(0, 10 - reportData.data.length)}).map((_, i) => (
                              <tr key={`em2-${i}`}>
                                <td style={{border: '1px solid black', padding: '6px', height: '30px'}}></td>
                                <td style={{border: '1px solid black', padding: '6px'}}></td>
                                <td style={{border: '1px solid black', padding: '6px'}}></td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold">
                              <td style={{border: '1px solid black', padding: '8px', textAlign: 'center'}} colSpan={2}>รวม</td>
                              <td style={{border: '1px solid black', padding: '8px', textAlign: 'center'}}>{toThaiNumber(reportData.totalVisits)}</td>
                            </tr>
                        </tbody>
                    </table>

				                    {/* ส่วนลงนาม v10: บังคับบรรทัดเดียว ขนาดฟอนต์เท่ากัน และคำว่าลงชื่อครบถ้วน */}
				                    <div className="mt-8 space-y-12" style={{fontSize: '9pt'}}>
				                        {/* แถวที่ 1: 3 คน */}
				                        <div className="grid grid-cols-3 gap-x-1 text-center">
				                            {group1.map((p, i) => (
				                                <div key={i} className="flex flex-col items-center">
				                                    <div className="flex items-center justify-center w-full whitespace-nowrap">
				                                        <span className="flex-shrink-0">ลงชื่อ</span>
				                                        <span className="ml-1 overflow-hidden">..........................................</span>
				                                    </div>
				                                    <p className="font-bold whitespace-nowrap text-[9.5pt] mt-1">{p.name}</p>
				                                    <p className="whitespace-nowrap text-[9pt] mt-0.5">{p.title}</p>
				                                </div>
				                            ))}
				                        </div>
				                        
				                        {/* แถวที่ 2: 3 คน */}
				                        <div className="grid grid-cols-3 gap-x-1 text-center">
				                            {group2.map((p, i) => (
				                                <div key={i} className="flex flex-col items-center">
				                                    <div className="flex items-center justify-center w-full whitespace-nowrap">
				                                        <span className="flex-shrink-0">ลงชื่อ</span>
				                                        <span className="ml-1 overflow-hidden">..........................................</span>
				                                    </div>
				                                    <p className="font-bold whitespace-nowrap text-[9.5pt] mt-1">{p.name}</p>
				                                    <p className="whitespace-nowrap text-[9pt] mt-0.5">{p.title}</p>
				                                </div>
				                            ))}
				                        </div>
		
						                        {/* แถวที่ 3: 2 คน (ผู้อำนวยการ) - บังคับบรรทัดเดียวและเพิ่มระยะห่างระหว่างคอลัมน์ */}
						                        <div className="grid grid-cols-2 gap-x-12 text-center">
						                            {group3.map((p, i) => (
						                                <div key={i} className="flex flex-col items-center">
						                                    <div className="flex items-center justify-center w-full whitespace-nowrap">
						                                        <span className="flex-shrink-0">ลงชื่อ</span>
						                                        <span className="ml-1 overflow-hidden">............................................................</span>
						                                    </div>
						                                    <p className="font-bold whitespace-nowrap text-[10pt] mt-1">{p.name}</p>
						                                    <p className="whitespace-nowrap text-[9pt] mt-0.5 tracking-tighter">{p.title}</p>
						                                </div>
						                            ))}
						                        </div>
				                    </div>
                    <div className="print-footer">ระบบบันทึกการมารับบริการของห้องเรียน-ออกแบบและพัฒนาโดย-NARONGLIT</div>
                </div>
            </div>
         </div>
      </div>
    </div>
  );
};
