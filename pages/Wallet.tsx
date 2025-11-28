

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { DriverStatus, TransactionStatus, TransactionType } from '../types';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Wallet as WalletIcon, Clock, DollarSign, Plus, MinusCircle, QrCode, Copy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Wallet: React.FC = () => {
  const { currentUser, transactions, topUpWallet, withdrawWallet, systemSettings } = useApp();
  const navigate = useNavigate();
  
  // Modals state
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  
  // Inputs
  const [topUpAmount, setTopUpAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({
      bankName: '',
      accountNumber: '',
      accountName: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.driverStatus !== DriverStatus.APPROVED) {
      navigate('/driver-register');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const myTransactions = transactions
    .filter(t => t.userId === currentUser.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleTopUp = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = Number(topUpAmount);
      if (amount > 0) {
          topUpWallet(amount);
          setShowTopUpModal(false);
          setTopUpAmount('');
          alert(`Đã gửi yêu cầu nạp tiền!\nHệ thống sẽ cộng ${amount.toLocaleString('vi-VN')}đ vào ví sau khi Admin xác nhận.`);
      }
  };

  const handleWithdraw = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = Number(withdrawAmount);
      if (amount <= 0) return;
      if (amount > currentUser.walletBalance) {
          alert('Số dư không đủ!');
          return;
      }
      
      const bankDetails = `${bankInfo.bankName} - ${bankInfo.accountNumber} - ${bankInfo.accountName}`;
      withdrawWallet(amount, bankDetails);
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      setBankInfo({ bankName: '', accountNumber: '', accountName: '' });
      alert(`Đã gửi yêu cầu rút ${amount.toLocaleString('vi-VN')}đ!\nSố tiền đã được tạm trừ. Admin sẽ xử lý trong 2-4h làm việc.`);
  };

  const getStatusIcon = (status: TransactionStatus) => {
      switch (status) {
          case TransactionStatus.COMPLETED: return <CheckCircle size={14} className="text-green-600" />;
          case TransactionStatus.REJECTED: return <XCircle size={14} className="text-red-600" />;
          case TransactionStatus.PENDING: return <Clock size={14} className="text-yellow-600" />;
          default: return null;
      }
  };

  const getStatusText = (status: TransactionStatus) => {
      switch (status) {
          case TransactionStatus.COMPLETED: return 'Thành công';
          case TransactionStatus.REJECTED: return 'Từ chối/Hủy';
          case TransactionStatus.PENDING: return 'Đang xử lý';
          default: return '';
      }
  };

  const getStatusColor = (status: TransactionStatus) => {
      switch (status) {
          case TransactionStatus.COMPLETED: return 'bg-green-100 text-green-800';
          case TransactionStatus.REJECTED: return 'bg-red-100 text-red-800';
          case TransactionStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
      }
  };

  const transferSyntax = `NAP ${currentUser.phone?.replace(/\s/g, '')}`;
  
  // Generate Dynamic QR Code URL using VietQR API
  const qrAmount = topUpAmount ? Number(topUpAmount) : 0;
  const qrUrl = `https://img.vietqr.io/image/${systemSettings.bankId}-${systemSettings.accountNumber}-compact.png?amount=${qrAmount}&addInfo=${encodeURIComponent(transferSyntax)}&accountName=${encodeURIComponent(systemSettings.accountOwner)}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl shadow-xl overflow-hidden text-white mb-8">
        <div className="p-8">
           <div className="flex items-center justify-between mb-8">
               <div className="flex items-center">
                   <div className="bg-white/20 p-3 rounded-full mr-4">
                       <WalletIcon className="h-8 w-8 text-white" />
                   </div>
                   <div>
                       <h1 className="text-2xl font-bold">Ví Tài Xế</h1>
                       <p className="text-blue-100">Quản lý thu nhập và chi phí</p>
                   </div>
               </div>
               <div className="flex gap-2">
                   <button 
                     onClick={() => setShowWithdrawModal(true)}
                     className="bg-white/20 text-white px-5 py-2 rounded-full font-bold shadow-sm hover:bg-white/30 flex items-center transition-all"
                   >
                       <MinusCircle size={20} className="mr-1" /> Rút tiền
                   </button>
                   <button 
                     onClick={() => setShowTopUpModal(true)}
                     className="bg-white text-blue-700 px-5 py-2 rounded-full font-bold shadow-md hover:bg-blue-50 flex items-center transition-all"
                   >
                       <Plus size={20} className="mr-1" /> Nạp tiền
                   </button>
               </div>
           </div>
           
           <div className="flex flex-col md:flex-row justify-between items-end">
               <div>
                   <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">Số dư hiện tại</p>
                   <p className="text-5xl font-bold">{currentUser.walletBalance.toLocaleString('vi-VN')}đ</p>
               </div>
               <div className="mt-4 md:mt-0 text-right">
                   <p className="text-sm text-blue-100 opacity-80">
                       ID Ví: {currentUser.id.toUpperCase()}
                   </p>
               </div>
           </div>
        </div>
        <div className="bg-blue-900/30 px-8 py-3 flex items-center text-sm font-medium text-blue-100">
            <CreditCard size={16} className="mr-2" />
            Tài khoản hoạt động bình thường
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
             <h2 className="font-bold text-gray-800 flex items-center">
                 <Clock size={18} className="mr-2 text-gray-500" /> Lịch sử giao dịch
             </h2>
             <span className="text-xs text-gray-500">{myTransactions.length} giao dịch gần đây</span>
         </div>
         
         <div className="divide-y divide-gray-100">
             {myTransactions.length === 0 ? (
                 <div className="p-12 text-center text-gray-500">
                     Chưa có giao dịch nào.
                 </div>
             ) : (
                 myTransactions.map(t => (
                     <div key={t.id} className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                         <div className="flex items-center">
                             <div className={`p-2 rounded-full mr-4 ${
                                 t.type === TransactionType.TOPUP || t.type === TransactionType.COMMISSION_RECEIVED 
                                 ? 'bg-green-100 text-green-600' 
                                 : 'bg-red-100 text-red-600'
                             }`}>
                                 {t.type === TransactionType.TOPUP || t.type === TransactionType.COMMISSION_RECEIVED 
                                    ? <ArrowDownLeft size={20} /> 
                                    : <ArrowUpRight size={20} />
                                 }
                             </div>
                             <div>
                                 <p className="font-bold text-gray-900">{t.description}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                     <p className="text-xs text-gray-500">
                                         {format(new Date(t.createdAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                                     </p>
                                     <span className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 ${getStatusColor(t.status || TransactionStatus.COMPLETED)}`}>
                                         {getStatusIcon(t.status || TransactionStatus.COMPLETED)}
                                         {getStatusText(t.status || TransactionStatus.COMPLETED)}
                                     </span>
                                 </div>
                                 {t.transferContent && (
                                     <p className="text-xs text-blue-500 mt-1 font-mono bg-blue-50 inline-block px-1 rounded">
                                         Mã: {t.transferContent}
                                     </p>
                                 )}
                             </div>
                         </div>
                         <div className={`text-right font-bold ${
                             t.amount > 0 ? 'text-green-600' : 'text-red-600'
                         }`}>
                             {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString('vi-VN')}đ
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* Top Up Modal */}
      {showTopUpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowTopUpModal(false)}></div>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
                  <div className="bg-blue-600 px-6 py-4 text-white">
                      <h3 className="text-lg font-bold">Nạp tiền qua QR</h3>
                  </div>
                  <form onSubmit={handleTopUp} className="p-6">
                      <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nhập số tiền cần nạp (VNĐ)</label>
                          <div className="relative">
                              <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                              <input 
                                type="number" 
                                className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold text-lg"
                                placeholder="100.000"
                                value={topUpAmount}
                                onChange={(e) => setTopUpAmount(e.target.value)}
                                min="10000"
                                step="10000"
                                required
                                autoFocus
                              />
                          </div>
                      </div>

                      {/* Dynamic QR Section */}
                      <div className="flex flex-col items-center mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                           <div className="bg-white p-2 border border-gray-200 rounded-lg shadow-sm mb-3">
                                {topUpAmount ? (
                                    <img src={qrUrl} alt="QR Code" className="w-40 h-40 object-contain" />
                                ) : (
                                    <div className="w-40 h-40 flex items-center justify-center bg-gray-100 text-gray-400">
                                        <QrCode size={48} />
                                        <span className="text-xs absolute mt-16">Nhập tiền để hiện QR</span>
                                    </div>
                                )}
                           </div>
                           <p className="text-sm font-medium text-gray-600 text-center">Quét mã để chuyển khoản</p>
                           
                           <div className="bg-white border border-gray-200 p-3 rounded-lg w-full mt-3 text-sm shadow-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Ngân hàng:</span>
                                    <span className="font-bold">{systemSettings.bankName}</span>
                                </div>
                                <div className="flex justify-between mb-1">
                                    <span className="text-gray-500">Số TK:</span>
                                    <span className="font-bold flex items-center cursor-pointer hover:text-blue-600">
                                        {systemSettings.accountNumber}
                                    </span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-500">Chủ TK:</span>
                                    <span className="font-bold uppercase">{systemSettings.accountOwner}</span>
                                </div>
                                <div className="bg-blue-100 p-2 rounded border border-blue-200 mt-2">
                                    <span className="block text-xs text-blue-600 mb-1">Nội dung chuyển khoản (Bắt buộc):</span>
                                    <span className="font-bold font-mono text-lg text-blue-800 break-all">{transferSyntax}</span>
                                </div>
                           </div>
                      </div>

                      <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowTopUpModal(false)}
                            className="flex-1 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                          >
                              Hủy bỏ
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md"
                          >
                              Xác nhận đã chuyển
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowWithdrawModal(false)}></div>
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
                  <div className="bg-red-600 px-6 py-4 text-white">
                      <h3 className="text-lg font-bold">Yêu cầu Rút tiền</h3>
                  </div>
                  <form onSubmit={handleWithdraw} className="p-6">
                      <div className="bg-yellow-50 p-3 rounded-lg mb-4 text-xs text-yellow-800 flex items-start">
                          <AlertCircle size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                          <span>Lưu ý: Số tiền sẽ được tạm trừ khỏi ví ngay khi gửi yêu cầu. Nếu Admin từ chối, tiền sẽ được hoàn lại.</span>
                      </div>

                      <div className="space-y-4 mb-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Số tiền muốn rút (VNĐ)</label>
                              <div className="relative">
                                  <DollarSign className="absolute top-3 left-3 text-gray-400" size={20} />
                                  <input 
                                    type="number" 
                                    className="pl-10 w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:outline-none font-bold text-lg"
                                    value={withdrawAmount}
                                    onChange={(e) => setWithdrawAmount(e.target.value)}
                                    min="50000"
                                    step="1000"
                                    required
                                    placeholder="Tối thiểu 50.000đ"
                                  />
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Số dư khả dụng: {currentUser.walletBalance.toLocaleString('vi-VN')}đ</p>
                          </div>
                          
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                              <p className="text-sm font-bold text-gray-800 border-b border-gray-200 pb-2">Thông tin nhận tiền</p>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500">Ngân hàng</label>
                                  <input 
                                    type="text"
                                    required
                                    className="w-full bg-white border border-gray-300 rounded p-2 text-sm mt-1"
                                    placeholder="VD: Vietcombank, Techcombank..."
                                    value={bankInfo.bankName}
                                    onChange={(e) => setBankInfo({...bankInfo, bankName: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500">Số tài khoản</label>
                                  <input 
                                    type="text"
                                    required
                                    className="w-full bg-white border border-gray-300 rounded p-2 text-sm mt-1"
                                    placeholder="Số tài khoản..."
                                    value={bankInfo.accountNumber}
                                    onChange={(e) => setBankInfo({...bankInfo, accountNumber: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-medium text-gray-500">Tên chủ tài khoản</label>
                                  <input 
                                    type="text"
                                    required
                                    className="w-full bg-white border border-gray-300 rounded p-2 text-sm mt-1 uppercase"
                                    placeholder="NGUYEN VAN A"
                                    value={bankInfo.accountName}
                                    onChange={(e) => setBankInfo({...bankInfo, accountName: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-3">
                          <button 
                            type="button" 
                            onClick={() => setShowWithdrawModal(false)}
                            className="flex-1 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg"
                          >
                              Hủy bỏ
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md"
                          >
                              Gửi yêu cầu
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};