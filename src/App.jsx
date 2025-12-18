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
  ShieldCheck,
  User,
  Pencil,
  RotateCcw,
  AlertTriangle,
  Settings
} from 'lucide-react';

// --- Firebase Configuration & Initialization ---
let firebaseConfig;
let isConfigConfigured = false;

try {
  // 1. ลองอ่านค่าจากระบบ Preview (Environment Variable)
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    firebaseConfig = JSON.parse(__firebase_config);
    isConfigConfigured = true;
  } 
} catch (error) {
  console.error("Error parsing system config:", error);
}

// 2. ถ้าไม่มีค่าจากระบบ (เช่น รัน Local) ให้ใช้ค่า Default หรือค่าที่ผู้ใช้ใส่เอง
if (!isConfigConfigured) {
  firebaseConfig = {
    // ⚠️ ถ้าคุณรันในเครื่องตัวเอง (Localhost) ให้เอาค่าจาก Firebase Console มาใส่ตรงนี้ครับ
  apiKey: "AIzaSyAzuFU6enoi0CjhI40gF3ncjTisKWCUcl0",
  authDomain: "school-service-app-baf5e.firebaseapp.com",
  projectId: "school-service-app-baf5e",
  storageBucket: "school-service-app-baf5e.firebasestorage.app",
  messagingSenderId: "1088172496852",
  appId: "1:1088172496852:web:06f7102960dbe55a84a841",
  measurementId: "G-QF92J5LMWT"
  };
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle App ID
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'school-record-system';
const APP_ID = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_'); 

// --- Constants & Helpers ---
const MONTHS_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const THAI_NUMBERS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
const toThaiNumber = (num) => {
  return num.toString().replace(/[0-9]/g, (d) => THAI_NUMBERS[d]);
};

// --- Components ---

const LoadingOverlay = ({ message = "กำลังประมวลผล..." }) => (
  <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-xl animate-fade-in">
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
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${colorClasses[color] || colorClasses.gray}`}>
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
    setTimeout(() => {
        onLogin(password);
        setPassword('');
        setLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
          <h3 className="font-bold text-lg flex items-center gap-2"><Lock size={20} /> ผู้ดูแลระบบ</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3">
               <ShieldCheck size={32} className="text-blue-600" />
            </div>
            <p className="text-gray-500 text-sm text-center">กรุณากรอกรหัสผ่านเพื่อเข้าถึงส่วนจัดการ</p>
            <p className="text-xs text-gray-400 mt-1">(รหัสทดสอบ: 1234)</p>
          </div>
          
          <div className="relative mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 focus:bg-white"
              placeholder="รหัสผ่าน"
              autoFocus
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all font-medium flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Config Error Screen ---
const ConfigErrorScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-red-500">
      <div className="flex justify-center mb-4">
        <div className="bg-red-100 p-4 rounded-full">
          <Settings size={48} className="text-red-500" />
        </div>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">ยังไม่ได้ตั้งค่า Firebase</h2>
      <p className="text-gray-600 mb-6 text-sm">
        ระบบตรวจไม่พบ API Key หรือการตั้งค่า Firebase ที่ถูกต้อง กรุณาตรวจสอบไฟล์ <code>src/App.jsx</code>
      </p>
      <div className="bg-gray-100 p-4 rounded-lg text-left mb-6 overflow-x-auto">
        <code className="text-xs text-gray-700">
          const firebaseConfig = &#123;<br/>
          &nbsp;&nbsp;apiKey: "วาง_API_KEY_ที่นี่",<br/>
          &nbsp;&nbsp;authDomain: "...",<br/>
          &nbsp;&nbsp;projectId: "..."<br/>
          &#125;;
        </code>
      </div>
      <p className="text-xs text-gray-400">
        หากรันใน Canvas Preview ควรจะทำงานอัตโนมัติ หากไม่ทำงานให้ลองรีเฟรช
      </p>
    </div>
  </div>
);

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('attendance'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const [configError, setConfigError] = useState(false);

  useEffect(() => {
    // ถ้าไม่มี API Key เลย ให้แสดงหน้า Error ทันที
    if (!firebaseConfig?.apiKey) {
      setConfigError(true);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth failed:", error);
        // เช็คว่า Error เกิดจาก Config ผิดหรือไม่
        if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
          setConfigError(true);
        } else {
          // ลอง Fallback
          signInAnonymously(auth).catch(err => {
            console.error("Anonymous fallback failed", err);
            if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
              setConfigError(true);
            }
          });
        }
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = (password) => {
    if (password === '1234') { 
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setActiveTab('report'); 
    } else {
      alert('รหัสผ่านไม่ถูกต้อง (ลองใช้ 1234)');
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setActiveTab('attendance'); 
  };

  // ถ้า Config ผิด ให้แสดงหน้าแจ้งเตือน
  if (configError) {
    return <ConfigErrorScreen />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-600 font-sans">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
        </div>
        <p className="mt-4 font-medium animate-pulse text-lg">กำลังเชื่อมต่อฐานข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col md:flex-row print:bg-white overflow-hidden">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLogin={handleLogin} 
      />

      {/* Permission Error Banner */}
      {permissionError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-11/12 max-w-2xl bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded shadow-lg flex items-start gap-3 animate-fade-in">
          <AlertTriangle size={24} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">เชื่อมต่อฐานข้อมูลไม่ได้ (Permission Denied)</p>
            <p className="text-sm mt-1">เกิดปัญหาเรื่องสิทธิ์การเข้าถึงข้อมูล กรุณาลองรีเฟรชหน้าจอ</p>
            <button 
              onClick={() => setPermissionError(false)}
              className="mt-3 text-xs bg-red-100 hover:bg-red-200 px-3 py-1 rounded transition"
            >
              ปิดคำเตือน
            </button>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center shadow-lg z-50 print:hidden">
        <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <FileText size={20} />
             </div>
             <h1 className="font-bold text-lg">Service Report</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg hover:bg-white/20 transition active:scale-95">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside 
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl transform transition-transform duration-300 ease-out border-r border-gray-100
          md:relative md:translate-x-0 print:hidden flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6">
            <div className="flex justify-between items-start md:hidden mb-4">
                <div></div>
                <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24}/></button>
            </div>

            <div className="flex flex-col items-center p-6 bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <FileText size={80} />
                </div>
                <div className={`p-4 rounded-full mb-3 shadow-sm transition-all duration-500 group-hover:scale-110 ${isAdmin ? 'bg-white text-purple-600 ring-4 ring-purple-100' : 'bg-white text-blue-600 ring-4 ring-blue-100'}`}>
                    {isAdmin ? <Unlock size={32} /> : <User size={32} />}
                </div>
                <h2 className="text-lg font-bold text-gray-800 text-center relative z-10">งานทะเบียนนักเรียน</h2>
                <div className="mt-2 relative z-10">
                    {isAdmin ? (
                        <Badge color="purple" icon={ShieldCheck}>ผู้ดูแลระบบ</Badge>
                    ) : (
                        <Badge color="blue" icon={User}>ผู้ใช้งานทั่วไป</Badge>
                    )}
                </div>
            </div>

            <nav className="space-y-2">
                <p className="px-4 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">เมนูหลัก</p>
                <NavButton 
                    active={activeTab === 'attendance'} 
                    onClick={() => { setActiveTab('attendance'); setIsSidebarOpen(false); }}
                    icon={<Calendar size={20} />}
                    label="บันทึกการให้บริการ"
                    desc="Check-in รายวัน"
                />
                
                {isAdmin && (
                    <div className="mt-6 pt-6 border-t border-gray-100 animate-fade-in-up">
                        <p className="px-4 text-xs font-bold text-purple-400 mb-2 uppercase tracking-wider">ส่วนจัดการ (Admin)</p>
                        <NavButton 
                            active={activeTab === 'report'} 
                            onClick={() => { setActiveTab('report'); setIsSidebarOpen(false); }}
                            icon={<Printer size={20} />}
                            label="พิมพ์รายงานสรุป"
                            desc="แบบฟอร์มราชการ"
                            isAdmin={true}
                        />
                        <NavButton 
                            active={activeTab === 'students'} 
                            onClick={() => { setActiveTab('students'); setIsSidebarOpen(false); }}
                            icon={<UserPlus size={20} />}
                            label="จัดการรายชื่อ"
                            desc="เพิ่ม/ลบ นักเรียน"
                            isAdmin={true}
                        />
                    </div>
                )}
            </nav>
        </div>
        
        <div className="mt-auto p-4 border-t bg-gray-50/50">
           {isAdmin ? (
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-medium border border-red-100 group"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> ออกจากระบบ
            </button>
          ) : (
            <button 
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-gray-600 rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all font-medium border border-gray-200 group"
            >
              <Lock size={18} className="text-gray-400 group-hover:text-blue-500 transition-colors" /> เข้าสู่ระบบ Admin
            </button>
          )}
          <div className="mt-4 text-[10px] text-center text-gray-400 font-light">
            Service Recording System v4.2 (Fixed) <br/> Designed with ❤️
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3 md:p-6 lg:p-8 overflow-y-auto h-screen print:p-0 print:overflow-visible bg-slate-100/50">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col print:shadow-none print:rounded-none print:border-none">
            {/* Header Gradient Decoration (Screen only) */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-full absolute top-0 left-0 print:hidden"></div>
            
            {activeTab === 'attendance' && <AttendanceView user={user} setPermissionError={setPermissionError} />}
            
            {/* Admin Routes with Animation */}
            {activeTab === 'report' && isAdmin && <ReportView user={user} setPermissionError={setPermissionError} />}
            {activeTab === 'students' && isAdmin && <StudentManager user={user} setPermissionError={setPermissionError} />}
            
            {/* Locked State */}
            {(activeTab === 'report' || activeTab === 'students') && !isAdmin && (
               <div className="flex flex-col items-center justify-center h-full p-10 text-center animate-fade-in">
                  <div className="bg-gray-100 p-6 rounded-full mb-6">
                    <Lock size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">จำกัดสิทธิ์การเข้าถึง 🔒</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">เนื้อหานี้สำหรับผู้ดูแลระบบเท่านั้น กรุณายืนยันตัวตนเพื่อเข้าใช้งาน</p>
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30 transition-all font-medium"
                  >
                    เข้าสู่ระบบผู้ดูแล
                  </button>
               </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

// --- Component: Nav Button ---
const NavButton = ({ active, onClick, icon, label, desc, isAdmin }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
      ${active 
        ? isAdmin 
            ? 'bg-purple-50 text-purple-700 shadow-inner' 
            : 'bg-blue-50 text-blue-700 shadow-inner'
        : 'hover:bg-gray-50 text-gray-600 hover:text-gray-900'
      }`}
  >
    {active && <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAdmin ? 'bg-purple-500' : 'bg-blue-500'}`}></div>}
    <div className="flex items-center gap-4 relative z-10">
        <div className={`${active ? (isAdmin ? "text-purple-600" : "text-blue-600") : "text-gray-400 group-hover:text-gray-600"} transition-colors`}>
            {icon}
        </div>
        <div className="text-left">
            <span className="block font-semibold text-sm">{label}</span>
            {desc && <span className="block text-[10px] opacity-70 font-light">{desc}</span>}
        </div>
    </div>
    {active && <ChevronRight size={16} className={`opacity-50 ${isAdmin ? 'text-purple-400' : 'text-blue-400'}`} />}
  </button>
);

// --- Component: Student Manager ---
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
    // Switch to private user path to avoid permission issues
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(data);
      setDataLoading(false);
    }, (error) => {
      console.error("Student snapshot error (Permissions):", error);
      if (error.code === 'permission-denied') setPermissionError(true);
      setDataLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      if (editMode && currentStudentId) {
         const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'students', currentStudentId);
         await updateDoc(docRef, {
            name: newName.trim(),
            gender: newGender
         });
      } else {
         const docRef = doc(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'students'));
         await setDoc(docRef, {
            name: newName.trim(),
            gender: newGender,
            createdAt: new Date().toISOString()
         });
      }
      setNewName('');
      setNewGender('ชาย');
      setEditMode(false);
      setCurrentStudentId(null);
    } catch (error) {
      console.error("Error saving student:", error);
      if (error.code === 'permission-denied') setPermissionError(true);
      else alert('บันทึกข้อมูลไม่สำเร็จ: ' + error.message);
    }
    setLoading(false);
  };

  const handleEditClick = (student) => {
    setNewName(student.name);
    setNewGender(student.gender);
    setEditMode(true);
    setCurrentStudentId(student.id);
  };

  const handleCancelEdit = () => {
    setNewName('');
    setNewGender('ชาย');
    setEditMode(false);
    setCurrentStudentId(null);
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('ยืนยันการลบรายชื่อนักเรียน?')) return;
    setLoading(true); 
    try {
      await deleteDoc(doc(db, 'artifacts', APP_ID, 'users', user.uid, 'students', id));
      if (editMode && currentStudentId === id) {
          handleCancelEdit();
      }
    } catch (error) {
      console.error("Error deleting:", error);
      if (error.code === 'permission-denied') setPermissionError(true);
      else alert('ลบข้อมูลไม่สำเร็จ: ' + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col relative">
      {loading && <LoadingOverlay message={editMode ? "กำลังบันทึกการแก้ไข..." : "กำลังบันทึกข้อมูล..."} />}

      <div className="p-6 md:p-8 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><UserPlus size={24} /></div>
          จัดการรายชื่อนักเรียน
        </h2>
        <p className="text-gray-500 mt-1 ml-12 text-sm">เพิ่ม ลบ แก้ไข ฐานข้อมูลนักเรียน (เฉพาะผู้ดูแล)</p>
      </div>

      <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8 overflow-y-auto custom-scrollbar">
        {/* Form Card */}
        <div className="md:col-span-1">
            <div className={`bg-white p-6 rounded-2xl border shadow-lg sticky top-6 transition-all duration-300 ${editMode ? 'border-yellow-200 ring-2 ring-yellow-100' : 'border-gray-100'}`}>
                <h3 className={`font-bold text-gray-800 mb-4 flex items-center gap-2 ${editMode ? 'text-yellow-600' : ''}`}>
                    {editMode ? <Pencil size={18} /> : <Plus size={18} className="text-green-500" />} 
                    {editMode ? 'แก้ไขข้อมูล' : 'เพิ่มรายชื่อใหม่'}
                </h3>
                <form onSubmit={handleSaveStudent} className="space-y-4">
                    <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">ชื่อ-นามสกุล</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="ระบุชื่อ..."
                        className={`w-full p-3 border rounded-xl focus:ring-2 outline-none transition-all bg-gray-50 focus:bg-white ${editMode ? 'border-yellow-200 focus:ring-yellow-500' : 'border-gray-200 focus:ring-purple-500'}`}
                        required
                    />
                    </div>
                    <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">เพศ</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setNewGender('ชาย')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newGender === 'ชาย' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium ring-1 ring-blue-300' : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}
                        >
                            👦 ชาย
                        </button>
                        <button
                            type="button"
                            onClick={() => setNewGender('หญิง')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${newGender === 'หญิง' ? 'bg-pink-50 border-pink-200 text-pink-700 font-medium ring-1 ring-pink-300' : 'hover:bg-gray-50 border-gray-200 text-gray-500'}`}
                        >
                            👧 หญิง
                        </button>
                    </div>
                    </div>
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full text-white py-3 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 font-medium mt-4 ${editMode ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'}`}
                    >
                        {editMode ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
                    </button>
                    
                    {editMode && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm flex justify-center items-center gap-1"
                        >
                            <RotateCcw size={14} /> ยกเลิกการแก้ไข
                        </button>
                    )}
                </form>
            </div>
        </div>

        {/* List Card */}
        <div className="md:col-span-2">
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[600px]">
            <div className="bg-gray-50/80 backdrop-blur px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
              <span className="font-bold text-gray-700 flex items-center gap-2">
                 <Users size={18} className="text-gray-400" /> รายชื่อทั้งหมด <Badge color="gray">{students.length}</Badge>
              </span>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                {dataLoading ? (
                    <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin text-purple-500" /></div>
                ) : students.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                        <Users size={48} className="mb-2" />
                        <p>ยังไม่มีรายชื่อนักเรียน</p>
                    </div>
                ) : (
                <div className="space-y-2">
                    {students.map((student, index) => (
                    <div key={student.id} className={`group px-4 py-3 flex items-center justify-between bg-white hover:bg-purple-50 rounded-xl border transition-all ${currentStudentId === student.id ? 'border-yellow-300 bg-yellow-50' : 'border-transparent hover:border-purple-100'}`}>
                        <div className="flex items-center gap-4">
                        <span className="text-gray-400 w-8 font-mono text-sm bg-gray-50 rounded px-1 text-center">{index + 1}</span>
                        <div>
                            <p className="font-semibold text-gray-800">{student.name}</p>
                            <div className="flex mt-1">
                                {student.gender === 'ชาย' 
                                    ? <Badge color="blue">ชาย</Badge> 
                                    : <Badge color="pink">หญิง</Badge>}
                            </div>
                        </div>
                        </div>
                        <div className="flex gap-1">
                             <button 
                                onClick={() => handleEditClick(student)}
                                className="text-gray-400 hover:text-yellow-600 p-2 rounded-full hover:bg-yellow-100 transition"
                                title="แก้ไข"
                            >
                                <Pencil size={18} />
                            </button>
                            <button 
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition"
                                title="ลบรายชื่อ"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Attendance View ---
const AttendanceView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(data);
    }, (error) => {
        console.error("Snapshot error:", error);
        if (error.code === 'permission-denied') setPermissionError(true);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const docId = `attendance_${selectedYear}_${selectedMonth}`;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'attendance', docId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setAttendanceData(docSnap.data());
      } else {
        setAttendanceData({});
      }
      setDataLoading(false);
    }, (error) => {
        console.error("Attendance snapshot error:", error);
        if (error.code === 'permission-denied') setPermissionError(true);
        setDataLoading(false);
    });
    return () => unsubscribe();
  }, [user, selectedMonth, selectedYear]);

  const toggleAttendance = async (studentId, day) => {
    const currentData = attendanceData[studentId] || {};
    const newStatus = !currentData[day];
    
    const updatedStudentData = { ...currentData, [day]: newStatus };
    const docId = `attendance_${selectedYear}_${selectedMonth}`;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'attendance', docId);

    try {
      await setDoc(docRef, { [studentId]: updatedStudentData }, { merge: true });
    } catch (e) {
      console.error("Save failed", e);
      if (e.code === 'permission-denied') setPermissionError(true);
      else alert('บันทึกไม่สำเร็จ: ' + e.message);
    }
  };

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col relative">
      {dataLoading && <LoadingOverlay message="กำลังโหลดข้อมูล..." />}
      
      <div className="p-6 md:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="flex-1 max-w-4xl">
           <h2 className="text-lg md:text-xl font-bold text-gray-800 flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mt-0.5 min-w-fit shrink-0"><Calendar size={20} /></div>
            <span className="leading-snug">บันทึกการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกายหรือการเคลื่อนไหวหรือสุขภาพ</span>
          </h2>
          <p className="text-gray-500 mt-1 ml-12 text-sm">คลิกที่ช่องวันที่เพื่อบันทึกข้อมูล (Save Auto)</p>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 shrink-0">
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="p-2 bg-transparent outline-none font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-lg transition"
          >
            {MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <div className="w-[1px] bg-gray-200 my-1"></div>
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="p-2 bg-transparent outline-none font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-lg transition"
          >
            <option value={selectedYear - 1}>{selectedYear - 1 + 543}</option>
            <option value={selectedYear}>{selectedYear + 543}</option>
            <option value={selectedYear + 1}>{selectedYear + 1 + 543}</option>
          </select>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-hidden">
        <div className="h-full border border-gray-200 rounded-2xl shadow-sm bg-white flex flex-col overflow-hidden relative">
          {/* Legend */}
          <div className="bg-gray-50/50 px-4 py-2 border-b text-xs flex gap-4 text-gray-500 justify-end">
            <div className="flex items-center gap-1.5"><CheckCircle size={14} className="text-green-500" /> มาใช้บริการ</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-300"></div> ไม่ได้มา</div>
          </div>

          <div className="overflow-auto custom-scrollbar flex-1 pb-4">
            <table className="min-w-max w-full text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 sticky top-0 z-20 shadow-sm font-semibold">
                <tr>
                  <th className="p-4 text-center border-b border-r w-14 sticky left-0 bg-gray-50 z-30 text-xs uppercase tracking-wider">#</th>
                  <th className="p-4 text-left border-b border-r min-w-[220px] sticky left-14 bg-gray-50 z-30 text-xs uppercase tracking-wider">รายชื่อนักเรียน</th>
                  {daysArray.map(day => (
                    <th key={day} className="p-1 w-10 text-center border-b border-r font-medium text-xs text-gray-400">{day}</th>
                  ))}
                  <th className="p-3 text-center min-w-[80px] bg-blue-50 text-blue-700 border-b sticky right-0 z-20">รวม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student, idx) => {
                  const studentRecord = attendanceData[student.id] || {};
                  const totalPresent = daysArray.reduce((acc, day) => acc + (studentRecord[day] ? 1 : 0), 0);

                  return (
                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="p-3 text-center border-r text-gray-400 sticky left-0 bg-white group-hover:bg-blue-50/30 z-10 font-mono text-xs">{idx + 1}</td>
                      <td className="p-3 text-left border-r font-medium text-gray-700 sticky left-14 bg-white group-hover:bg-blue-50/30 z-10 truncate max-w-[220px] border-b-0">
                          <div className="flex items-center gap-2">
                             <div className={`w-1 h-8 rounded-full ${student.gender === 'ชาย' ? 'bg-blue-400' : 'bg-pink-400'}`}></div>
                             {student.name}
                          </div>
                      </td>
                      {daysArray.map(day => (
                        <td 
                          key={day} 
                          className="p-0 border-r border-gray-100 text-center cursor-pointer relative select-none"
                          onClick={() => toggleAttendance(student.id, day)}
                        >
                          <div className={`w-full h-12 flex items-center justify-center transition-all duration-200 ${studentRecord[day] ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                             {studentRecord[day] ? (
                                <div className="animate-scale-in">
                                    <CheckCircle size={20} className="text-green-500 fill-green-100 drop-shadow-sm" />
                                </div>
                             ) : (
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-100 group-hover:bg-gray-200"></div>
                             )}
                          </div>
                        </td>
                      ))}
                      <td className="p-2 text-center font-bold text-blue-600 bg-blue-50/50 sticky right-0 border-l border-blue-100 z-10">
                        <Badge color="blue">{totalPresent}</Badge>
                      </td>
                    </tr>
                  );
                })}
                {students.length === 0 && !dataLoading && (
                  <tr>
                    <td colSpan={daysArray.length + 3} className="p-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-3">
                        <Users size={40} className="opacity-20" />
                        <span className="font-light">ไม่พบรายชื่อนักเรียน</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Component: Report View ---
const ReportView = ({ user, setPermissionError }) => {
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(collection(db, 'artifacts', APP_ID, 'users', user.uid, 'students'));
    const unsubscribeStudents = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    }, (error) => {
        console.error("Student snapshot error:", error);
        if (error.code === 'permission-denied') setPermissionError(true);
    });

    const docId = `attendance_${selectedYear}_${selectedMonth}`;
    const docRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'attendance', docId);
    const unsubscribeAtt = onSnapshot(docRef, (docSnap) => {
        setAttendanceData(docSnap.exists() ? docSnap.data() : {});
        setLoading(false);
    }, (error) => {
        console.error("Attendance snapshot error:", error);
        if (error.code === 'permission-denied') setPermissionError(true);
        setLoading(false);
    });

    return () => {
        unsubscribeStudents();
        unsubscribeAtt();
    };
  }, [user, selectedMonth, selectedYear]);

  // Calculate Report Data
  const reportData = useMemo(() => {
    const data = students.map((student, index) => {
      const record = attendanceData[student.id] || {};
      const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
      let count = 0;
      for (let i = 1; i <= daysInMonth; i++) {
        if (record[i]) count++;
      }
      return {
        ...student,
        no: index + 1,
        count
      };
    });
    
    const totalVisits = data.reduce((sum, item) => sum + item.count, 0);
    return { data, totalVisits };
  }, [students, attendanceData, selectedMonth, selectedYear]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex flex-col relative">
      {loading && <LoadingOverlay />}
      
      {/* Screen Controls */}
      <div className="p-6 border-b bg-white/50 backdrop-blur-sm sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-600"><FileText size={24} /></div>
            สรุปรายงาน (Print Mode)
          </h2>
          <p className="text-gray-500 mt-1 ml-12 text-sm">ตรวจสอบข้อมูลก่อนสั่งพิมพ์ (รูปแบบ A4)</p>
        </div>
        <div className="flex gap-3">
          <div className="flex gap-2 bg-white p-1.5 rounded-xl border shadow-sm">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="p-2 bg-transparent outline-none font-medium text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50"
            >
                {MONTHS_TH.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <div className="w-[1px] bg-gray-200 my-1"></div>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="p-2 bg-transparent outline-none font-medium text-gray-700 cursor-pointer rounded-lg hover:bg-gray-50"
            >
                <option value={selectedYear - 1}>{selectedYear - 1 + 543}</option>
                <option value={selectedYear}>{selectedYear + 543}</option>
                <option value={selectedYear + 1}>{selectedYear + 1 + 543}</option>
            </select>
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-md font-medium"
          >
            <Printer size={18} /> พิมพ์เอกสาร
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 overflow-auto bg-slate-200/50 p-4 md:p-8 print:bg-white print:p-0 print:overflow-visible flex justify-center custom-scrollbar">
        <div className="bg-white shadow-xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[20mm] relative text-black leading-normal scale-100 md:scale-95 origin-top transition-transform duration-500 flex flex-col justify-between">
            <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 font-bold rounded-bl-lg print:hidden">A4 Preview</div>

            <div>
                <div className="text-center mb-6">
                    <h1 className="text-lg font-bold leading-tight">สรุปรายงานผลการให้บริการห้องบุคคลที่มีความบกพร่องทางร่างกาย<br/>หรือการเคลื่อนไหวหรือสุขภาพ</h1>
                    <p className="text-lg font-bold mt-2">
                        ประจำเดือน <span className="border-b border-dotted border-gray-400 px-4 inline-block min-w-[100px]">{MONTHS_TH[selectedMonth]}</span> 
                        พ.ศ. <span className="border-b border-dotted border-gray-400 px-4 inline-block min-w-[60px]">{toThaiNumber(selectedYear + 543)}</span>
                    </p>
                </div>

                <table className="w-full border-collapse border border-black mb-4 text-sm">
                    <thead>
                        <tr className="bg-gray-200 print:bg-gray-100">
                            <th className="border border-black p-2 text-center w-12 font-bold">ที่</th>
                            <th className="border border-black p-2 text-center font-bold">ชื่อ-นามสกุล</th>
                            <th className="border border-black p-2 text-center w-40 font-bold">จำนวนครั้งที่มารับบริการ<br/>(ครั้ง)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.data.map((item) => (
                        <tr key={item.id}>
                            <td className="border border-black p-1.5 text-center">{toThaiNumber(item.no)}</td>
                            <td className="border border-black p-1.5 pl-4 text-left">{item.name}</td>
                            <td className="border border-black p-1.5 text-center">{item.count > 0 ? item.count : '-'}</td>
                        </tr>
                        ))}
                        {Array.from({ length: Math.max(0, 15 - reportData.data.length) }).map((_, i) => (
                            <tr key={`empty-${i}`}>
                                <td className="border border-black p-2 h-8"></td>
                                <td className="border border-black"></td>
                                <td className="border border-black"></td>
                            </tr>
                        ))}
                        <tr className="bg-gray-100 print:bg-gray-50 font-bold">
                            <td className="border border-black p-2 text-center" colSpan="2">รวม</td>
                            <td className="border border-black p-2 text-center text-lg">{reportData.totalVisits}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-8 mt-6 px-4 text-sm">
                <div className="text-center relative">
                    <div className="mb-2 whitespace-nowrap">ลงชื่อ ...................................................... ผู้รายงาน</div>
                    <div className="mb-1">(นายฐิติกานต์ พรมโสภา)</div>
                    <div className="text-xs font-medium whitespace-nowrap">หัวหน้าห้องบุคคลที่มีความบกพร่องทางร่างกายฯ</div>
                </div>
                <div className="text-center">
                    <div className="mb-2 whitespace-nowrap">ลงชื่อ ...................................................... ผู้รายงาน</div>
                    <div className="mb-1">(นายณรงค์ฤทธิ์  ปกป้อง)</div>
                    <div className="text-sm font-medium">ครูผู้สอน</div>
                </div>
                <div className="text-center">
                     <div className="mb-2 whitespace-nowrap">ลงชื่อ ...................................................... ผู้รับรอง</div>
                    <div className="mb-1">(นายยุทธชัย แก้วพิลา)</div>
                    <div className="text-sm font-medium">หัวหน้ากลุ่มบริหารวิชาการ</div>
                </div>
                <div className="text-center">
                    <div className="mb-2 whitespace-nowrap">ลงชื่อ ...................................................... ผู้รับรอง</div>
                    <div className="mb-1">(นายกำพล พาภักดี)</div>
                    <div className="text-xs font-medium whitespace-nowrap">ผู้อำนวยการศูนย์การศึกษาพิเศษ ประจำจังหวัดยโสธร</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};