
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { MapPin, Calendar, DollarSign, Crosshair, Box, Car, Users, ClipboardList } from 'lucide-react';
import { RideType } from '../types';

export const BookRide: React.FC = () => {
  const { currentUser, createRideRequest } = useApp();
  const navigate = useNavigate();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    pickupTime: '',
    priceOffered: '',
    rideType: RideType.SHARE,
    seatsNeeded: 1, // Default 1 passenger for SHARE, or reused for Charter (4 or 7)
    note: ''
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt của bạn không hỗ trợ định vị.');
      return;
    }
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLoadingLocation(false);
        // Trong thực tế, cần gọi API Geocoding để chuyển tọa độ thành địa chỉ.
        // Ở đây ta hiển thị tọa độ mô phỏng.
        const coords = `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        setFormData(prev => ({ ...prev, origin: `Vị trí hiện tại (${coords})` }));
      },
      (error) => {
        setIsLoadingLocation(false);
        alert('Không thể lấy vị trí. Vui lòng bật GPS hoặc nhập tay.');
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRideTypeChange = (type: RideType) => {
    setFormData(prev => ({ 
        ...prev, 
        rideType: type,
        seatsNeeded: type === RideType.CHARTER ? 4 : 1 // Reset seats: 4 if Charter, 1 if Share
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!formData.origin || !formData.destination || !formData.pickupTime) {
      alert('Vui lòng điền đầy đủ điểm đón, điểm đến và thời gian.');
      return;
    }

    const requestData: any = {
      origin: formData.origin,
      destination: formData.destination,
      pickupTime: formData.pickupTime,
      priceOffered: formData.priceOffered ? Number(formData.priceOffered) : 0,
      rideType: formData.rideType,
      note: formData.note,
      passengerName: currentUser.name || "Khách hàng",
      passengerPhone: currentUser.phone
    };

    // Only add seatsNeeded if not DELIVERY type
    if (formData.rideType !== RideType.DELIVERY) {
      requestData.seatsNeeded = formData.seatsNeeded;
    }

    createRideRequest(requestData);

    alert('Đã gửi yêu cầu đặt xe! Admin sẽ duyệt và yêu cầu sẽ hiển thị cho tài xế.');
    navigate('/dashboard'); // Chuyển về trang quản lý để xem yêu cầu vừa tạo
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-green-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <ClipboardList className="mr-2" /> Đặt xe nhanh
          </h2>
          <p className="text-green-100 text-sm mt-1">Gửi yêu cầu để tài xế liên hệ với bạn</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Service Type Selection */}
          <div className="grid grid-cols-3 gap-4">
            <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${formData.rideType === RideType.SHARE ? 'bg-blue-50 border-blue-500 text-blue-700' : 'hover:bg-gray-50 border-gray-200'}`}>
              <input 
                type="radio" 
                name="rideType" 
                value={RideType.SHARE} 
                checked={formData.rideType === RideType.SHARE}
                onChange={() => handleRideTypeChange(RideType.SHARE)}
                className="sr-only"
              />
              <Users size={24} className="mb-2" />
              <span className="text-sm font-medium">Ghép xe</span>
            </label>

            <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${formData.rideType === RideType.CHARTER ? 'bg-purple-50 border-purple-500 text-purple-700' : 'hover:bg-gray-50 border-gray-200'}`}>
              <input 
                type="radio" 
                name="rideType" 
                value={RideType.CHARTER} 
                checked={formData.rideType === RideType.CHARTER}
                onChange={() => handleRideTypeChange(RideType.CHARTER)}
                className="sr-only"
              />
              <Car size={24} className="mb-2" />
              <span className="text-sm font-medium">Bao xe</span>
            </label>

            <label className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center justify-center transition-all ${formData.rideType === RideType.DELIVERY ? 'bg-orange-50 border-orange-500 text-orange-700' : 'hover:bg-gray-50 border-gray-200'}`}>
              <input 
                type="radio" 
                name="rideType" 
                value={RideType.DELIVERY} 
                checked={formData.rideType === RideType.DELIVERY}
                onChange={() => handleRideTypeChange(RideType.DELIVERY)}
                className="sr-only"
              />
              <Box size={24} className="mb-2" />
              <span className="text-sm font-medium">Gửi đồ</span>
            </label>
          </div>

          {/* Additional Options based on Type */}
          {formData.rideType === RideType.SHARE && (
             <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-2">Số lượng khách</label>
                <div className="flex flex-wrap gap-2">
                   {[1, 2, 3, 4, 5, 6].map(num => (
                     <button
                       key={num}
                       type="button"
                       onClick={() => setFormData(prev => ({ ...prev, seatsNeeded: num }))}
                       className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center transition-colors ${
                         formData.seatsNeeded === num 
                           ? 'bg-blue-600 text-white shadow-md' 
                           : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'
                       }`}
                     >
                       {num}
                     </button>
                   ))}
                </div>
             </div>
          )}

          {formData.rideType === RideType.CHARTER && (
             <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <label className="block text-sm font-medium text-purple-800 mb-2">Chọn loại xe</label>
                <div className="flex gap-4">
                   <button
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, seatsNeeded: 4 }))}
                     className={`flex-1 py-3 px-4 rounded-md font-medium text-sm flex items-center justify-center transition-colors ${
                        formData.seatsNeeded === 4
                           ? 'bg-purple-600 text-white shadow-md'
                           : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'
                     }`}
                   >
                     <Car size={18} className="mr-2" /> Xe 4 chỗ
                   </button>
                   <button
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, seatsNeeded: 7 }))}
                     className={`flex-1 py-3 px-4 rounded-md font-medium text-sm flex items-center justify-center transition-colors ${
                        formData.seatsNeeded === 7
                           ? 'bg-purple-600 text-white shadow-md'
                           : 'bg-white text-purple-600 border border-purple-200 hover:bg-purple-100'
                     }`}
                   >
                     <Car size={18} className="mr-2" /> Xe 7 chỗ
                   </button>
                </div>
             </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Origin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đón</label>
              <div className="flex gap-2">
                <div className="relative flex-grow rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="origin"
                    value={formData.origin}
                    onChange={handleChange}
                    placeholder="Nhập địa chỉ đón..."
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  title="Lấy vị trí hiện tại"
                >
                  <Crosshair size={20} className={isLoadingLocation ? "animate-spin text-green-600" : "text-gray-500"} />
                </button>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ đến..."
                  className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  required
                />
              </div>
            </div>

            {/* Time & Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian đón</label>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                    type="datetime-local"
                    name="pickupTime"
                    value={formData.pickupTime}
                    onChange={handleChange}
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    required
                    />
                </div>
                </div>

                <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.rideType === RideType.SHARE ? 'Giá đề xuất (VNĐ)/1 ghế' : 'Giá đề xuất (VNĐ)'}
                </label>
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
                    placeholder="Tùy chọn"
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">Để trống nếu muốn thương lượng</p>
                </div>
            </div>

            {/* Note */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú thêm</label>
                <textarea
                name="note"
                rows={3}
                value={formData.note}
                onChange={handleChange}
                className="shadow-sm focus:ring-green-500 focus:border-green-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder={formData.rideType === RideType.DELIVERY ? "Mô tả hàng hóa, kích thước, khối lượng..." : "Chi tiết hành lý hoặc yêu cầu đặc biệt..."}
                />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Gửi yêu cầu đặt xe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
