
import React from 'react';
import { Car } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50">
      <div className="bg-white p-4 rounded-2xl shadow-xl animate-bounce mb-4">
        <Car size={48} className="text-blue-600" />
      </div>
      <h1 className="text-white text-2xl font-bold tracking-wider animate-pulse">
        XeGhep<span className="text-blue-200">PhuTho</span>
      </h1>
      <div className="mt-4 flex gap-2">
        <div className="w-3 h-3 bg-white rounded-full animate-ping delay-75"></div>
        <div className="w-3 h-3 bg-white rounded-full animate-ping delay-150"></div>
        <div className="w-3 h-3 bg-white rounded-full animate-ping delay-300"></div>
      </div>
      <p className="text-blue-200 text-sm mt-4 font-medium">Đang kết nối máy chủ...</p>
    </div>
  );
};
