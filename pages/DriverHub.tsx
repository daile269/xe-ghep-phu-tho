

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, Car, ClipboardList, ArrowRight, Shield, CheckCircle, Wallet, UserPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DriverStatus } from '../types';

export const DriverHub: React.FC = () => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
       navigate('/login');
       return;
    }
    // Auth Guard: Check Driver Status
    if (currentUser.driverStatus !== DriverStatus.APPROVED) {
        navigate('/driver-register');
    }
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.driverStatus !== DriverStatus.APPROVED) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Trung tâm Tài xế
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Quản lý chuyến đi, thu nhập và kết nối cộng đồng tài xế.
        </p>
      </div>

      {/* Wallet Summary Card */}
      <div className="max-w-5xl mx-auto mb-10 bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl shadow-xl text-white p-6 flex flex-col md:flex-row items-center justify-between cursor-pointer transform hover:scale-[1.01] transition-all"
           onClick={() => navigate('/wallet')}>
           <div className="flex items-center mb-4 md:mb-0">
               <div className="bg-white/10 p-4 rounded-full mr-5">
                   <Wallet className="h-10 w-10 text-yellow-400" />
               </div>
               <div>
                   <h2 className="text-lg font-medium text-blue-200">Số dư ví của bạn</h2>
                   <p className="text-4xl font-bold">{currentUser.walletBalance.toLocaleString('vi-VN')}đ</p>
               </div>
           </div>
           <button className="bg-white text-blue-900 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 shadow-md">
               Quản lý Ví & Nạp tiền
           </button>
      </div>

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
        
        {/* Card 1: Đăng chuyến */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
             onClick={() => navigate('/post')}>
           <div className="bg-blue-600 p-4">
              <PlusCircle className="text-white h-8 w-8 mb-2" />
              <h2 className="text-xl font-bold text-white">Đăng chuyến đi</h2>
              <p className="text-blue-100 text-sm">Bạn có xe và lịch trình sẵn</p>
           </div>
           <div className="p-6 flex-grow">
              <p className="text-gray-600 text-sm mb-4">
                 Đăng lịch trình để khách hàng tìm thấy và đặt chỗ.
              </p>
              <span className="inline-flex items-center font-bold text-blue-600 text-sm group-hover:underline">
                 Tạo chuyến ngay <ArrowRight className="ml-1 h-4 w-4" />
              </span>
           </div>
        </div>

        {/* Card 2: Tìm khách */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
             onClick={() => navigate('/find-passengers')}>
           <div className="bg-green-600 p-4">
              <Users className="text-white h-8 w-8 mb-2" />
              <h2 className="text-xl font-bold text-white">Tìm khách chờ</h2>
              <p className="text-green-100 text-sm">Nhận khách lẻ hoặc tiện chuyến</p>
           </div>
           <div className="p-6 flex-grow">
              <p className="text-gray-600 text-sm mb-4">
                 Xem danh sách khách hàng đang tìm xe và nhận chuyến.
              </p>
              <span className="inline-flex items-center font-bold text-green-600 text-sm group-hover:underline">
                 Xem danh sách <ArrowRight className="ml-1 h-4 w-4" />
              </span>
           </div>
        </div>

        {/* Card 3: Bắn khách (New) */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col"
             onClick={() => navigate('/refer-passenger')}>
           <div className="bg-purple-600 p-4">
              <UserPlus className="text-white h-8 w-8 mb-2" />
              <h2 className="text-xl font-bold text-white">Bắn khách</h2>
              <p className="text-purple-100 text-sm">Chuyển khách & Nhận hoa hồng</p>
           </div>
           <div className="p-6 flex-grow">
              <p className="text-gray-600 text-sm mb-4">
                 Bạn có khách nhưng không chở được? Chuyển cho đồng nghiệp và nhận phí.
              </p>
              <span className="inline-flex items-center font-bold text-purple-600 text-sm group-hover:underline">
                 Đăng tin bắn khách <ArrowRight className="ml-1 h-4 w-4" />
              </span>
           </div>
        </div>
      </div>

      {/* Dashboard Link */}
      <div className="text-center">
         <button 
           onClick={() => navigate('/dashboard', { state: { defaultTab: 'rides' } })}
           className="inline-flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors"
         >
           <ClipboardList className="mr-2 h-5 w-5" />
           Vào trang quản lý hoạt động chi tiết
         </button>
      </div>
    </div>
  );
};