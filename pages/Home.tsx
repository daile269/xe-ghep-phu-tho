import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Search, MapPin, Shield, Calendar, DollarSign, PenTool, Clock, ArrowRight, Phone, Car } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BookingStatus } from '../types';

export const Home: React.FC = () => {
  const { currentUser, bookings, rides, rideRequests } = useApp();

  // Logic to get the nearest upcoming trip (Booking or Accepted Request)
  const getUpcomingTrip = () => {
      if (!currentUser) return null;
      const now = new Date();

      // 1. Confirmed Bookings
      const myUpcomingBookings = bookings
        .filter(b => b.passengerId === currentUser.id && b.status === BookingStatus.CONFIRMED)
        .map(b => {
            const ride = rides.find(r => r.id === b.rideId);
            return ride ? { type: 'booking', data: b, ride } : null;
        })
        .filter(item => item && new Date(item.ride.departureTime) > now) as any[];

      // 2. Accepted Requests (Your custom requests that drivers accepted)
      const myAcceptedRequests = rideRequests
        .filter(r => r.passengerId === currentUser.id && r.status === 'ACCEPTED' && new Date(r.pickupTime) > now)
        .map(r => ({ type: 'request', data: r }));

      // Combine and Sort by time
      const allUpcoming = [...myUpcomingBookings, ...myAcceptedRequests].sort((a, b) => {
          const timeA = a.type === 'booking' ? new Date(a.ride.departureTime).getTime() : new Date(a.data.pickupTime).getTime();
          const timeB = b.type === 'booking' ? new Date(b.ride.departureTime).getTime() : new Date(b.data.pickupTime).getTime();
          return timeA - timeB;
      });

      return allUpcoming.length > 0 ? allUpcoming[0] : null;
  };

  const upcomingTrip = getUpcomingTrip();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="relative bg-blue-700 overflow-hidden">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
            alt="Driving on highway"
          />
          <div className="absolute inset-0 bg-blue-900 mix-blend-multiply" aria-hidden="true" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Xe ghép Phú Thọ - Hà Nội
          </h1>
          <p className="mt-6 text-xl text-blue-100 max-w-3xl">
            Kết nối những người cùng lộ trình. Tiết kiệm chi phí, giảm ùn tắc và kết thêm bạn mới.
            Đặt xe tiện chuyến nhanh chóng, an toàn.
          </p>
          <div className="mt-10 max-w-sm sm:flex sm:max-w-none gap-4">
             <Link
              to="/book-ride"
              className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 md:py-4 md:text-lg md:px-10"
            >
              <PenTool className="mr-2" size={20} />
              Đặt xe ngay
            </Link>
             <Link
              to="/find"
              className="mt-3 sm:mt-0 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
            >
              <Search className="mr-2" size={20} />
              Tìm chuyến xe
            </Link>
            <Link
              to="/driver"
              className="mt-3 sm:mt-0 flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10"
            >
              <Car className="mr-2" size={20} />
              Dành cho tài xế
            </Link>
          </div>
        </div>
      </div>

      {/* Upcoming Trip Widget (Only visible if user has a trip) */}
      {upcomingTrip && (
        <div className="bg-white border-b border-gray-200 relative z-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center">
                        <Clock className="text-blue-600 mr-2 animate-pulse" /> Chuyến đi sắp tới của bạn
                    </h2>
                    <Link to="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center">
                        Xem chi tiết <ArrowRight size={16} className="ml-1" />
                    </Link>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 text-xl font-bold text-gray-900 flex-wrap">
                                <span>{upcomingTrip.type === 'booking' ? upcomingTrip.ride.origin : upcomingTrip.data.origin}</span>
                                <ArrowRight className="text-gray-400" />
                                <span>{upcomingTrip.type === 'booking' ? upcomingTrip.ride.destination : upcomingTrip.data.destination}</span>
                            </div>
                            <p className="text-blue-700 font-medium mt-2 flex items-center">
                                <Clock size={16} className="mr-2" />
                                {format(new Date(upcomingTrip.type === 'booking' ? upcomingTrip.ride.departureTime : upcomingTrip.data.pickupTime), 'HH:mm - EEEE, dd/MM/yyyy', { locale: vi })}
                            </p>
                            {upcomingTrip.type === 'request' && (
                                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded">Đã có tài xế nhận</span>
                            )}
                        </div>

                        {/* Driver Info Section */}
                        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <img 
                                    src={upcomingTrip.type === 'booking' ? upcomingTrip.ride.driverAvatar : upcomingTrip.data.driverAvatar} 
                                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                                    alt="Driver" 
                                />
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Tài xế</p>
                                    <p className="font-bold text-gray-900 text-sm truncate max-w-[120px]">
                                        {upcomingTrip.type === 'booking' ? upcomingTrip.ride.driverName : upcomingTrip.data.driverName}
                                    </p>
                                </div>
                            </div>
                            <a 
                                href={`tel:${upcomingTrip.type === 'booking' ? upcomingTrip.ride.driverPhone : upcomingTrip.data.driverPhone}`}
                                className="bg-green-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-700 shadow-md transition-transform transform hover:scale-105"
                                title="Gọi tài xế"
                            >
                                <Phone size={20} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Tiện ích</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Tại sao chọn chúng tôi?
            </p>
          </div>

          <div className="mt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <DollarSign className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Tiết kiệm chi phí</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Chia sẻ tiền xăng xe với những người cùng lộ trình giúp bạn tiết kiệm đáng kể so với đi taxi hay xe riêng.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <Shield className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">An toàn & Tin cậy</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Thông tin tài xế và hành khách được xác thực. Hệ thống đánh giá giúp xây dựng cộng đồng văn minh.
                </dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <MapPin className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Linh hoạt lộ trình</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  Dễ dàng tìm thấy các điểm đón trả linh hoạt trên trục đường Hà Nội - Phú Thọ - Việt Trì - Thanh Sơn.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};