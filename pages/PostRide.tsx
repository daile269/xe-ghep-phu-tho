

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Car, MapPin, Calendar, DollarSign, Users, AlertCircle, Briefcase } from 'lucide-react';
import { RideType, DriverStatus } from '../types';

export const PostRide: React.FC = () => {
  const { currentUser, createRide } = useApp();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.driverStatus !== DriverStatus.APPROVED) {
      navigate('/driver-register');
    }
  }, [currentUser, navigate]);

  const [formData, setFormData] = useState({
    origin: 'Phú Thọ',
    destination: 'Hà Nội',
    departureTime: '',
    price: 150000,
    seatsTotal: 4,
    carModel: currentUser?.carModel || '',
    licensePlate: currentUser?.licensePlate || '',
    description: '',
    rideType: RideType.SHARE
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!formData.departureTime || !formData.carModel || !formData.licensePlate) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    createRide({
      ...formData,
      price: Number(formData.price),
      seatsTotal: Number(formData.seatsTotal)
    });

    navigate('/dashboard'); // Redirect to my rides
  };

  if (!currentUser || currentUser.driverStatus !== DriverStatus.APPROVED) {
    return null; 
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Car className="mr-2" /> Đăng chuyến đi mới
          </h2>
          <p className="text-blue-100 text-sm mt-1">Chia sẻ hành trình, giảm chi phí</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Ride Type Selection */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <label className="block text-sm font-medium text-gray-700 mb-3">Loại chuyến xe</label>
             <div className="flex space-x-6">
                <label className="flex items-center cursor-pointer">
                   <input 
                      type="radio" 
                      name="rideType" 
                      value={RideType.SHARE}
                      checked={formData.rideType === RideType.SHARE}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                   />
                   <span className="ml-2 block text-sm font-medium text-gray-700">Đi ghép (Tính theo ghế)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                   <input 
                      type="radio" 
                      name="rideType" 
                      value={RideType.CHARTER}
                      checked={formData.rideType === RideType.CHARTER}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                   />
                   <span className="ml-2 block text-sm font-medium text-gray-700">Bao xe (Trọn gói)</span>
                </label>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Origin & Destination */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đi</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="origin"
                  value={formData.origin}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                >
                   <option value="Phú Thọ">Phú Thọ</option>
                   <option value="Hà Nội">Hà Nội</option>
                   <option value="Việt Trì">Việt Trì</option>
                   <option value="Thị xã Phú Thọ">Thị xã Phú Thọ</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Điểm đến</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                >
                   <option value="Hà Nội">Hà Nội</option>
                   <option value="Phú Thọ">Phú Thọ</option>
                   <option value="Việt Trì">Việt Trì</option>
                </select>
              </div>
            </div>

            {/* Time & Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian xuất phát</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="datetime-local"
                  name="departureTime"
                  value={formData.departureTime}
                  onChange={handleChange}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                 {formData.rideType === RideType.CHARTER ? 'Giá trọn gói (VNĐ)' : 'Giá mỗi ghế (VNĐ)'}
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>

            {/* Car Info */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại xe (VD: Kia Morning)</label>
              <input
                type="text"
                name="carModel"
                value={formData.carModel}
                onChange={handleChange}
                placeholder="Kia Morning, Vios..."
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Biển số xe</label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleChange}
                placeholder="19A-123.45"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                required
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.rideType === RideType.CHARTER ? 'Sức chứa (số khách)' : 'Tổng số ghế'}
               </label>
               <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="seatsTotal"
                  value={formData.seatsTotal}
                  onChange={handleChange}
                  min="1"
                  max="50"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả thêm (Điểm đón cụ thể, lưu ý...)</label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
              placeholder={formData.rideType === RideType.CHARTER ? "Ví dụ: Bao xe 2 chiều, đi sân bay..." : "Ví dụ: Đón tại bến xe Việt Trì, không hút thuốc..."}
            />
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/driver')}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Đăng chuyến
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};