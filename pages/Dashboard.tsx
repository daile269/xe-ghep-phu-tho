

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { RideStatus, BookingStatus, RideType, RideRequest } from '../types';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User, Clock, Check, X, Phone, Calendar as CalendarIcon, History, CheckCircle, Car, MapPin, Box, Users, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { currentUser, rides, bookings, rideRequests, confirmBooking, cancelBooking, cancelRide, cancelRideRequest, completeRideRequest, cancelAcceptedRequest } = useApp();
  const [activeTab, setActiveTab] = useState<'bookings' | 'requests' | 'rides' | 'profile'>('bookings');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
     if (!currentUser) {
        navigate('/login');
     }
  }, [currentUser, navigate]);

  // Check if there is a request to switch tab from navigation state
  useEffect(() => {
      const state = location.state as { defaultTab?: string } | null;
      if (state?.defaultTab === 'rides') {
          setActiveTab('rides');
          // Clear state to avoid sticky tab on refresh if desired (optional)
          window.history.replaceState({}, document.title);
      }
  }, [location]);

  if (!currentUser) return null;

  // Derived Data
  const myBookings = bookings.filter(b => b.passengerId === currentUser.id);
  const myRides = rides.filter(r => r.driverId === currentUser.id);
  const myRequests = rideRequests.filter(req => req.passengerId === currentUser.id);
  
  // Get bookings for rides I am driving
  const bookingsOnMyRides = bookings.filter(b => myRides.some(r => r.id === b.rideId));

  // Get requests accepted by me (as a driver)
  const requestsAcceptedByMe = rideRequests.filter(req => req.driverId === currentUser.id);
  
  // Driver: Split accepted requests into Active and Completed/Cancelled
  const activeAcceptedRequests = requestsAcceptedByMe.filter(req => req.status === 'ACCEPTED');
  // Include CANCELLED here so driver sees if a passenger cancelled
  const historyAcceptedRequests = requestsAcceptedByMe.filter(req => req.status === 'COMPLETED' || req.status === 'CANCELLED');

  // Split bookings into Upcoming and History
  const now = new Date();
  
  const upcomingBookings = myBookings.filter(b => {
     const ride = rides.find(r => r.id === b.rideId);
     return ride && new Date(ride.departureTime) > now && b.status !== BookingStatus.CANCELLED;
  }).sort((a,b) => {
     const rA = rides.find(r => r.id === a.rideId);
     const rB = rides.find(r => r.id === b.rideId);
     return (rA && rB) ? new Date(rA.departureTime).getTime() - new Date(rB.departureTime).getTime() : 0;
  });

  const pastBookings = myBookings.filter(b => {
     const ride = rides.find(r => r.id === b.rideId);
     return !ride || new Date(ride.departureTime) <= now || b.status === BookingStatus.CANCELLED;
  });

  const handlePassengerCancelRequest = (requestId: string, isAccepted: boolean) => {
      if (isAccepted) {
          if (window.confirm('Tài xế đã nhận chuyến này. Bạn có chắc chắn muốn hủy không?')) {
              cancelRideRequest(requestId);
          }
      } else {
          if (window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này?')) {
              cancelRideRequest(requestId);
          }
      }
  };

  const getRideTypeLabel = (type: RideType) => {
      switch (type) {
          case RideType.SHARE: return 'Đi ghép';
          case RideType.CHARTER: return 'Bao xe';
          case RideType.DELIVERY: return 'Gửi đồ';
          default: return type;
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-24">
            <div className="flex items-center space-x-3 mb-6 p-2">
              <img src={currentUser.avatar} alt="" className="h-12 w-12 rounded-full" />
              <div>
                <p className="font-medium text-gray-900">{currentUser.name || "Người dùng"}</p>
                <p className="text-sm text-gray-500">{currentUser.phone}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('bookings')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <CalendarIcon className="mr-3 h-5 w-5" />
                Chuyến sắp đi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'requests' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Clock className="mr-3 h-5 w-5" />
                Yêu cầu của tôi
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('rides')}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'rides' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <Car className="mr-3 h-5 w-5" />
                Dành cho Tài xế
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          
          {/* TAB: BOOKINGS (Vé xe) */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
               <h2 className="text-2xl font-bold text-gray-900">Chuyến đi của tôi</h2>
               
               {/* Upcoming */}
               <div className="space-y-4">
                  <h3 className="font-medium text-gray-500 uppercase text-xs tracking-wider flex items-center">
                      <Clock size={14} className="mr-1" /> Sắp khởi hành
                  </h3>
                  {upcomingBookings.length === 0 ? (
                      <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-dashed border-gray-300">
                          <p className="text-gray-500">Bạn chưa có chuyến đi nào sắp tới.</p>
                          <button onClick={() => navigate('/find')} className="mt-4 text-blue-600 hover:text-blue-500 font-medium">Tìm chuyến xe ngay</button>
                      </div>
                  ) : (
                      upcomingBookings.map(booking => {
                          const ride = rides.find(r => r.id === booking.rideId);
                          if (!ride) return null;
                          return (
                              <div key={booking.id} className="bg-white rounded-xl shadow-sm border-l-4 border-blue-600 p-5 hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start">
                                      <div>
                                          <div className="flex items-center text-lg font-bold text-gray-900 gap-2">
                                              {ride.origin} <span className="text-gray-400">→</span> {ride.destination}
                                          </div>
                                          <p className="text-blue-600 font-medium mt-1">
                                              {format(new Date(ride.departureTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                                          </p>
                                          <p className="text-sm text-gray-500 mt-1">{ride.carModel} • {ride.licensePlate}</p>
                                      </div>
                                      <div className="text-right">
                                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                              {booking.status === BookingStatus.CONFIRMED ? 'Đã xác nhận' : 'Chờ xác nhận'}
                                          </span>
                                          <p className="mt-2 font-bold text-gray-900">{booking.totalPrice.toLocaleString('vi-VN')}đ</p>
                                      </div>
                                  </div>
                                  
                                  {/* Driver Contact Info - Only if Confirmed */}
                                  {booking.status === BookingStatus.CONFIRMED && ride.driverPhone && (
                                      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                              <img src={ride.driverAvatar} alt="Driver" className="w-10 h-10 rounded-full" />
                                              <div>
                                                  <p className="text-xs text-gray-500 uppercase font-bold">Tài xế</p>
                                                  <p className="text-sm font-bold text-gray-900">{ride.driverName}</p>
                                              </div>
                                          </div>
                                          <a 
                                              href={`tel:${ride.driverPhone}`}
                                              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm hover:bg-green-700 shadow-sm"
                                          >
                                              <Phone size={16} /> Gọi tài xế
                                          </a>
                                      </div>
                                  )}

                                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                                      <button 
                                          onClick={() => {
                                              if(window.confirm('Bạn có chắc chắn muốn hủy đặt chỗ này?')) cancelBooking(booking.id);
                                          }}
                                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                                      >
                                          Hủy đặt chỗ
                                      </button>
                                  </div>
                              </div>
                          );
                      })
                  )}
               </div>

               {/* History */}
               {pastBookings.length > 0 && (
                  <div className="space-y-4 pt-8">
                     <h3 className="font-medium text-gray-500 uppercase text-xs tracking-wider flex items-center">
                        <History size={14} className="mr-1" /> Lịch sử chuyến đi
                     </h3>
                     {pastBookings.map(booking => {
                         const ride = rides.find(r => r.id === booking.rideId);
                         return (
                             <div key={booking.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-75">
                                 <div className="flex justify-between items-center">
                                     <div>
                                         <p className="font-bold text-gray-700">{ride ? `${ride.origin} - ${ride.destination}` : 'Chuyến đi không xác định'}</p>
                                         <p className="text-sm text-gray-500">
                                            {ride ? format(new Date(ride.departureTime), 'dd/MM/yyyy', { locale: vi }) : ''}
                                         </p>
                                     </div>
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${booking.status === BookingStatus.CANCELLED ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                                         {booking.status === BookingStatus.CANCELLED ? 'Đã hủy' : 'Đã hoàn thành'}
                                     </span>
                                 </div>
                             </div>
                         );
                     })}
                  </div>
               )}
            </div>
          )}

          {/* TAB: REQUESTS (Yêu cầu đặt xe) */}
          {activeTab === 'requests' && (
             <div className="space-y-6">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Yêu cầu đặt xe của tôi</h2>
                    <button onClick={() => navigate('/book-ride')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200">
                        + Tạo yêu cầu mới
                    </button>
                 </div>

                 {myRequests.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-dashed border-gray-300">
                        <p className="text-gray-500">Bạn chưa tạo yêu cầu đặt xe nào.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                        {myRequests.map(req => (
                            <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                                            req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            req.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                            req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {req.status === 'PENDING' ? 'Đang tìm tài xế' :
                                             req.status === 'ACCEPTED' ? 'Tài xế đã nhận' :
                                             req.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đã hủy'}
                                        </span>
                                        <span className="text-gray-400 text-sm">•</span>
                                        <span className="text-sm font-medium text-gray-600">{getRideTypeLabel(req.rideType)}</span>
                                    </div>
                                    <span className="font-bold text-blue-600">
                                        {req.priceOffered > 0 ? `${req.priceOffered.toLocaleString('vi-VN')}đ` : 'Thương lượng'}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                                        {req.origin} <span className="text-gray-400">→</span> {req.destination}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                                        <Clock size={14} />
                                        {format(new Date(req.pickupTime), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                                    </div>
                                    {req.note && <p className="text-sm text-gray-500 italic mt-2 bg-gray-50 p-2 rounded">"{req.note}"</p>}
                                </div>

                                {/* Driver Info if Accepted */}
                                {(req.status === 'ACCEPTED' || req.status === 'COMPLETED') && req.driverName && (
                                    <div className="bg-green-50 border border-green-100 rounded-lg p-3 mb-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={req.driverAvatar || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full" />
                                            <div>
                                                <p className="text-xs text-green-700 font-bold uppercase">Tài xế của bạn</p>
                                                <p className="font-bold text-gray-900">{req.driverName}</p>
                                            </div>
                                        </div>
                                        {req.status === 'ACCEPTED' && req.driverPhone && (
                                            <a href={`tel:${req.driverPhone}`} className="bg-green-600 text-white w-9 h-9 rounded-full flex items-center justify-center hover:bg-green-700 shadow-sm">
                                                <Phone size={16} />
                                            </a>
                                        )}
                                    </div>
                                )}

                                {req.status !== 'CANCELLED' && req.status !== 'COMPLETED' && (
                                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                                        <button 
                                            onClick={() => handlePassengerCancelRequest(req.id, req.status === 'ACCEPTED')}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Hủy yêu cầu
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                 )}
             </div>
          )}

          {/* TAB: DRIVER (Dành cho tài xế) */}
          {activeTab === 'rides' && (
            <div className="space-y-8">
              {/* SECTION 1: Các chuyến đi đã đăng (Fixed Rides) */}
              <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Chuyến đi đã đăng</h2>
                    <button onClick={() => navigate('/post')} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium hover:bg-blue-200">
                        + Đăng chuyến mới
                    </button>
                </div>
                
                {myRides.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-6 text-center border border-gray-200">
                        <p className="text-gray-500">Bạn chưa đăng chuyến xe nào.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myRides.map(ride => (
                            <div key={ride.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-gray-900">
                                            {ride.origin} - {ride.destination}
                                        </div>
                                        <p className="text-sm text-gray-500">{format(new Date(ride.departureTime), 'HH:mm dd/MM/yyyy', { locale: vi })}</p>
                                        <span className={`inline-flex mt-2 items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            ride.status === RideStatus.OPEN ? 'bg-green-100 text-green-800' :
                                            ride.status === RideStatus.CANCELLED ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {ride.status === RideStatus.OPEN ? 'Đang tìm khách' : ride.status === RideStatus.CANCELLED ? 'Đã hủy' : 'Đã kết thúc'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">{ride.price.toLocaleString('vi-VN')}đ</p>
                                        <p className="text-xs text-gray-500">Còn {ride.seatsAvailable} chỗ</p>
                                    </div>
                                </div>
                                {ride.status === RideStatus.OPEN && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                        <button 
                                            onClick={() => {
                                                if(window.confirm('Bạn có chắc muốn hủy chuyến đi này?')) cancelRide(ride.id);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-xs font-medium uppercase"
                                        >
                                            Hủy chuyến
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
              </div>

              <hr />

              {/* SECTION 2: Khách hàng đã nhận (Accepted Requests) */}
              <div>
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Khách hàng cần đón</h2>
                    <button onClick={() => navigate('/find-passengers')} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium hover:bg-green-200">
                        + Tìm khách mới
                    </button>
                 </div>

                 {/* Active Requests */}
                 <div className="space-y-4 mb-8">
                     {activeAcceptedRequests.length === 0 ? (
                         <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                             Hiện không có khách nào đang chờ đón.
                         </div>
                     ) : (
                         activeAcceptedRequests.map(req => (
                             <div key={req.id} className="bg-white rounded-xl shadow-md border-l-4 border-green-500 p-5">
                                 <div className="flex justify-between items-start mb-4">
                                     <div>
                                         <div className="flex items-center gap-2">
                                             <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded uppercase">Đang phục vụ</span>
                                             <span className="text-sm text-gray-500">• {getRideTypeLabel(req.rideType)}</span>
                                         </div>
                                         <p className="text-lg font-bold text-gray-900 mt-1">{req.origin} → {req.destination}</p>
                                         <p className="text-sm text-gray-600 flex items-center mt-1">
                                             <Clock size={14} className="mr-1" /> {format(new Date(req.pickupTime), 'HH:mm dd/MM', { locale: vi })}
                                         </p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-lg font-bold text-blue-600">{req.priceOffered > 0 ? req.priceOffered.toLocaleString('vi-VN') + 'đ' : 'Thương lượng'}</p>
                                     </div>
                                 </div>

                                 {/* Passenger Info */}
                                 <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-4">
                                     <div className="flex items-center gap-3">
                                         <div className="bg-blue-100 p-2 rounded-full">
                                             <User size={16} className="text-blue-600" />
                                         </div>
                                         <div>
                                             <p className="text-sm font-bold text-gray-900">{req.passengerName}</p>
                                             <p className="text-xs text-gray-500">Khách hàng</p>
                                         </div>
                                     </div>
                                     {req.passengerPhone && (
                                         <a href={`tel:${req.passengerPhone}`} className="bg-green-600 text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 hover:bg-green-700">
                                             <Phone size={14} /> Gọi
                                         </a>
                                     )}
                                 </div>
                                 
                                 {req.note && (
                                     <div className="text-sm text-gray-600 italic mb-4 border-l-2 border-gray-300 pl-2">
                                         "{req.note}"
                                     </div>
                                 )}

                                 <div className="flex gap-3 pt-3 border-t border-gray-100">
                                     <button 
                                         onClick={() => {
                                             if (window.confirm('Xác nhận đã hoàn thành chuyến đi này?')) completeRideRequest(req.id);
                                         }}
                                         className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium text-sm hover:bg-blue-700"
                                     >
                                         Hoàn thành
                                     </button>
                                     <button 
                                         onClick={() => {
                                             if (window.confirm('Bạn có chắc muốn hủy nhận khách này? Yêu cầu sẽ được chuyển lại trạng thái chờ cho tài xế khác.')) cancelAcceptedRequest(req.id);
                                         }}
                                         className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md font-medium text-sm hover:bg-gray-50"
                                     >
                                         Hủy nhận
                                     </button>
                                 </div>
                             </div>
                         ))
                     )}
                 </div>

                 {/* History Requests */}
                 {historyAcceptedRequests.length > 0 && (
                     <div>
                         <h3 className="font-medium text-gray-500 uppercase text-xs tracking-wider mb-3 flex items-center">
                             <History size={14} className="mr-1" /> Lịch sử phục vụ
                         </h3>
                         <div className="space-y-3">
                             {historyAcceptedRequests.map(req => (
                                 <div key={req.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center opacity-80">
                                     <div>
                                         <div className="flex items-center gap-2">
                                             <span className={`text-xs font-bold px-2 py-0.5 rounded ${req.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                                                 {req.status === 'COMPLETED' ? 'HOÀN THÀNH' : 'ĐÃ HỦY'}
                                             </span>
                                             <span className="font-medium text-gray-700">{req.passengerName}</span>
                                         </div>
                                         <p className="text-sm text-gray-500 mt-1">{req.origin} → {req.destination}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-sm font-medium text-gray-900">{req.priceOffered.toLocaleString('vi-VN')}đ</p>
                                         <p className="text-xs text-gray-500">{format(new Date(req.pickupTime), 'dd/MM', { locale: vi })}</p>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
};
