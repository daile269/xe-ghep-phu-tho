import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Shield, Car, AlertTriangle, FileText, Clock, XCircle, RefreshCw } from 'lucide-react';
import { DriverStatus } from '../types';

export const DriverRegistration: React.FC = () => {
  const { currentUser, registerDriver, refreshUserData } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    carModel: '',
    licensePlate: '',
    licenseNumber: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.driverStatus === DriverStatus.APPROVED) {
      navigate('/driver');
    }
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.carModel && formData.licensePlate && formData.licenseNumber) {
        registerDriver(formData.carModel, formData.licensePlate, formData.licenseNumber);
    }
  };

  const handleRefreshStatus = () => {
      refreshUserData();
      // Check immediately after update if status changed, though useEffect will handle redirect
      if (currentUser?.driverStatus === DriverStatus.PENDING) {
          alert("Hệ thống đã cập nhật. Trạng thái vẫn là: Đang chờ duyệt.\nVui lòng chờ thêm hoặc liên hệ Admin.");
      }
  };

  if (!currentUser) return null;

  // View: Pending Approval
  if (currentUser.driverStatus === DriverStatus.PENDING) {
      return (
          <div className="max-w-2xl mx-auto px-4 py-12">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                  <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-6">
                      <Clock className="h-10 w-10 text-yellow-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Đang chờ duyệt hồ sơ</h2>
                  <p className="text-gray-600 mb-8">
                      Hồ sơ đăng ký tài xế của bạn đã được gửi và đang chờ Admin xét duyệt. 
                      Quá trình này thường mất từ 1-24 giờ làm việc.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 text-left mb-8">
                      <h3 className="font-bold text-gray-900 mb-4">Thông tin đã gửi:</h3>
                      <ul className="space-y-3">
                          <li className="flex justify-between">
                              <span className="text-gray-500">Họ và tên:</span>
                              <span className="font-medium">{currentUser.name}</span>
                          </li>
                          <li className="flex justify-between">
                              <span className="text-gray-500">Số điện thoại:</span>
                              <span className="font-medium">{currentUser.phone}</span>
                          </li>
                          <li className="flex justify-between">
                              <span className="text-gray-500">Loại xe:</span>
                              <span className="font-medium">{currentUser.carModel}</span>
                          </li>
                          <li className="flex justify-between">
                              <span className="text-gray-500">Biển số:</span>
                              <span className="font-medium">{currentUser.licensePlate}</span>
                          </li>
                      </ul>
                  </div>

                  <div className="border-t border-gray-200 pt-6 flex gap-4 justify-center">
                      <button 
                        type="button"
                        onClick={() => navigate('/')}
                        className="text-blue-600 font-medium hover:text-blue-800"
                      >
                          Quay về trang chủ
                      </button>
                      
                      <button 
                        type="button"
                        onClick={handleRefreshStatus}
                        className="flex items-center text-green-600 font-bold hover:text-green-800"
                      >
                          <RefreshCw size={16} className="mr-1" /> Làm mới trạng thái
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  // View: Rejected
  if (currentUser.driverStatus === DriverStatus.REJECTED) {
      return (
          <div className="max-w-md mx-auto px-4 py-12 text-center">
             <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
             <h2 className="text-2xl font-bold text-gray-900">Đăng ký bị từ chối</h2>
             <p className="text-gray-600 mt-2">Vui lòng liên hệ bộ phận hỗ trợ để biết thêm chi tiết.</p>
          </div>
      );
  }

  // View: Registration Form
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-800 px-6 py-6 text-center">
          <Shield className="h-12 w-12 text-blue-300 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Đăng ký Đối tác Tài xế</h1>
          <p className="text-blue-200 mt-2">Gửi thông tin để xác thực và bắt đầu nhận chuyến</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
           <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                 <AlertTriangle className="h-5 w-5 text-yellow-500" />
                 <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                       Vui lòng cung cấp thông tin chính xác. Hồ sơ sẽ được kiểm duyệt thủ công bởi Admin.
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin phương tiện</h3>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe</label>
                 <div className="relative">
                    <Car className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="carModel"
                      required
                      placeholder="Ví dụ: Toyota Vios 2022, Kia Carnival..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      value={formData.carModel}
                      onChange={handleChange}
                    />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
                 <div className="relative">
                    <div className="absolute top-2.5 left-3 h-5 w-5 flex items-center justify-center font-bold text-gray-400 border-2 border-gray-300 rounded text-[10px]">19</div>
                    <input 
                      type="text" 
                      name="licensePlate"
                      required
                      placeholder="19A-123.45"
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      value={formData.licensePlate}
                      onChange={handleChange}
                    />
                 </div>
              </div>
           </div>

           <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Thông tin định danh</h3>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Số bằng lái xe (GPLX)</label>
                 <div className="relative">
                    <FileText className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                    <input 
                      type="text" 
                      name="licenseNumber"
                      required
                      placeholder="Nhập số GPLX..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                    />
                 </div>
              </div>
           </div>

           <div className="pt-6">
              <button 
                type="submit" 
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                 Gửi hồ sơ đăng ký
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                 Bằng việc gửi hồ sơ, bạn đồng ý với các Điều khoản và Chính sách của chúng tôi.
              </p>
           </div>
        </form>
      </div>
    </div>
  );
};