

import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, User, Phone, CheckCircle, Car, Box, Users, DollarSign, AlertCircle, Info } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RideType, RideRequest, DriverStatus } from '../types';

export const FindPassengers: React.FC = () => {
  const { rideRequests, currentUser, acceptRideRequest } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
       navigate('/login');
       return;
    }
    // Auth Guard
    if (currentUser.driverStatus !== DriverStatus.APPROVED) {
        navigate('/driver-register');
    }
  }, [currentUser, navigate]);

  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDestination, setFilterDestination] = useState('');
  
  const [acceptedPassenger, setAcceptedPassenger] = useState<RideRequest | null>(null);

    // Only show requests that have been approved by Admin
    const approvedRequests = rideRequests.filter(r => r.status === 'APPROVED');

    const filteredRequests = approvedRequests.filter(req => {
      const matchOrigin = !filterOrigin || req.origin.toLowerCase().includes(filterOrigin.toLowerCase());
      const matchDestination = !filterDestination || req.destination.toLowerCase().includes(filterDestination.toLowerCase());
      return matchOrigin && matchDestination;
  });

  const handleAccept = (request: RideRequest) => {
      if (!currentUser) {
          navigate('/login');
          return;
      }
      acceptRideRequest(request.id);
      setAcceptedPassenger(request);
  };

  const handleCloseModal = () => {
      setAcceptedPassenger(null);
      navigate('/dashboard', { state: { defaultTab: 'rides' } });
  };

  const getRideTypeIcon = (type: RideType) => {
      switch (type) {
          case RideType.SHARE: return <Users className="h-5 w-5 text-blue-500" />;
          case RideType.CHARTER: return <Car className="h-5 w-5 text-purple-500" />;
          case RideType.DELIVERY: return <Box className="h-5 w-5 text-orange-500" />;
          default: return <Car className="h-5 w-5 text-gray-500" />;
      }
  };

  const getRideTypeLabel = (type: RideType, seats?: number) => {
      switch (type) {
          case RideType.SHARE: return `Đi ghép (${seats || 1} khách)`;
          case RideType.CHARTER: return `Bao xe ${seats || 4} chỗ`;
          case RideType.DELIVERY: return 'Gửi đồ';
          default: return 'Khác';
      }
  };

  if (!currentUser || currentUser.driverStatus !== DriverStatus.APPROVED) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
       {/* Modal Success */}
       {acceptedPassenger && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                            <CheckCircle className="h-6 w-6 text-green-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Nhận chuyến thành công!
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-gray-500">
                                    Bạn đã nhận yêu cầu từ <b>{acceptedPassenger.origin}</b> đi <b>{acceptedPassenger.destination}</b>.
                                </p>
                                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Thông tin khách hàng</p>
                                    <p className="text-lg font-bold text-gray-900">{acceptedPassenger.passengerName}</p>
                                    <p className="text-xl font-bold text-blue-700 mt-1">{acceptedPassenger.passengerPhone || "SĐT ẩn"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                        <a 
                            href={`tel:${acceptedPassenger.passengerPhone}`}
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:text-sm items-center"
                        >
                            <Phone size={18} className="mr-2" /> Gọi ngay
                        </a>
                        <button
                            type="button"
                            className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:text-sm"
                            onClick={handleCloseModal}
                        >
                            Đóng & Xem DS
                        </button>
                    </div>
                </div>
            </div>
        </div>
       )}

       {/* Banner */}
       <div className="bg-green-600 rounded-xl shadow-lg p-6 mb-8 text-white">
          <h1 className="text-2xl font-bold flex items-center">
             <User className="mr-3" /> Tìm khách & Nhận chuyến
          </h1>
          <p className="mt-2 text-green-100">Lưu ý: Bạn sẽ bị trừ phí sàn (1%) và hoa hồng (nếu có) khi hoàn thành chuyến.</p>
       </div>

       {/* Filter */}
       <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
             <div className="relative">
                <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Lọc điểm đón..." 
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                  value={filterOrigin}
                  onChange={(e) => setFilterOrigin(e.target.value)}
                />
             </div>
          </div>
          <div className="flex-1">
             <div className="relative">
                <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Lọc điểm đến..." 
                  className="pl-10 block w-full border-gray-300 rounded-md shadow-sm p-2 border"
                  value={filterDestination}
                  onChange={(e) => setFilterDestination(e.target.value)}
                />
             </div>
          </div>
       </div>

       {/* List */}
       <div className="space-y-4">
          {filteredRequests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">Hiện không có yêu cầu nào phù hợp.</p>
              </div>
          ) : (
              <div className="grid gap-6 md:grid-cols-2">
                 {filteredRequests.map(req => {
                     // Calculate Fee Preview
                     const platformFee = req.priceOffered * 0.01;
                     const referralFee = req.referralFee || 0;
                     const totalFee = platformFee + referralFee;
                     const netIncome = req.priceOffered - totalFee;

                     return (
                     <div key={req.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative">
                        {/* Referral Badge */}
                        {req.referrerId && (
                            <div className="absolute top-0 right-0 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-bl-lg font-bold border-b border-l border-purple-200">
                                Chuyến bắn khách
                            </div>
                        )}

                        <div className="p-5">
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-2">
                                 {getRideTypeIcon(req.rideType)}
                                 <span className="font-bold text-gray-800">
                                     {getRideTypeLabel(req.rideType, req.seatsNeeded)}
                                 </span>
                              </div>
                              <span className="text-green-600 font-bold text-lg">
                                  {req.priceOffered > 0 ? `${req.priceOffered.toLocaleString('vi-VN')}đ` : 'Thương lượng'}
                              </span>
                           </div>

                           <div className="space-y-3 mb-4 text-sm">
                              <div className="flex items-center gap-2 text-gray-700">
                                 <MapPin size={16} className="text-blue-500" /> {req.origin} <span className="text-gray-400">→</span> <MapPin size={16} className="text-green-500" /> {req.destination}
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                 <Clock size={16} className="text-orange-500" /> {format(new Date(req.pickupTime), 'HH:mm dd/MM/yyyy', { locale: vi })}
                              </div>
                           </div>
                           
                           {/* Financial Breakdown Box */}
                           <div className="bg-gray-50 rounded-lg p-3 text-xs mb-4 border border-gray-200">
                               <div className="flex justify-between mb-1">
                                   <span className="text-gray-500">Doanh thu dự kiến:</span>
                                   <span className="font-bold">{req.priceOffered.toLocaleString('vi-VN')}đ</span>
                               </div>
                               <div className="flex justify-between mb-1 text-red-500">
                                   <span>- Phí sàn (1%):</span>
                                   <span>{platformFee.toLocaleString('vi-VN')}đ</span>
                               </div>
                               {referralFee > 0 && (
                                   <div className="flex justify-between mb-1 text-purple-600">
                                       <span>- Hoa hồng trả đối tác:</span>
                                       <span>{referralFee.toLocaleString('vi-VN')}đ</span>
                                   </div>
                               )}
                               <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between font-bold text-green-700">
                                   <span>Thực nhận về ví:</span>
                                   <span>{netIncome.toLocaleString('vi-VN')}đ</span>
                               </div>
                           </div>

                           {req.note && (
                               <div className="bg-yellow-50 p-2 rounded text-xs text-gray-700 italic mb-4">
                                  "{req.note}"
                               </div>
                           )}

                           <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                 <div className="bg-blue-100 p-1.5 rounded-full">
                                    <User size={14} className="text-blue-600" />
                                 </div>
                                 <span className="text-sm font-medium text-gray-700">{req.passengerName}</span>
                              </div>
                              <button 
                                onClick={() => handleAccept(req)}
                                className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 shadow-sm flex items-center gap-2"
                              >
                                 <CheckCircle size={16} /> Nhận chuyến
                              </button>
                           </div>
                        </div>
                     </div>
                 )})}
              </div>
          )}
       </div>
    </div>
  );
};
