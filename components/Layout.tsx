import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Menu, X, User as UserIcon, LogOut, Car, MapPin, PlusCircle, ClipboardList, PenTool, Users, Wallet, Shield } from 'lucide-react';
import { DriverStatus } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/book-ride', label: 'Đặt xe', icon: <PenTool size={18} /> },
    { to: '/find', label: 'Tìm chuyến', icon: <MapPin size={18} /> },
    { to: '/driver', label: 'Dành cho tài xế', icon: <Car size={18} /> },
    { to: '/dashboard', label: 'Chuyến của tôi', icon: <ClipboardList size={18} /> },
  ];

  const isActive = (path: string) => location.pathname === path ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:bg-gray-50';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <Car size={24} />
                </div>
                <span className="font-bold text-xl text-gray-900 tracking-tight">XeGhep<span className="text-blue-600">PhuTho</span></span>
              </Link>
              <div className="hidden md:ml-8 md:flex md:space-x-2 lg:space-x-4">
                {navLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`inline-flex items-center px-2 lg:px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive(link.to)}`}
                  >
                    <span className="mr-2 hidden lg:inline">{link.icon}</span>
                    <span className="lg:hidden mr-1">{React.cloneElement(link.icon as React.ReactElement<{ size: number }>, { size: 16 })}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="hidden md:ml-6 md:flex md:items-center">
              {currentUser ? (
                <div className="relative ml-3 group">
                  <button className="flex items-center gap-2 max-w-xs bg-white rounded-full focus:outline-none text-sm focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 p-1 pr-3 border border-gray-200 hover:bg-gray-50 transition">
                    <img className="h-8 w-8 rounded-full object-cover" src={currentUser.avatar} alt="" />
                    <span className="font-medium text-gray-700 max-w-[100px] truncate">{currentUser.name || currentUser.phone}</span>
                  </button>
                  {/* Dropdown */}
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 hidden group-hover:block transition-all z-50">
                    {currentUser.isAdmin && (
                        <Link to="/admin" className="block px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center bg-yellow-50/50">
                            <Shield size={16} className="mr-2" /> Quản trị hệ thống
                        </Link>
                    )}
                    {currentUser.driverStatus === DriverStatus.APPROVED && (
                        <Link to="/wallet" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                            <Wallet size={16} className="mr-2 text-blue-600" /> Ví tài xế
                        </Link>
                    )}
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <ClipboardList size={16} className="mr-2" /> Chuyến đi của tôi
                    </Link>
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                      <UserIcon size={16} className="mr-2" /> Hồ sơ cá nhân
                    </Link>
                    <button onClick={logout} className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
                      <LogOut size={16} className="mr-2" /> Đăng xuất
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
                  Đăng nhập
                </Link>
              )}
            </div>

            <div className="-mr-2 flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    location.pathname === link.to
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                     <span className="mr-3">{link.icon}</span>
                     {link.label}
                  </div>
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-4 border-t border-gray-200">
              {currentUser ? (
                <div className="space-y-1">
                  <div className="flex items-center px-4 mb-3">
                    <div className="flex-shrink-0">
                      <img className="h-10 w-10 rounded-full" src={currentUser.avatar} alt="" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{currentUser.name || "Chưa cập nhật tên"}</div>
                      <div className="text-sm font-medium text-gray-500">{currentUser.phone}</div>
                    </div>
                  </div>
                  {currentUser.isAdmin && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-yellow-700 hover:bg-yellow-50 bg-yellow-50/50">
                        <span className="flex items-center"><Shield size={18} className="mr-2"/> Quản trị hệ thống</span>
                    </Link>
                  )}
                  {currentUser.driverStatus === DriverStatus.APPROVED && (
                    <Link to="/wallet" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">
                        <span className="flex items-center"><Wallet size={18} className="mr-2 text-blue-600"/> Ví tài xế</span>
                    </Link>
                  )}
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)} className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100">Hồ sơ cá nhân</Link>
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left px-4 py-2 text-base font-medium text-red-500 hover:text-red-700 hover:bg-red-50">Đăng xuất</button>
                </div>
              ) : (
                <div className="px-4">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block text-center w-full px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Đăng nhập ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start gap-2 items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                 <Car size={18} />
              </div>
              <p className="text-center text-base text-gray-400">
                &copy; 2024 XeGhep PhuTho. All rights reserved.
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex justify-center space-x-6">
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Về chúng tôi</span>
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Điều khoản</span>
              <span className="text-gray-400 hover:text-gray-500 cursor-pointer">Bảo mật</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};