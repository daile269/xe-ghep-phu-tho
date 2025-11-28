

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Clock, MapPin, Car, Shield, CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RideType } from '../types';

export const RideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rides, currentUser, bookRide } = useApp();
  const [seatsToBook, setSeatsToBook] = useState(1);
  
  const ride = rides.find(r => r.id === id);

  if (!ride) {
    return (
        <div className="text-center py-10">
            <p className="text-gray-500 mb-4">Không tìm thấy chuyến xe.</p>
            <button onClick={() => navigate('/find')} className="text-blue-600 underline">Quay lại tìm kiếm</button>
        </div>
    );
  }

  const handleBooking = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (ride.seatsAvailable < seatsToBook) return;
    
    bookRide(ride.id, seatsToBook);
    navigate('/dashboard'); // Go to my bookings
  };

  const isOwnRide = currentUser?.id === ride.driverId;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate(-1)} 
        className="mb-4 flex items-center text-gray-600 hover:text-blue-600 transition-colors font-medium"
      >
        <ArrowLeft size={20} className="mr-1" /> Quay lại
      </button>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
          {ride.rideType === RideType.CHARTER && (
              <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                  Bao xe trọn gói
              </div>
          )}
          {ride.rideType === RideType.SHARE && (
              <div className="absolute top-4 right-4 bg-blue-500 text-white border border-blue-400 px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm">
                  Đi ghép
              </div>
          )}

          <div className="flex justify-between items-start mt-4">
            <div>
              <p className="text-blue-200 text-sm font-medium uppercase tracking-wider mb-1">
                {format(new Date(ride.departureTime), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
              <h1 className="text-3xl font-bold">{format(new Date(ride.departureTime), 'HH:mm', { locale: vi })}</h1>
            </div>
            <div className="text-right mt-6">
              <p className="text-3xl font-bold">{ride.price.toLocaleString('vi-VN')}đ</p>
              <p className="text-blue-200 text-sm">{ride.rideType === RideType.CHARTER ? 'trọn gói' : 'mỗi ghế'}</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-8">
            {/* Route */}
            <div className="relative pl-6 border-l-2 border-gray-200 ml-2 space-y-8">
              <div className="relative">
                <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>
                <p className="text-sm text-gray-500 font-medium">Điểm đi</p>
                <h3 className="text-xl font-bold text-gray-900">{ride.origin}</h3>
              </div>
              <div className="relative">
                <div className="absolute -left-[29px] top-1 h-4 w-4 rounded-full border-4 border-white bg-green-500 shadow-sm"></div>
                <p className="text-sm text-gray-500 font-medium">Điểm đến</p>
                <h3 className="text-xl font-bold text-gray-900">{ride.destination}</h3>
              </div>
            </div>

            <hr />

            {/* Driver Note */}
            <div>
               <h4 className="text-lg font-semibold text-gray-900 mb-2">Thông tin chuyến đi</h4>
               <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                 {ride.description || "Tài xế không để lại ghi chú thêm."}
               </p>
            </div>

            {/* Car Info */}
            <div className="flex items-center gap-4 text-gray-700">
               <Car className="text-blue-600" />
               <span className="font-medium">{ride.carModel}</span>
               <span className="text-gray-400">|</span>
               <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{ride.licensePlate}</span>
            </div>
          </div>

          {/* Sidebar Action */}
          <div className="space-y-6">
            {/* Driver Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <img src={ride.driverAvatar} alt="" className="h-12 w-12 rounded-full" />
                <div>
                  <h3 className="font-bold text-gray-900">{ride.driverName}</h3>
                  <div className="flex items-center text-green-600 text-xs font-medium">
                    <CheckCircle size={12} className="mr-1" /> Đã xác thực
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <Shield size={14} /> Tài xế tin cậy
              </div>
            </div>

            {/* Booking Action */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
               <div className="mb-4">
                 <p className="text-gray-600 mb-1">
                     {ride.rideType === RideType.CHARTER ? 'Tình trạng' : 'Số ghế trống'}
                 </p>
                 <p className="text-2xl font-bold text-gray-900">
                     {ride.rideType === RideType.CHARTER 
                        ? (ride.seatsAvailable > 0 ? 'Sẵn sàng' : 'Đã đặt') 
                        : `${ride.seatsAvailable} ghế`
                     }
                 </p>
               </div>

               {!isOwnRide && ride.seatsAvailable > 0 && (
                 <div className="space-y-4">
                   {ride.rideType === RideType.SHARE ? (
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng đặt</label>
                         <select 
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                            value={seatsToBook}
                            onChange={(e) => setSeatsToBook(Number(e.target.value))}
                         >
                            {[...Array(ride.seatsAvailable)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1} ghế</option>
                            ))}
                         </select>
                       </div>
                   ) : (
                       <div className="bg-yellow-50 text-yellow-800 p-3 rounded text-sm flex items-start border border-yellow-200">
                           <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                           <span>Bạn đang đặt bao trọn gói chuyến xe này.</span>
                       </div>
                   )}

                   <div className="pt-2 border-t border-gray-200 flex justify-between items-center font-bold text-gray-900">
                      <span>Tổng tiền:</span>
                      <span>
                          {(ride.rideType === RideType.CHARTER ? ride.price : ride.price * seatsToBook).toLocaleString('vi-VN')}đ
                      </span>
                   </div>
                   <button 
                    onClick={handleBooking}
                    className="w-full bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 shadow-md transition-all transform hover:-translate-y-0.5"
                   >
                     {ride.rideType === RideType.CHARTER ? 'Liên hệ đặt xe' : 'Đặt chỗ ngay'}
                   </button>
                   <p className="text-xs text-center text-gray-500">Thanh toán trực tiếp cho tài xế</p>
                 </div>
               )}

               {isOwnRide && (
                 <div className="bg-blue-50 text-blue-700 p-3 rounded text-center font-medium border border-blue-200">
                   Đây là chuyến xe của bạn
                 </div>
               )}

               {ride.seatsAvailable === 0 && (
                 <div className="bg-red-50 text-red-700 p-3 rounded text-center font-medium border border-red-200">
                   Đã hết chỗ
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
