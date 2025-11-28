
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, DollarSign, Users, Briefcase, UserPlus, Gift } from 'lucide-react';
import { RideType, DriverStatus } from '../types';

export const ReferPassenger: React.FC = () => {
  const { currentUser, createRideRequest } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupTime: '',
    priceOffered: '',
    referralFee: '',
    passengerName: '',
    passengerPhone: '',
    rideType: RideType.SHARE,
    seatsNeeded: 1,
    note: ''
  });

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.driverStatus !== DriverStatus.APPROVED) {
      navigate('/driver-register');
    }
  }, [currentUser, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!formData.origin || !formData.destination || !formData.pickupTime) {
      alert('Vui lòng điền đầy đủ thông tin chuyến đi.');
      return;
    }

    createRideRequest({
      origin: formData.origin,
      destination: formData.destination,
      pickupTime: formData.pickupTime,
      priceOffered: Number(formData.priceOffered),
      rideType: formData.rideType,
      seatsNeeded: Number(formData.seatsNeeded),
      note: formData.note,
      passengerName: formData.passengerName,
      passengerPhone: formData.passengerPhone,
      referrerId: currentUser.id, // ID của tài xế đang thao tác
      referralFee: Number(formData.referralFee)
    });

    navigate('/dashboard'); 
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-purple-100">
        <div className="bg-purple-700 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <UserPlus className="mr-2" /> Bắn khách / Chuyển khách
          </h2>
          <p className="text-purple-100 text-sm mt-1">
             Đăng thông tin khách hàng bạn không thể chở để nhường cho đồng nghiệp và nhận hoa hồng.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Commission Section - Highlighted */}
          <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
              <h3 className="text-purple-800 font-bold flex items-center mb-3">
                  <Gift size={18} className="mr-2" /> Hoa hồng mong muốn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-purple-900 mb-1">Tiền hoa hồng (VNĐ)</label>
                      <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-purple-500" />
                          </div>
                          <input
                            type="number"
                            name="referralFee"
                            value={formData.referralFee}
                            onChange={handleChange}
                            min="0"
                            step="1000"
                            placeholder="VD: 20000, 50000..."
                            className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 text-lg font-bold text-purple-700 border-gray-300 rounded-md p-2 border"
                            required
                          />
                      </div>
                      <p className="text-xs text-purple-600 mt-1">Số tiền này sẽ được chuyển vào ví của bạn khi tài xế khác hoàn thành chuyến.</p>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giá báo khách (VNĐ)</label>
                      <div className="relative rounded-md shadow-sm">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="number"
                            name="priceOffered"
                            value={formData.priceOffered}
                            onChange={handleChange}
                            min="0"
                            step="1000"
                            placeholder="Tổng tiền thu của khách"
                            className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-10 border-gray-300 rounded-md p-2 border"
                            required
                          />
                      </div>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Passenger Info */}
             <div className="md:col-span-2">
                 <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">Thông tin khách hàng</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách</label>
                         <input
                           type="text"
                           name="passengerName"
                           value={formData.passengerName}
                           onChange={handleChange}
                           className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                           required
                         />
                     </div>
                     <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                         <input
                           type="tel"
                           name="passengerPhone"
                           value={formData.passengerPhone}
                           onChange={handleChange}
                           className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                           required
                         />
                     </div>
                 </div>
             </div>

             {/* Ride Info */}
             <div className="md:col-span-2">
                 <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-200 pb-2 mb-4">Lộ trình & Loại xe</h4>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Loại dịch vụ</label>
                 <select
                    name="rideType"
                    value={formData.rideType}
                    onChange={handleChange}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                 >
                    <option value={RideType.SHARE}>Đi ghép</option>
                    <option value={RideType.CHARTER}>Bao xe</option>
                 </select>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Số khách/Số ghế</label>
                 <input
                    type="number"
                    name="seatsNeeded"
                    value={formData.seatsNeeded}
                    onChange={handleChange}
                    min="1"
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                 />
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đón</label>
                 <div className="relative">
                    <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="origin"
                      value={formData.origin}
                      onChange={handleChange}
                      placeholder="Nhập điểm đón..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      required
                    />
                 </div>
             </div>

             <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
                 <div className="relative">
                    <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="destination"
                      value={formData.destination}
                      onChange={handleChange}
                      placeholder="Nhập điểm đến..."
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      required
                    />
                 </div>
             </div>

             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đón</label>
                <div className="relative">
                    <Calendar className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                    <input
                      type="datetime-local"
                      name="pickupTime"
                      value={formData.pickupTime}
                      onChange={handleChange}
                      className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                      required
                    />
                </div>
             </div>

             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
                <textarea
                  name="note"
                  rows={3}
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="Ghi chú về hành lý, yêu cầu đặc biệt..."
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                />
             </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/driver')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 mr-3"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-bold rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Đăng tin bắn khách
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
