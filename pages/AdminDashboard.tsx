
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DriverStatus, User, TransactionType, TransactionStatus, RideStatus } from '../types';
import { Shield, CheckCircle, XCircle, Search, Wallet, Lock, Unlock, ArrowUpRight, ArrowDownLeft, Settings, Save, RefreshCw, Key } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const AdminDashboard: React.FC = () => {
    const { isAppReady, currentUser, allUsers, transactions, systemSettings, rides, rideRequests, approveDriver, rejectDriver, grantDriverPermission, revokeDriverPermission, grantEmailPermission, revokeEmailPermission, approveRide, rejectRide, approveRideRequest, rejectRideRequest, blockUser, adminUpdateWallet, approveTransaction, rejectTransaction, updateSystemSettings, updateRideFee } = useApp();
  const navigate = useNavigate();
  
  // Lock Screen State
  const [isLocked, setIsLocked] = useState(true);
  const [unlockPassword, setUnlockPassword] = useState('');

    const [activeTab, setActiveTab] = useState<'drivers' | 'users' | 'transactions' | 'system' | 'rides' | 'permitted'>('drivers');
  
  // Driver Status Sub-tab
  const [driverStatusTab, setDriverStatusTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const [searchTerm, setSearchTerm] = useState('');
    // Search + selection for permitted drivers tab
    const [permittedSearch, setPermittedSearch] = useState('');
    const [selectedPermittedDrivers, setSelectedPermittedDrivers] = useState<string[]>([]);
    const [permittedFilter, setPermittedFilter] = useState<'all' | 'noMail'>('all');
  
  // Wallet Modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // System Settings Form
  const [settingsForm, setSettingsForm] = useState(systemSettings);

    useEffect(() => {
        // Wait until app has synced users from Firebase to avoid premature redirects
        if (!isAppReady) return;

        if (!currentUser) {
            navigate('/login');
        } else if (!currentUser.isAdmin) {
            alert('Bạn không có quyền truy cập trang này.');
            navigate('/');
        }
    }, [isAppReady, currentUser, navigate]);

  useEffect(() => {
      setSettingsForm(systemSettings);
  }, [systemSettings]);

    if (!isAppReady) return null;
    if (!currentUser || !currentUser.isAdmin) return null;

  const handleUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      if (unlockPassword === '654789@&$%Tktefvca') {
          setIsLocked(false);
      } else {
          alert('Mật khẩu bảo mật không chính xác!');
      }
  };

  // --- LOCK SCREEN VIEW ---
  if (isLocked) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 text-center">
                  <div className="mx-auto bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mb-6">
                      <Lock className="w-10 h-10 text-slate-700" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">Bảo mật Admin</h2>
                  <p className="text-slate-500 mb-6">
                      Vui lòng nhập mật khẩu quản trị cấp 2 để mở khóa bảng điều khiển.
                  </p>
                  
                  <form onSubmit={handleUnlock} className="space-y-4">
                      <div className="relative">
                          <Key className="absolute top-3 left-3 text-slate-400" size={20} />
                          <input 
                            type="password" 
                            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:outline-none transition-all"
                            placeholder="Nhập mật khẩu..."
                            value={unlockPassword}
                            onChange={(e) => setUnlockPassword(e.target.value)}
                            autoFocus
                          />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-900 transition-colors shadow-lg"
                      >
                          Mở khóa hệ thống
                      </button>
                      <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="w-full text-sm text-slate-500 hover:text-slate-800 mt-2"
                      >
                          Quay lại Trang chủ
                      </button>
                  </form>
              </div>
          </div>
      );
  }

  // --- MAIN DASHBOARD CONTENT (UNLOCKED) ---
  
  // Filter Drivers based on sub-tab
  const displayedDrivers = allUsers.filter(u => u.driverStatus === driverStatusTab);
  
  const pendingTransactions = transactions.filter(t => t.status === TransactionStatus.PENDING);

  const filteredUsers = allUsers.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.phone && u.phone.includes(searchTerm))
  );

  // Visible drivers for the 'permitted' tab (applies current filter + search)
  const visibleDrivers = (() => {
      const base = allUsers.filter(u => u.isDriver);
      const filteredByFlag = permittedFilter === 'noMail' ? base.filter(u => u.canReceiveEmails !== true) : base;
      const q = (permittedSearch || '').toLowerCase();
      return filteredByFlag.filter(u => {
          if (!q) return true;
          return (u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q) || (u.email || '').toLowerCase().includes(q);
      });
  })();

  const handleWalletUpdate = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedUser && amount) {
          adminUpdateWallet(selectedUser.id, Number(amount), description || 'Admin điều chỉnh số dư');
          setSelectedUser(null);
          setAmount('');
          setDescription('');
          alert('Cập nhật ví thành công!');
      }
  };

  const handleApproveTransaction = (txId: string, type: TransactionType) => {
      const bankRefCode = window.prompt("Nhập mã giao dịch ngân hàng (từ sao kê) để lưu vết:", "");
      if (bankRefCode !== null) { 
          approveTransaction(txId, bankRefCode || undefined);
      }
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
      e.preventDefault();
      
      updateSystemSettings(settingsForm);
      alert('Đã lưu cấu hình hệ thống thành công!');
  };

  // Preview QR Code Logic
  const previewQrLink = `https://img.vietqr.io/image/${settingsForm.bankId}-${settingsForm.accountNumber}-compact.png?accountName=${encodeURIComponent(settingsForm.accountOwner)}`;

  return (
    <div className="min-h-screen bg-gray-100">
       <div className="bg-slate-800 text-white shadow-md">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2">
                   <Shield className="h-8 w-8 text-yellow-400" />
                   <h1 className="text-xl font-bold">Admin Dashboard</h1>
               </div>
               <div className="flex flex-wrap justify-center gap-2">
                   <button 
                     type="button"
                     onClick={() => setActiveTab('drivers')}
                     className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'drivers' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                   >
                       Duyệt Tài xế
                   </button>
                                     <button 
                                         type="button"
                                         onClick={() => setActiveTab('transactions')}
                                         className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'transactions' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                                     >
                                             Duyệt Giao dịch ({pendingTransactions.length})
                                     </button>
                                    <button 
                                        type="button"
                                        // Rides approval tab
                                        onClick={() => setActiveTab('rides')}
                                        className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'rides' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                                    >
                                            Duyệt Chuyến ({(rides || []).filter(r => r.status === RideStatus.PENDING).length + (rideRequests || []).filter(r => r.status === 'PENDING').length})
                                    </button>
                                       <button 
                                        type="button"
                                        onClick={() => setActiveTab('permitted')}
                                        className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'permitted' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                                        >
                                            Tài xế được cấp quyền ({allUsers.filter(u => u.isDriver).length})
                                        </button>
                   <button 
                     type="button"
                     onClick={() => setActiveTab('users')}
                     className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'users' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                   >
                       Quản lý Users
                   </button>
                                    <button 
                                        type="button"
                                        onClick={() => setActiveTab('system')}
                                        className={`px-3 py-2 rounded-md font-medium text-sm md:text-base ${activeTab === 'system' ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-700'}`}
                                    >
                                            <Settings size={18} className="inline mr-1" /> Cấu hình
                                    </button>
               </div>
           </div>
       </div>

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           
           {/* TAB 1: DRIVERS */}
           {activeTab === 'drivers' && (
               <div>
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-gray-800">Quản lý Tài xế</h2>
                       <div className="flex bg-white rounded-lg shadow-sm p-1">
                           <button 
                             onClick={() => setDriverStatusTab('PENDING')}
                             className={`px-4 py-1.5 rounded-md text-sm font-medium ${driverStatusTab === 'PENDING' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                           >
                               Chờ duyệt ({allUsers.filter(u => u.driverStatus === 'PENDING').length})
                           </button>
                           <button 
                             onClick={() => setDriverStatusTab('APPROVED')}
                             className={`px-4 py-1.5 rounded-md text-sm font-medium ${driverStatusTab === 'APPROVED' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-50'}`}
                           >
                               Đã duyệt
                           </button>
                           <button 
                             onClick={() => setDriverStatusTab('REJECTED')}
                             className={`px-4 py-1.5 rounded-md text-sm font-medium ${driverStatusTab === 'REJECTED' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-50'}`}
                           >
                               Đã từ chối
                           </button>
                       </div>
                   </div>

                   {displayedDrivers.length === 0 ? (
                       <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
                           Không có hồ sơ nào trong mục này.
                       </div>
                   ) : (
                       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                           {displayedDrivers.map(driver => (
                               <div key={driver.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                                   <div className="p-6">
                                       <div className="flex items-center gap-4 mb-4">
                                           <img src={driver.avatar} alt="" className="h-12 w-12 rounded-full bg-gray-200" />
                                           <div>
                                               <h3 className="font-bold text-gray-900">{driver.name || 'Chưa cập nhật tên'}</h3>
                                               <p className="text-sm text-gray-500">{driver.phone}</p>
                                               <span className={`text-xs px-2 py-0.5 rounded ${
                                                   driver.driverStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                                                   driver.driverStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : 
                                                   'bg-red-100 text-red-800'
                                               }`}>
                                                   {driver.driverStatus === 'PENDING' ? 'Chờ duyệt' : driver.driverStatus === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}
                                               </span>
                                           </div>
                                       </div>
                                       <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
                                           <div className="flex justify-between">
                                               <span className="text-gray-500">Xe:</span>
                                               <span className="font-medium">{driver.carModel}</span>
                                           </div>
                                           <div className="flex justify-between">
                                               <span className="text-gray-500">Biển số:</span>
                                               <span className="font-medium">{driver.licensePlate}</span>
                                           </div>
                                           <div className="flex justify-between">
                                               <span className="text-gray-500">GPLX:</span>
                                               <span className="font-medium">{driver.licenseNumber}</span>
                                           </div>
                                       </div>
                                       
                                       {/* Only show actions if Pending */}
                                       {driverStatusTab === 'PENDING' && (
                                           <div className="flex gap-3">
                                               <button 
                                                 type="button"
                                                 onClick={(e) => {
                                                     e.stopPropagation();
                                                     if(window.confirm(`Xác nhận DUYỆT tài xế: ${driver.name || driver.phone}?\n\nHồ sơ sẽ được chuyển sang mục 'Đã duyệt'.`)) {
                                                         approveDriver(driver.id);
                                                     }
                                                 }}
                                                 className="flex-1 bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 flex items-center justify-center gap-1"
                                               >
                                                   <CheckCircle size={16} /> Duyệt
                                               </button>
                                               <button 
                                                 type="button"
                                                 onClick={(e) => {
                                                    e.stopPropagation();
                                                    if(window.confirm(`Xác nhận TỪ CHỐI tài xế: ${driver.name || driver.phone}?\n\nHồ sơ sẽ được chuyển sang mục 'Đã từ chối'.`)) {
                                                        rejectDriver(driver.id);
                                                    }
                                                 }}
                                                 className="flex-1 bg-red-100 text-red-700 py-2 rounded-md font-medium hover:bg-red-200 flex items-center justify-center gap-1"
                                               >
                                                   <XCircle size={16} /> Từ chối
                                               </button>
                                           </div>
                                       )}
                                       {driverStatusTab !== 'PENDING' && (
                                           <div className="text-center text-sm text-gray-400 italic">
                                               Đã xử lý
                                           </div>
                                       )}

                                       {/* Permission management: grant/revoke platform driving right */}
                                       {driver.driverStatus === 'APPROVED' && (
                                           <div className="mt-3">
                                               {driver.isDriver ? (
                                                   <button type="button" onClick={() => { if(window.confirm('Thu hồi quyền lái cho tài xế này?')) { revokeDriverPermission(driver.id); } }} className="w-full bg-red-100 text-red-700 py-2 rounded-md font-medium hover:bg-red-200">Thu hồi quyền</button>
                                               ) : (
                                                   <button type="button" onClick={() => { if(window.confirm('Cấp quyền lái cho tài xế này?')) { grantDriverPermission(driver.id); } }} className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700">Cấp quyền</button>
                                               )}
                                           </div>
                                       )}

                                       {/* Email permission management */}
                                       {driver.driverStatus === 'APPROVED' && (
                                           <div className="mt-3">
                                               {driver.canReceiveEmails === false ? (
                                                   <button type="button" onClick={() => { if(window.confirm('Cấp quyền nhận mail cho tài xế này?')) { grantEmailPermission(driver.id); } }} className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700">Cấp quyền nhận mail</button>
                                               ) : (
                                                   <button type="button" onClick={() => { if(window.confirm('Thu hồi quyền nhận mail cho tài xế này?')) { revokeEmailPermission(driver.id); } }} className="w-full bg-yellow-100 text-yellow-800 py-2 rounded-md font-medium hover:bg-yellow-200">Thu hồi quyền nhận mail</button>
                                               )}
                                           </div>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
           )}

           {/* TAB ?: RIDES PENDING APPROVAL (TOP-LEVEL) */}
           {activeTab === 'rides' && (
               <div>
                   <h2 className="text-xl font-bold text-gray-800 mb-6">Chuyến chờ duyệt ({(rides || []).filter(r => r.status === RideStatus.PENDING).length})</h2>
                   {(rides || []).filter(r => r.status === RideStatus.PENDING).length === 0 ? (
                       <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">Không có chuyến chờ duyệt.</div>
                   ) : (
                       <div className="grid gap-6">
                           {(rides || []).filter(r => r.status === RideStatus.PENDING).map(r => (
                               <div key={r.id} className="bg-white rounded-lg shadow p-6 flex flex-col md:flex-row justify-between items-start gap-4">
                                   <div className="flex-1">
                                       <p className="text-lg font-bold">{r.origin} → {r.destination}</p>
                                       <p className="text-sm text-gray-600">Tài xế: {r.driverName} ({r.driverPhone})</p>
                                       <p className="text-sm text-gray-500">Thời gian: {new Date(r.departureTime).toLocaleString('vi-VN')}</p>
                                       <p className="text-sm text-gray-500 mt-2">Giá: {r.price.toLocaleString('vi-VN')}đ • Ghế: {r.seatsAvailable}/{r.seatsTotal}</p>
                                       <p className="text-sm text-gray-500 mt-1">Phí nền tảng: {(r.platformFeePercent || 0) * 100}%</p>
                                       {r.description && <p className="text-sm text-gray-700 mt-2">{r.description}</p>}
                                   </div>
                                   <div className="flex flex-col gap-2 w-full md:w-auto">
                                       <div className="flex gap-2">
                                           <button type="button" onClick={() => { if(window.confirm('Duyệt chuyến này?')) { approveRide(r.id); } }} className="bg-green-600 text-white px-4 py-2 rounded">Duyệt</button>
                                           <button type="button" onClick={() => { const reason = window.prompt('Lý do từ chối (tuỳ chọn):',''); if(reason !== null) { rejectRide(r.id, reason); } }} className="bg-red-100 text-red-700 px-4 py-2 rounded">Từ chối</button>
                                       </div>
                                       <button type="button" onClick={() => {
                                           const input = window.prompt('Nhập phần trăm phí nền tảng cho chuyến này (VD: 1 cho 1%):', String((r.platformFeePercent || 0) * 100));
                                           if (input !== null) {
                                               const v = Number(input);
                                               if (isNaN(v) || v < 0) { alert('Giá trị không hợp lệ'); return; }
                                               if (!window.confirm(`Xác nhận cập nhật phí nền tảng thành ${v}% cho chuyến này?`)) return;
                                               const newVal = v / 100;
                                               updateRideFee(r.id, newVal);
                                               alert('Đã cập nhật phí nền tảng');
                                           }
                                       }} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">Sửa phí</button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}

                  {/* Pending Ride Requests (users posting 'looking for ride') */}
                  <div className="mt-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Yêu cầu tìm chuyến chờ duyệt ({(rideRequests || []).filter(rr => rr.status === 'PENDING').length})</h3>
                      {(rideRequests || []).filter(rr => rr.status === 'PENDING').length === 0 ? (
                          <div className="bg-white rounded-lg p-6 text-center text-gray-500 shadow-sm">Không có yêu cầu tìm chuyến chờ duyệt.</div>
                      ) : (
                          <div className="grid gap-4">
                              {(rideRequests || []).filter(rr => rr.status === 'PENDING').map(rr => (
                                  <div key={rr.id} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row justify-between items-start gap-4">
                                      <div className="flex-1">
                                          <p className="text-md font-bold">{rr.origin} → {rr.destination}</p>
                                          <p className="text-sm text-gray-600">Người đăng: {rr.passengerName} ({rr.passengerPhone})</p>
                                          <p className="text-sm text-gray-500">Thời gian: {new Date(rr.pickupTime).toLocaleString('vi-VN')}</p>
                                          <p className="text-sm text-gray-500 mt-1">Giá đề nghị: {rr.priceOffered.toLocaleString('vi-VN')}đ • Ghế cần: {rr.seatsNeeded || 1}</p>
                                          {rr.note && <p className="text-sm text-gray-700 mt-2">{rr.note}</p>}
                                      </div>
                                      <div className="flex flex-col gap-2 w-full md:w-auto">
                                          <button type="button" onClick={() => { if(window.confirm('Duyệt yêu cầu này?')) { approveRideRequest(rr.id); } }} className="bg-green-600 text-white px-4 py-2 rounded">Duyệt</button>
                                          <button type="button" onClick={() => { const reason = window.prompt('Lý do từ chối (tuỳ chọn):',''); if(reason !== null) { rejectRideRequest(rr.id, reason); } }} className="bg-red-100 text-red-700 px-4 py-2 rounded">Từ chối</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
               </div>
           )}

           {/* TAB 2: PENDING TRANSACTIONS */}
           {activeTab === 'transactions' && (
               <div>
                   <h2 className="text-xl font-bold text-gray-800 mb-6">Giao dịch chờ xử lý ({pendingTransactions.length})</h2>
                   {pendingTransactions.length === 0 ? (
                       <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow-sm">
                           Không có giao dịch nào đang chờ xử lý.
                       </div>
                   ) : (
                       <div className="bg-white shadow overflow-hidden rounded-lg">
                           <ul className="divide-y divide-gray-200">
                               {pendingTransactions.map(t => {
                                   const user = allUsers.find(u => u.id === t.userId);
                                   return (
                                       <li key={t.id} className="p-6 hover:bg-gray-50">
                                           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                               <div className="flex items-start flex-1 w-full">
                                                   <div className={`p-3 rounded-full mr-4 flex-shrink-0 ${t.type === TransactionType.TOPUP ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {t.type === TransactionType.TOPUP ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                                                   </div>
                                                   <div className="flex-1">
                                                       <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                           {t.type === TransactionType.TOPUP ? 'Yêu cầu Nạp tiền' : 'Yêu cầu Rút tiền'}
                                                           <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-normal border border-gray-300">
                                                               ID: {t.id}
                                                           </span>
                                                       </p>
                                                       <p className="text-sm font-medium text-gray-600">{user?.name} ({user?.phone})</p>
                                                       <p className="text-sm text-gray-500">{t.description}</p>
                                                       
                                                       {t.transferContent && (
                                                           <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2 text-sm">
                                                               <span className="text-blue-600 font-bold block mb-1">
                                                                   {t.type === TransactionType.TOPUP ? 'Nội dung CK yêu cầu:' : 'Thông tin NH nhận:'}
                                                               </span>
                                                               <code className="font-mono bg-white px-2 py-0.5 rounded border border-blue-100 text-gray-800 block w-full break-all">
                                                                   {t.transferContent}
                                                               </code>
                                                           </div>
                                                       )}
                                                       
                                                       <p className="text-xs text-gray-400 mt-2">{format(new Date(t.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>
                                                   </div>
                                               </div>
                                               <div className="text-right w-full md:w-auto flex flex-col items-end">
                                                   <p className={`text-2xl font-bold mb-4 ${t.type === TransactionType.TOPUP ? 'text-green-600' : 'text-red-600'}`}>
                                                       {t.amount > 0 ? '+' : ''}{Math.abs(t.amount).toLocaleString('vi-VN')}đ
                                                   </p>
                                                   <div className="flex gap-2 w-full md:w-auto">
                                                       <button 
                                                         type="button"
                                                         onClick={() => handleApproveTransaction(t.id, t.type)}
                                                         className="flex-1 md:flex-none bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 shadow-sm"
                                                       >
                                                           Duyệt
                                                       </button>
                                                       <button 
                                                         type="button"
                                                         onClick={() => {
                                                            if(window.confirm('Từ chối giao dịch này?')) rejectTransaction(t.id);
                                                         }}
                                                         className="flex-1 md:flex-none bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded text-sm font-medium hover:bg-gray-50"
                                                       >
                                                           Từ chối
                                                       </button>
                                                   </div>
                                               </div>
                                           </div>
                                       </li>
                                   );
                               })}
                           </ul>
                       </div>
                   )}
               </div>
           )}

           {/* TAB 3: USER MANAGEMENT */}
           {activeTab === 'users' && (
               <div>
                   <div className="flex justify-between items-center mb-6">
                       <h2 className="text-xl font-bold text-gray-800">Danh sách người dùng</h2>
                       <div className="relative">
                           <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                           <input 
                             type="text" 
                             placeholder="Tìm theo tên hoặc SĐT..." 
                             className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                           />
                       </div>
                   </div>

                   <div className="bg-white shadow overflow-hidden rounded-lg">
                       <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                               <tr>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ví tiền</th>
                                   <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                   <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                               </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                               {filteredUsers.map(user => (
                                   <tr key={user.id} className={user.isBlocked ? 'bg-red-50' : ''}>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           <div className="flex items-center">
                                               <div className="flex-shrink-0 h-10 w-10">
                                                   <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                                               </div>
                                               <div className="ml-4">
                                                   <div className="text-sm font-medium text-gray-900">{user.name || 'Chưa đặt tên'}</div>
                                                   <div className="text-sm text-gray-500">{user.phone}</div>
                                               </div>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           {user.isAdmin ? (
                                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
                                           ) : user.isDriver ? (
                                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">Tài xế</span>
                                           ) : (
                                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Khách hàng</span>
                                           )}
          
                                          {/* NOTE: permitted-drivers UI moved to its own top-level tab block (not nested inside users table). */}

                                          {/* NOTE: rides tab was previously (incorrectly) nested inside the users table row.
                                              It has been removed from here and is rendered as its own top-level tab block below. */}

                                          
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                           {user.walletBalance.toLocaleString('vi-VN')}đ
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap">
                                           {user.isBlocked ? (
                                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Đã khóa</span>
                                           ) : (
                                               <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Hoạt động</span>
                                           )}
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                           <button 
                                             type="button"
                                             onClick={() => setSelectedUser(user)}
                                             className="text-blue-600 hover:text-blue-900 mr-4"
                                             title="Cộng/Trừ tiền"
                                           >
                                               <Wallet size={18} />
                                           </button>
                                           {!user.isAdmin && (
                                               <button 
                                                 type="button"
                                                 onClick={() => {
                                                     const action = user.isBlocked ? 'Mở khóa' : 'Khóa';
                                                     if(window.confirm(`Bạn có chắc muốn ${action} tài khoản ${user.name}?`)) {
                                                         blockUser(user.id, !user.isBlocked);
                                                     }
                                                 }}
                                                 className={user.isBlocked ? "text-green-600 hover:text-green-900" : "text-red-600 hover:text-red-900"}
                                                 title={user.isBlocked ? "Mở khóa" : "Khóa tài khoản"}
                                               >
                                                   {user.isBlocked ? <Unlock size={18} /> : <Lock size={18} />}
                                               </button>
                                           )}
                                       </td>
                                   </tr>
                               ))}
                           </tbody>
                       </table>
                   </div>
               </div>
           )}
          
          {/* TAB X: PERMITTED DRIVERS (TOP-LEVEL) */}
          {activeTab === 'permitted' && (
              <div>
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800">Tài xế được cấp quyền</h2>
                      <div className="flex items-center gap-3">
                          <div className="relative">
                              <Search className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                              <input 
                                type="text" 
                                placeholder="Tìm theo tên hoặc SĐT..." 
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={permittedSearch}
                                onChange={(e) => setPermittedSearch(e.target.value)}
                              />
                          </div>
                          <div className="flex items-center gap-2">
                              <button type="button" className="bg-green-600 text-white px-4 py-2 rounded-md" onClick={() => {
                                  if (selectedPermittedDrivers.length === 0) { alert('Vui lòng chọn ít nhất một tài xế để cấp quyền nhận mail.'); return; }
                                  if (!window.confirm(`Xác nhận cấp quyền nhận mail cho ${selectedPermittedDrivers.length} tài xế đã chọn?`)) return;
                                  selectedPermittedDrivers.forEach(id => grantEmailPermission(id));
                                  setSelectedPermittedDrivers([]);
                              }}>Cấp quyền nhận mail (chọn nhiều)</button>

                              <button type="button" className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md" onClick={() => {
                                  if (selectedPermittedDrivers.length === 0) { alert('Vui lòng chọn ít nhất một tài xế để thu hồi quyền nhận mail.'); return; }
                                  if (!window.confirm(`Xác nhận thu hồi quyền nhận mail cho ${selectedPermittedDrivers.length} tài xế đã chọn?`)) return;
                                  selectedPermittedDrivers.forEach(id => revokeEmailPermission(id));
                                  setSelectedPermittedDrivers([]);
                              }}>Thu hồi quyền nhận mail (chọn nhiều)</button>

                              <button type="button" className="bg-red-100 text-red-700 px-4 py-2 rounded-md" onClick={() => {
                                  if (selectedPermittedDrivers.length === 0) { alert('Vui lòng chọn ít nhất một tài xế để thu hồi quyền.'); return; }
                                  if (!window.confirm(`Xác nhận thu hồi quyền cho ${selectedPermittedDrivers.length} tài xế đã chọn?`)) return;
                                  selectedPermittedDrivers.forEach(id => revokeDriverPermission(id));
                                  setSelectedPermittedDrivers([]);
                              }}>Thu hồi quyền (chọn nhiều)</button>
                          </div>
                      </div>
                  </div>

                      <div className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="p-4 border-b">
                          <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <label className="inline-flex items-center gap-2">
                                      <input type="checkbox" className="h-4 w-4" onChange={(e) => {
                                          if (e.target.checked) {
                                              // select only drivers visible under current filter & search
                                              const visibleIds = visibleDrivers.map(d => d.id);
                                              setSelectedPermittedDrivers(visibleIds);
                                          } else {
                                              setSelectedPermittedDrivers([]);
                                          }
                                      }} />
                                      <span className="text-sm text-gray-600">Chọn tất cả (danh sách hiện tại)</span>
                                  </label>
                                  <div className="flex items-center gap-2">
                                      <button type="button" onClick={() => setPermittedFilter('all')} className={`px-3 py-1 rounded text-sm ${permittedFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Tất cả</button>
                                      <button type="button" onClick={() => setPermittedFilter('noMail')} className={`px-3 py-1 rounded text-sm ${permittedFilter === 'noMail' ? 'bg-slate-700 text-white' : 'bg-gray-100 text-gray-700'}`}>Chưa cấp mail</button>
                                  </div>
                              </div>
                              <div />
                          </div>
                      </div>
                      <ul className="divide-y divide-gray-200">
                          {visibleDrivers.map(driver => (
                              <li key={driver.id} className="p-4 flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                      <input type="checkbox" checked={selectedPermittedDrivers.includes(driver.id)} onChange={() => {
                                          setSelectedPermittedDrivers(prev => prev.includes(driver.id) ? prev.filter(x => x !== driver.id) : [...prev, driver.id]);
                                      }} className="h-4 w-4" />
                                      <div>
                                          <div className="font-medium text-gray-900">{driver.name || 'Chưa đặt tên'}</div>
                                          <div className="text-sm text-gray-500">{driver.phone} {driver.email ? `• ${driver.email}` : ''}</div>
                                          <div className="text-xs mt-1">
                                              {driver.canReceiveEmails === false ? (
                                                  <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700">Không nhận mail</span>
                                              ) : (
                                                  <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700">Được nhận mail</span>
                                              )}
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <button type="button" onClick={() => { if(window.confirm('Thu hồi quyền tài xế này?')) { revokeDriverPermission(driver.id); } }} className="text-red-600 hover:text-red-900">Thu hồi</button>
                                      {driver.canReceiveEmails === false ? (
                                          <button type="button" onClick={() => { if(window.confirm('Cấp quyền nhận mail cho tài xế này?')) { grantEmailPermission(driver.id); } }} className="text-green-600 hover:text-green-900">Cấp quyền nhận mail</button>
                                      ) : (
                                          <button type="button" onClick={() => { if(window.confirm('Thu hồi quyền nhận mail cho tài xế này?')) { revokeEmailPermission(driver.id); } }} className="text-yellow-700 hover:text-yellow-900">Thu hồi quyền nhận mail</button>
                                      )}
                                  </div>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          )}
           
           {/* TAB 4: SYSTEM SETTINGS */}
           {activeTab === 'system' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2">
                       <h2 className="text-xl font-bold text-gray-800 mb-6">Cấu hình Ngân hàng & Mã QR</h2>
                       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                           <form onSubmit={handleUpdateSettings}>
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                   <div>
                                       <label className="block text-sm font-medium text-gray-700 mb-2">Tên Ngân hàng (Hiển thị)</label>
                                       <input 
                                         type="text" 
                                         className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                         value={settingsForm.bankName}
                                         onChange={e => setSettingsForm({...settingsForm, bankName: e.target.value})}
                                         required
                                       />
                                       <p className="text-xs text-gray-500 mt-1">VD: Vietcombank, Techcombank, MBBank...</p>
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-gray-700 mb-2">Mã Ngân hàng (VietQR ID)</label>
                                       <select 
                                         className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                         value={settingsForm.bankId}
                                         onChange={e => setSettingsForm({...settingsForm, bankId: e.target.value})}
                                       >
                                           <option value="970436">Vietcombank (VCB)</option>
                                           <option value="970407">Techcombank (TCB)</option>
                                           <option value="970422">MBBank (MB)</option>
                                           <option value="970415">VietinBank (CTG)</option>
                                           <option value="970405">Agribank (VBA)</option>
                                           <option value="970418">BIDV (BIDV)</option>
                                           <option value="970432">VPBank (VPB)</option>
                                           <option value="970423">TPBank (TPB)</option>
                                       </select>
                                       <p className="text-xs text-gray-500 mt-1">Chọn đúng ngân hàng để tạo QR chính xác</p>
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-gray-700 mb-2">Số tài khoản</label>
                                       <input 
                                         type="text" 
                                         className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                         value={settingsForm.accountNumber}
                                         onChange={e => setSettingsForm({...settingsForm, accountNumber: e.target.value})}
                                         required
                                       />
                                   </div>
                                   <div>
                                       <label className="block text-sm font-medium text-gray-700 mb-2">Tên chủ tài khoản</label>
                                       <input 
                                         type="text" 
                                         className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 uppercase"
                                         value={settingsForm.accountOwner}
                                         onChange={e => setSettingsForm({...settingsForm, accountOwner: e.target.value.toUpperCase()})}
                                         required
                                       />
                                   </div>
                                  <div className="md:col-span-2 flex items-center gap-3">
                                      <input id="requireRideApproval" type="checkbox" className="h-4 w-4" checked={!!settingsForm.requireRideApproval} onChange={(e) => setSettingsForm({...settingsForm, requireRideApproval: e.target.checked})} />
                                      <label htmlFor="requireRideApproval" className="text-sm text-gray-700">Bật tính năng duyệt chuyến bởi Admin (chuyến do tài xế tạo sẽ chờ duyệt)</label>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">Phần trăm phí nền tảng mặc định</label>
                                      <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-32 border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                            value={(settingsForm.defaultPlatformFeePercent || 0) * 100}
                                            onChange={e => setSettingsForm({...settingsForm, defaultPlatformFeePercent: Number(e.target.value) / 100})}
                                          />
                                          <span className="text-sm text-gray-600">%</span>
                                      </div>
                                      <p className="text-xs text-gray-500 mt-1">Ví dụ: nhập <strong>1</strong> để đặt 1% phí mặc định.</p>
                                  </div>
                               </div>

                               <div className="flex justify-end">
                                   <button 
                                     type="submit" 
                                     className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700"
                                   >
                                       <Save size={18} /> Lưu cấu hình
                                   </button>
                               </div>
                           </form>
                       </div>
                   </div>

                   {/* Preview QR */}
                   <div>
                       <h2 className="text-xl font-bold text-gray-800 mb-6">Xem trước Mã QR</h2>
                       <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col items-center text-center">
                           <div className="bg-white border-2 border-gray-200 rounded-lg p-2 mb-4">
                               <img 
                                 src={previewQrLink} 
                                 alt="QR Preview" 
                                 className="w-48 h-48 object-contain"
                                 onError={(e) => {
                                     // Fallback if VietQR fails loading
                                     (e.target as HTMLImageElement).src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(settingsForm.accountNumber)}`;
                                 }}
                               />
                           </div>
                           <p className="font-bold text-gray-900">{settingsForm.bankName}</p>
                           <p className="text-gray-600 text-sm">{settingsForm.accountNumber}</p>
                           <p className="text-gray-800 font-bold uppercase text-sm mt-1">{settingsForm.accountOwner}</p>
                           
                           <div className="mt-4 bg-yellow-50 text-yellow-800 p-3 rounded text-xs text-left w-full">
                               Lưu ý: Mã QR này sẽ được hiển thị cho tất cả tài xế khi họ thực hiện nạp tiền. Hãy đảm bảo thông tin chính xác.
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {/* Admin Wallet Update Modal */}
           {selectedUser && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                   <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setSelectedUser(null)}></div>
                   <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
                       <div className="bg-slate-700 px-6 py-4 text-white">
                           <h3 className="text-lg font-bold">Điều chỉnh ví: {selectedUser.name}</h3>
                           <p className="text-sm opacity-80">Số dư hiện tại: {selectedUser.walletBalance.toLocaleString('vi-VN')}đ</p>
                       </div>
                       <form onSubmit={handleWalletUpdate} className="p-6">
                           <div className="mb-4">
                               <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền (VNĐ)</label>
                               <input 
                                 type="number" 
                                 className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                 placeholder="Nhập số âm để trừ, số dương để cộng"
                                 value={amount}
                                 onChange={(e) => setAmount(e.target.value)}
                                 required
                               />
                               <p className="text-xs text-gray-500 mt-1">VD: 100000 (Cộng thêm) hoặc -50000 (Trừ đi)</p>
                           </div>
                           <div className="mb-6">
                               <label className="block text-sm font-medium text-gray-700 mb-1">Lý do / Nội dung</label>
                               <input 
                                 type="text" 
                                 className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                                 placeholder="VD: Thưởng doanh số, Phạt vi phạm..."
                                 value={description}
                                 onChange={(e) => setDescription(e.target.value)}
                                 required
                               />
                           </div>
                           <div className="flex gap-3">
                               <button 
                                 type="button" 
                                 onClick={() => setSelectedUser(null)}
                                 className="flex-1 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded"
                               >
                                   Hủy
                               </button>
                               <button 
                                 type="submit" 
                                 className="flex-1 py-2 bg-slate-800 text-white font-bold rounded hover:bg-slate-900"
                               >
                                   Xác nhận
                               </button>
                           </div>
                       </form>
                   </div>
               </div>
           )}

       </div>
    </div>
  );
};
