

export enum RideStatus {
  OPEN = 'OPEN',
  FULL = 'FULL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED'
}

export enum RideType {
  SHARE = 'SHARE',   // Đi ghép
  CHARTER = 'CHARTER', // Bao xe
  DELIVERY = 'DELIVERY' // Gửi đồ
}

export enum DriverStatus {
  NONE = 'NONE',       // Chưa đăng ký
  PENDING = 'PENDING', // Đang chờ duyệt
  APPROVED = 'APPROVED', // Đã duyệt
  REJECTED = 'REJECTED' // Bị từ chối
}

export enum TransactionType {
  TOPUP = 'TOPUP',             // Nạp tiền
  WITHDRAW = 'WITHDRAW',       // Rút tiền
  RIDE_FEE = 'RIDE_FEE',       // Phí sàn (1%)
  COMMISSION_PAID = 'COMMISSION_PAID', // Trả hoa hồng cho người bắn khách
  COMMISSION_RECEIVED = 'COMMISSION_RECEIVED' // Nhận hoa hồng từ việc bắn khách
}

export enum TransactionStatus {
  PENDING = 'PENDING',     // Đang chờ xử lý
  COMPLETED = 'COMPLETED', // Thành công
  REJECTED = 'REJECTED'    // Bị từ chối/Hủy
}

export interface SystemSettings {
  bankId: string;        // Mã ngân hàng (VD: VCB, MB, TCB...) - dùng cho VietQR
  bankName: string;      // Tên hiển thị (VD: Vietcombank)
  accountNumber: string; // Số tài khoản
  accountOwner: string;  // Tên chủ tài khoản
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number; // Số tiền (+ hoặc -)
  type: TransactionType;
  description: string;
  createdAt: string;
  relatedRideId?: string;
  status: TransactionStatus; // Trạng thái giao dịch
  
  // Banking Reconciliation
  transferContent?: string; // Nội dung CK hệ thống yêu cầu (VD: NAP 0912345678)
  bankRefCode?: string;     // Mã giao dịch ngân hàng thực tế (Admin nhập khi duyệt)
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  
  // Admin & Security
  isAdmin?: boolean;
  isBlocked?: boolean;

  // Driver specific info
  isDriver?: boolean;
  driverStatus: DriverStatus;
  carModel?: string;
  licensePlate?: string;
  licenseNumber?: string;
  
  // Wallet
  walletBalance: number;
}

export interface Ride {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  departureTime: string;
  price: number;
  seatsTotal: number;
  seatsAvailable: number;
  carModel: string;
  licensePlate: string;
  description?: string;
  status: RideStatus;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  rideType: RideType;
}

export interface Booking {
  id: string;
  rideId: string;
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  seatsBooked: number;
  status: BookingStatus;
  bookingTime: string;
  totalPrice: number;
}

// Yêu cầu đặt xe từ khách hàng (Khách chủ động đăng tin tìm xe)
export interface RideRequest {
  id: string;
  passengerId: string; // Nếu khách tự đặt thì là ID khách, nếu tài xế bắn khách thì là ID tài xế bắn (hoặc null nếu nhập chay)
  passengerName: string;
  passengerPhone?: string;
  origin: string;
  destination: string;
  pickupTime: string;
  priceOffered: number;
  rideType: RideType;
  seatsNeeded?: number;
  note?: string;
  status: 'PENDING' | 'ACCEPTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  
  // Thông tin tài xế nhận chuyến
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;

  // Cơ chế Bắn khách (Referral)
  referrerId?: string; // ID của tài xế bắn khách
  referralFee?: number; // Hoa hồng cho người bắn (VNĐ)
}