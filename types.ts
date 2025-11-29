

export enum RideStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  FULL = 'FULL',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
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
  // Nếu true thì mỗi chuyến do tài xế tạo sẽ cần admin duyệt trước khi public
  requireRideApproval?: boolean;
  // Mặc định phần trăm phí nền tảng cho mỗi chuyến (ví dụ 0.01 = 1%)
  defaultPlatformFeePercent?: number;
  // Nearby-driver notification settings
  // Radius in kilometers to search for nearby drivers when broadcasting a request
  notifyRadiusKm?: number;
  // Limit number of drivers to notify for a single broadcast
  maxNotifiedDrivers?: number;
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
  // Whether this user (driver) is allowed to receive notification emails
  canReceiveEmails?: boolean;
  
  // Wallet
  walletBalance: number;
  // Driver password (optional) required for driver login — stored as plain text for now
  driverPassword?: string;
  // Optional geolocation for drivers (or users who share location). Stored under users/{id}/location
  location?: {
    lat: number;
    lng: number;
    // Optional accuracy in meters and timestamp when updated
    accuracy?: number;
    updatedAt?: string;
  };
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
  // Platform fee percent for this ride (0.01 = 1%). Default: 0
  platformFeePercent?: number;
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
  // Added APPROVED/REJECTED so admin can approve or reject user-posted requests
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACCEPTED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  
  // Thông tin tài xế nhận chuyến
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;

  // Cơ chế Bắn khách (Referral)
  referrerId?: string; // ID của tài xế bắn khách
  referralFee?: number; // Hoa hồng cho người bắn (VNĐ)
  // Platform fee percent applied to this request (0.01 = 1%). Default: 0
  platformFeePercent?: number;
  // Optional pickup coordinates (latitude / longitude) to support nearby-driver notifications
  pickupLat?: number;
  pickupLng?: number;
}