import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Search, Calendar, MapPin, Clock, User, Filter, Car, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RideType } from '../types';

export const FindRide: React.FC = () => {
  const { searchRides, rides } = useApp();
  
  // Basic Search
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  
  // Advanced Search
  const [specificPickup, setSpecificPickup] = useState('');
  const [specificDropoff, setSpecificDropoff] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rideType, setRideType] = useState<string>('ALL');

  const [filteredRides, setFilteredRides] = useState(rides);

  // Initial load
  useEffect(() => {
    // Filter out rides that are full or past departure time
    const now = new Date();
    const availableRides = rides.filter(ride => {
      const isFull = ride.seatsAvailable <= 0;
      const isPast = new Date(ride.departureTime) < now;
      return !isFull && !isPast;
    });
    setFilteredRides(availableRides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rides]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const results = searchRides({
      origin,
      destination,
      date,
      specificPickup,
      specificDropoff,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      rideType: rideType === 'ALL' ? undefined : rideType
    });
    
    // Filter out rides that are full or past departure time
    const now = new Date();
    const availableResults = results.filter(ride => {
      const isFull = ride.seatsAvailable <= 0;
      const isPast = new Date(ride.departureTime) < now;
      return !isFull && !isPast;
    });
    
    setFilteredRides(availableResults);
  };

  const clearFilters = () => {
    setOrigin('');
    setDestination('');
    setDate('');
    setSpecificPickup('');
    setSpecificDropoff('');
    setMaxPrice('');
    setRideType('ALL');
    
    // Filter out rides that are full or past departure time
    const now = new Date();
    const availableRides = rides.filter(ride => {
      const isFull = ride.seatsAvailable <= 0;
      const isPast = new Date(ride.departureTime) < now;
      return !isFull && !isPast;
    });
    setFilteredRides(availableRides);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Filter Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="bg-blue-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Search className="mr-2" /> Tìm kiếm chuyến xe
          </h2>
        </div>
        
        <form onSubmit={handleSearch} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             {/* Main Route */}
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực đi</label>
                <div className="relative">
                   <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                   <select 
                     className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                     value={origin}
                     onChange={(e) => setOrigin(e.target.value)}
                   >
                     <option value="">Tất cả</option>
                     <option value="Hà Nội">Hà Nội</option>
                     <option value="Phú Thọ">Phú Thọ</option>
                     <option value="Việt Trì">Việt Trì</option>
                     <option value="Thị xã Phú Thọ">Thị xã Phú Thọ</option>
                   </select>
                </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khu vực đến</label>
                <div className="relative">
                   <MapPin className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                   <select 
                     className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                     value={destination}
                     onChange={(e) => setDestination(e.target.value)}
                   >
                     <option value="">Tất cả</option>
                     <option value="Hà Nội">Hà Nội</option>
                     <option value="Phú Thọ">Phú Thọ</option>
                     <option value="Việt Trì">Việt Trì</option>
                   </select>
                </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đi</label>
               <div className="relative">
                 <Calendar className="absolute top-2.5 left-3 h-5 w-5 text-gray-400" />
                 <input 
                   type="date" 
                   className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
                   value={date}
                   onChange={(e) => setDate(e.target.value)}
                 />
               </div>
             </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
              <Filter size={16} className="mr-1" /> Bộ lọc chi tiết
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Điểm đón cụ thể</label>
                  <input 
                    type="text" 
                    placeholder="VD: Bến xe Mỹ Đình..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                    value={specificPickup}
                    onChange={(e) => setSpecificPickup(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Điểm trả cụ thể</label>
                  <input 
                    type="text" 
                    placeholder="VD: Quảng trường..."
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                    value={specificDropoff}
                    onChange={(e) => setSpecificDropoff(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Giá tối đa</label>
                  <div className="relative">
                    <Banknote className="absolute top-2 left-2 h-4 w-4 text-gray-400" />
                    <input 
                      type="number" 
                      placeholder="VD: 200000"
                      className="pl-8 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Loại chuyến</label>
                  <div className="relative">
                    <Car className="absolute top-2 left-2 h-4 w-4 text-gray-400" />
                    <select 
                      className="pl-8 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                      value={rideType}
                      onChange={(e) => setRideType(e.target.value)}
                    >
                      <option value="ALL">Tất cả</option>
                      <option value={RideType.SHARE}>Đi ghép (Vé lẻ)</option>
                      <option value={RideType.CHARTER}>Bao xe (Trọn gói)</option>
                    </select>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button 
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Xóa bộ lọc
            </button>
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-colors text-base font-medium"
            >
              Tìm chuyến xe
            </button>
          </div>
        </form>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Kết quả ({filteredRides.length} chuyến)
        </h3>
        
        {filteredRides.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">Không tìm thấy chuyến xe nào phù hợp.</p>
            <button onClick={clearFilters} className="mt-2 text-blue-600 hover:text-blue-500 font-medium">
              Xóa bộ lọc & thử lại
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRides.map(ride => (
              <div key={ride.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="relative">
                   {ride.rideType === RideType.CHARTER && (
                      <div className="absolute top-0 right-0 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                        BAO XE
                      </div>
                   )}
                   {ride.rideType === RideType.SHARE && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                        ĐI GHÉP
                      </div>
                   )}
                </div>
                <div className="p-5 flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <img src={ride.driverAvatar} alt={ride.driverName} className="h-10 w-10 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ride.driverName}</p>
                        <div className="flex items-center text-xs text-gray-500">
                           <User size={12} className="mr-1" /> Tài xế
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mb-4">
                    <div>
                        <span className="block text-xl font-bold text-blue-600">
                            {ride.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-xs text-gray-400">
                            {ride.rideType === RideType.CHARTER ? '/ chuyến' : '/ ghế'}
                        </span>
                    </div>
                  </div>

                  <div className="relative pl-4 border-l-2 border-gray-200 ml-2 space-y-6 my-6">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-blue-500 bg-white"></div>
                      <p className="text-sm text-gray-500">Điểm đi</p>
                      <p className="font-semibold text-gray-900">{ride.origin}</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-green-500 bg-white"></div>
                      <p className="text-sm text-gray-500">Điểm đến</p>
                      <p className="font-semibold text-gray-900">{ride.destination}</p>
                    </div>
                  </div>

                  {ride.description && (
                     <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-4 line-clamp-2">
                        {ride.description}
                     </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-50">
                    <div className="flex items-center">
                      <Clock size={16} className="mr-1" />
                      {format(new Date(ride.departureTime), 'HH:mm dd/MM', { locale: vi })}
                    </div>
                    <div className="flex items-center font-medium text-gray-700">
                      {ride.rideType === RideType.CHARTER ? 'Trọn gói' : `Còn ${ride.seatsAvailable} chỗ`}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                   <Link to={`/ride/${ride.id}`} className="block w-full text-center bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition-colors">
                     Xem chi tiết & Đặt chỗ
                   </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};