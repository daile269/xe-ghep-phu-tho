import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  User,
  Ride,
  Booking,
  RideStatus,
  BookingStatus,
  RideType,
  RideRequest,
  DriverStatus,
  Transaction,
  TransactionType,
  TransactionStatus,
  SystemSettings,
} from "../types";
import { db } from "../firebaseConfig";
import { ref, onValue, set, update, push, remove } from "firebase/database";

interface SearchCriteria {
  origin?: string;
  destination?: string;
  date?: string;
  specificPickup?: string;
  specificDropoff?: string;
  maxPrice?: number;
  rideType?: RideType | string;
}

interface AppContextType {
  isAppReady: boolean; // Trạng thái sẵn sàng của ứng dụng
  currentUser: User | null;
  allUsers: User[];
  rides: Ride[];
  bookings: Booking[];
  rideRequests: RideRequest[];
  transactions: Transaction[];
  systemSettings: SystemSettings;
  login: (phoneOrUsername: string, password?: string) => boolean;
  logout: () => void;
  updateUserProfile: (name: string, phone: string) => void;
  refreshUserData: () => void;

  // Driver / User Functions
  registerDriver: (
    carModel: string,
    licensePlate: string,
    licenseNumber: string,
    email?: string,
    password?: string
  ) => void;
  createRide: (
    ride: Omit<
      Ride,
      | "id"
      | "driverId"
      | "status"
      | "seatsAvailable"
      | "driverName"
      | "driverAvatar"
      | "driverPhone"
    >
  ) => void;
  createRideRequest: (
    request: Omit<
      RideRequest,
      "id" | "passengerId" | "status" | "createdAt"
    > & { passengerId?: string }
  ) => void;
  searchRides: (criteria: SearchCriteria) => Ride[];
  bookRide: (rideId: string, seats: number) => void;
  confirmBooking: (bookingId: string) => void;
  cancelBooking: (bookingId: string) => void;
  cancelRide: (rideId: string) => void;
  cancelRideRequest: (requestId: string) => void;
  acceptRideRequest: (requestId: string) => void;
  completeRideRequest: (requestId: string) => void;
  cancelAcceptedRequest: (requestId: string) => void;
  topUpWallet: (amount: number) => void;
  withdrawWallet: (amount: number, bankInfo: string) => void;

  // Location & Nearby notification
  updateDriverLocation: (lat: number, lng: number, accuracy?: number, userId?: string) => void;
  notifyNearbyDrivers: (
    pickupLat: number,
    pickupLng: number,
    radiusKm?: number,
    maxDrivers?: number,
    payload?: any
  ) => Promise<{
    notified: Array<{ driverId: string; email?: string; status?: number; error?: string }>;
  }>;

  // Admin Functions
  approveDriver: (userId: string) => void;
  rejectDriver: (userId: string) => void;
  grantDriverPermission: (userId: string) => void;
  revokeDriverPermission: (userId: string) => void;
  grantEmailPermission: (userId: string) => void;
  revokeEmailPermission: (userId: string) => void;
  approveRide: (rideId: string) => void;
  rejectRide: (rideId: string, reason?: string) => void;
  approveRideRequest: (requestId: string) => void;
  rejectRideRequest: (requestId: string, reason?: string) => void;
  blockUser: (userId: string, isBlocked: boolean) => void;
  adminUpdateWallet: (
    userId: string,
    amount: number,
    description: string
  ) => void;
  approveTransaction: (transactionId: string, bankRefCode?: string) => void;
  rejectTransaction: (transactionId: string) => void;
  updateSystemSettings: (settings: SystemSettings) => void;
  updateRideFee: (rideId: string, percent: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Key mặc định cho LocalStorage (chỉ dùng để lưu phiên đăng nhập của máy hiện tại)
const STORAGE_KEY_CURRENT_USER_ID = "xe_ghep_current_user_id";

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  bankId: "VCB",
  bankName: "Vietcombank",
  accountNumber: "0123456789",
  accountOwner: "NGUYEN VAN ADMIN",
};
// Default: không yêu cầu admin duyệt chuyến
const DEFAULT_SYSTEM_SETTINGS_WITH_FLAG: SystemSettings = {
  ...DEFAULT_SYSTEM_SETTINGS,
  // By default, require admin approval for ride requests so they don't appear
  // publicly until an admin explicitly approves them.
  requireRideApproval: true,
  defaultPlatformFeePercent: 0,
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Use Vite env var first (Vite uses `import.meta.env`). Fall back to old REACT_APP name if present.
  const EMAIL_ENDPOINT =
    (typeof import.meta !== "undefined" && (import.meta as any).env && (import.meta as any).env.VITE_EMAIL_ENDPOINT) ||
    (typeof process !== "undefined" && (process as any).env && (process as any).env.REACT_APP_EMAIL_ENDPOINT) ||
    "/api/send-email";
  // Log resolved endpoint once to help debug dev vs prod configuration
  try {
    // eslint-disable-next-line no-console
    console.log("Resolved EMAIL_ENDPOINT:", EMAIL_ENDPOINT);
  } catch (e) {}
  // --- STATE ---
  const [isAppReady, setIsAppReady] = useState(false); // New: Loading State
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(
    DEFAULT_SYSTEM_SETTINGS_WITH_FLAG
  );

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);
  });

  const currentUser = allUsers.find((u) => u.id === currentUserId) || null;

  // --- FIREBASE LISTENERS (REALTIME SYNC) ---

  useEffect(() => {
    // 1. Sync Users
    const usersRef = ref(db, "users");
    const unsubUsers = onValue(
      usersRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setAllUsers(Object.values(data));
        } else {
          setAllUsers([]);
        }
        // Khi đã tải xong users lần đầu tiên, ta coi như App đã sẵn sàng (để check login)
        setIsAppReady(true);
      },
      (error) => {
        console.error("Firebase Error:", error);
        // Ngay cả khi lỗi, cũng nên set ready để không treo loading mãi mãi
        setIsAppReady(true);
      }
    );

    // 2. Sync Rides
    const ridesRef = ref(db, "rides");
    const unsubRides = onValue(ridesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert object to array and sort by new
        const ridesArr: Ride[] = Object.values(data);
        setRides(
          ridesArr.sort(
            (a, b) =>
              new Date(b.departureTime).getTime() -
              new Date(a.departureTime).getTime()
          )
        );
      } else {
        setRides([]);
      }
    });

    // 3. Sync Bookings
    const bookingsRef = ref(db, "bookings");
    const unsubBookings = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      setBookings(data ? Object.values(data) : []);
    });

    // 4. Sync Requests
    const requestsRef = ref(db, "rideRequests");
    const unsubRequests = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reqArr: RideRequest[] = Object.values(data);
        setRideRequests(
          reqArr.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        setRideRequests([]);
      }
    });

    // 5. Sync Transactions
    const transactionsRef = ref(db, "transactions");
    const unsubTransactions = onValue(transactionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const transArr: Transaction[] = Object.values(data);
        setTransactions(
          transArr.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } else {
        setTransactions([]);
      }
    });

    // 6. Sync System Settings
    const settingsRef = ref(db, "systemSettings");
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSystemSettings(data);
    });

    return () => {
      unsubUsers();
      unsubRides();
      unsubBookings();
      unsubRequests();
      unsubTransactions();
      unsubSettings();
    };
  }, []);

  // --- AUTH ---

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, currentUserId);
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
    }
  }, [currentUserId]);

  const login = (phoneOrUsername: string, password?: string) => {
    // Admin Login Logic
    if (phoneOrUsername === "admin") {
      console.log("Admin login attempt");
      if (password === "654789@&$%Tktefvca") {
        const adminUser = allUsers.find((u) => u.id === "admin");
        if (adminUser) {
          setCurrentUserId(adminUser.id);
        } else {
          // Initialize Admin if not exists in DB
          const newAdmin: User = {
            id: "admin",
            name: "Super Admin",
            email: "daile2692003@gmail.com",
            phone: "0999999999",
            avatar:
              "https://ui-avatars.com/api/?name=Admin&background=000&color=fff",
            isDriver: false,
            driverStatus: DriverStatus.NONE,
            walletBalance: 0,
            isAdmin: true,
          };
          set(ref(db, "users/admin"), newAdmin);
          setCurrentUserId("admin");
        }
        return true;
      } else {
        return false;
      }
    }

    // Normal User Logic
    const existingUser = allUsers.find((u) => u.phone === phoneOrUsername);
    if (existingUser) {
      // If this is a driver account, require the driver password as an extra check
      if (existingUser.isDriver) {
        if (!password) {
          alert("Tài khoản tài xế yêu cầu mật khẩu. Vui lòng nhập mật khẩu.");
          return false;
        }
        if (existingUser.driverPassword !== password) {
          alert("Mật khẩu tài xế không chính xác.");
          return false;
        }
      }
      if (existingUser.isAdmin) {
        alert(
          "Vui lòng đăng nhập bằng tài khoản quản trị viên (username: admin) và mật khẩu."
        );
        return false;
      }
      if (existingUser.isBlocked) {
        alert("Tài khoản của bạn đã bị khóa.");
        return false;
      }
      setCurrentUserId(existingUser.id);
    } else {
      // Create new user in Firebase
      const newId = `u${Date.now()}`;
      const newUser: User = {
        id: newId,
        name: "",
        email: "",
        phone: phoneOrUsername,
        avatar: `https://picsum.photos/100/100?random=${Date.now()}`,
        isDriver: false,
        driverStatus: DriverStatus.NONE,
        walletBalance: 0,
      };
      set(ref(db, "users/" + newId), newUser);
      setCurrentUserId(newId);
    }
    return true;
  };

  const logout = () => setCurrentUserId(null);

  const refreshUserData = () => {
    // Firebase onValue handles automatic refresh, this is mostly for compatibility
    console.log("Data synced with Firebase");
  };

  // --- ACTIONS (WRITING TO FIREBASE) ---

  const updateUserProfile = (name: string, phone: string) => {
    if (!currentUser) return;
    update(ref(db, `users/${currentUser.id}`), { name, phone });
  };

  const registerDriver = (
    carModel: string,
    licensePlate: string,
    licenseNumber: string,
    email?: string,
    password?: string
  ) => {
    if (!currentUser) return;
    const updates: any = {
      driverStatus: DriverStatus.PENDING,
      carModel,
      licensePlate,
      licenseNumber,
    };
    if (email) updates.email = email;
    if (password) updates.driverPassword = password;
    update(ref(db, `users/${currentUser.id}`), updates);

    // Notify admin that a new driver registration needs approval
    (async () => {
      try {
        const endpoint = EMAIL_ENDPOINT;
        const payload = {
          type: 'driver_registered',
          payload: {
            userId: currentUser.id,
            name: currentUser.name,
            phone: currentUser.phone,
            email: email || currentUser.email || '',
            carModel,
            licensePlate,
            licenseNumber,
            createdAt: new Date().toISOString(),
          },
        };
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        let data: any = null;
        try { data = await resp.json(); } catch (e) { data = await resp.text(); }
        try {
          set(ref(db, `debug/emailLogs/${Date.now()}_driver_registered_${currentUser.id}`), {
            event: 'driver_registered_email',
            userId: currentUser.id,
            status: resp.status,
            data,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.warn('registerDriver: failed to notify admin', err);
      }
    })();
  };

  const approveDriver = (userId: string) => {
    update(ref(db, `users/${userId}`), {
      driverStatus: DriverStatus.APPROVED,
      isDriver: true,
    });
  };

  const rejectDriver = (userId: string) => {
    update(ref(db, `users/${userId}`), { driverStatus: DriverStatus.REJECTED });
  };

  // Grant platform driving permission to a user (mark as driver + approved)
  const grantDriverPermission = (userId: string) => {
    update(ref(db, `users/${userId}`), {
      isDriver: true,
      driverStatus: DriverStatus.APPROVED,
    });
  };

  // Revoke platform driving permission from a user
  const revokeDriverPermission = (userId: string) => {
    update(ref(db, `users/${userId}`), {
      isDriver: false,
      driverStatus: DriverStatus.NONE,
    });
  };

  // Grant permission for a driver to receive notification emails
  const grantEmailPermission = (userId: string) => {
    update(ref(db, `users/${userId}`), {
      canReceiveEmails: true,
    });
  };

  // Revoke permission for a driver to receive notification emails
  const revokeEmailPermission = (userId: string) => {
    update(ref(db, `users/${userId}`), {
      canReceiveEmails: false,
    });
  };

  const blockUser = (userId: string, isBlocked: boolean) => {
    update(ref(db, `users/${userId}`), { isBlocked });
  };

  const adminUpdateWallet = (
    userId: string,
    amount: number,
    description: string
  ) => {
    const user = allUsers.find((u) => u.id === userId);
    if (!user) return;

    const newBalance = (user.walletBalance || 0) + amount;
    update(ref(db, `users/${userId}`), { walletBalance: newBalance });

    const newTxId = `tx${Date.now()}`;
    const newTrans: Transaction = {
      id: newTxId,
      userId: userId,
      amount: amount,
      type: amount >= 0 ? TransactionType.TOPUP : TransactionType.WITHDRAW,
      description: description,
      createdAt: new Date().toISOString(),
      status: TransactionStatus.COMPLETED,
    };
    set(ref(db, `transactions/${newTxId}`), newTrans);
  };

  const approveTransaction = (transactionId: string, bankRefCode?: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING)
      return;

    update(ref(db, `transactions/${transactionId}`), {
      status: TransactionStatus.COMPLETED,
      bankRefCode: bankRefCode || "",
    });

    if (transaction.type === TransactionType.TOPUP) {
      const user = allUsers.find((u) => u.id === transaction.userId);
      if (user) {
        update(ref(db, `users/${user.id}`), {
          walletBalance: user.walletBalance + transaction.amount,
        });
      }
    }
  };

  const rejectTransaction = (transactionId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction || transaction.status !== TransactionStatus.PENDING)
      return;

    update(ref(db, `transactions/${transactionId}`), {
      status: TransactionStatus.REJECTED,
    });

    // Nếu là rút tiền, hoàn lại tiền vào ví
    if (transaction.type === TransactionType.WITHDRAW) {
      const user = allUsers.find((u) => u.id === transaction.userId);
      if (user) {
        update(ref(db, `users/${user.id}`), {
          walletBalance: user.walletBalance + Math.abs(transaction.amount),
        });
      }
    }
  };

  const updateSystemSettings = (settings: SystemSettings) => {
    set(ref(db, "systemSettings"), settings);
  };

  // --- LOCATION / NOTIFY HELPERS ---
  // Haversine distance in kilometers between two lat/lng points
  const haversineKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update a driver's location in the DB (driver can call this to publish their location)
  const updateDriverLocation = (
    lat: number,
    lng: number,
    accuracy?: number,
    userId?: string
  ) => {
    const id = userId || currentUser?.id;
    if (!id) return;
    try {
      const loc = { lat, lng, accuracy: accuracy || 0, updatedAt: new Date().toISOString() };
      update(ref(db, `users/${id}/location`), loc);
    } catch (err) {
      console.warn('updateDriverLocation: failed to write location', err);
    }
  };

  // Notify nearby drivers by location. Returns array of results.
  const notifyNearbyDrivers = async (
    pickupLat: number,
    pickupLng: number,
    radiusKm?: number,
    maxDrivers?: number,
    payload?: any
  ) => {
    const endpoint = EMAIL_ENDPOINT;
    const results: Array<{ driverId: string; email?: string; status?: number; error?: string }> = [];

    const radius = typeof radiusKm === 'number' ? radiusKm : systemSettings?.notifyRadiusKm || 10;
    const limit = typeof maxDrivers === 'number' ? maxDrivers : systemSettings?.maxNotifiedDrivers || 20;

    // Collect candidate drivers with location and email permission
    const candidates = allUsers
      .filter(
        (u) =>
          u.isDriver &&
          u.driverStatus === DriverStatus.APPROVED &&
          u.email &&
          u.canReceiveEmails !== false &&
          u.location &&
          typeof u.location.lat === 'number' &&
          typeof u.location.lng === 'number'
      )
      .map((d) => ({
        id: d.id,
        email: d.email,
        lat: d.location!.lat,
        lng: d.location!.lng,
      }))
      .map((d) => ({
        ...d,
        distanceKm: haversineKm(pickupLat, pickupLng, d.lat, d.lng),
      }))
      .filter((d) => d.distanceKm <= radius)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    if (candidates.length === 0) {
      try {
        set(ref(db, `debug/emailLogs/${Date.now()}_notifyNearby_none`), {
          event: 'notifyNearbyDrivers_none_found',
          pickup: { lat: pickupLat, lng: pickupLng },
          radiusKm: radius,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
      return { notified: results };
    }

    // Send notifications in parallel (bounded by candidates.length)
    const promises = candidates.map((c) =>
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ride_nearby',
          payload: {
            pickupLat,
            pickupLng,
            driverId: c.id,
            driverEmail: c.email,
            distanceKm: c.distanceKm,
            originalPayload: payload || null,
          },
        }),
      })
        .then(async (resp) => {
          let data: any = null;
          try {
            data = await resp.json();
          } catch (e) {
            data = await resp.text();
          }
          results.push({ driverId: c.id, email: c.email, status: resp.status });
          return { driverId: c.id, status: resp.status, data };
        })
        .catch((err) => {
          results.push({ driverId: c.id, email: c.email, error: String(err) });
          return { driverId: c.id, error: String(err) };
        })
    );

    const settled = await Promise.all(promises);

    // Write debug log
    try {
      set(ref(db, `debug/emailLogs/${Date.now()}_notifyNearby`), {
        event: 'notifyNearbyDrivers_results',
        pickup: { lat: pickupLat, lng: pickupLng },
        radiusKm: radius,
        candidatesCount: candidates.length,
        results,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // ignore
    }

    return { notified: results };
  };

  const topUpWallet = (amount: number) => {
    if (!currentUser) return;
    const newTxId = `tx${Date.now()}`;
    const newTrans: Transaction = {
      id: newTxId,
      userId: currentUser.id,
      amount: amount,
      type: TransactionType.TOPUP,
      description: "Nạp tiền vào ví (Chờ duyệt)",
      createdAt: new Date().toISOString(),
      status: TransactionStatus.PENDING,
      transferContent: `NAP ${currentUser.phone?.replace(/\s/g, "")}`,
    };
    set(ref(db, `transactions/${newTxId}`), newTrans);
  };

  const withdrawWallet = (amount: number, bankInfo: string) => {
    if (!currentUser) return;
    if (currentUser.walletBalance < amount) {
      alert("Số dư không đủ để thực hiện giao dịch.");
      return;
    }

    const newBalance = currentUser.walletBalance - amount;
    update(ref(db, `users/${currentUser.id}`), { walletBalance: newBalance });

    const newTxId = `tx${Date.now()}`;
    const newTrans: Transaction = {
      id: newTxId,
      userId: currentUser.id,
      amount: -amount,
      type: TransactionType.WITHDRAW,
      description: `Rút tiền về NH`,
      transferContent: bankInfo,
      createdAt: new Date().toISOString(),
      status: TransactionStatus.PENDING,
    };
    set(ref(db, `transactions/${newTxId}`), newTrans);
  };

  const createRide = (
    rideData: Omit<
      Ride,
      | "id"
      | "driverId"
      | "status"
      | "seatsAvailable"
      | "driverName"
      | "driverAvatar"
      | "driverPhone"
    >
  ) => {
    if (!currentUser) return;
    const newRideId = `r${Date.now()}`;
    const newRide: Ride = {
      ...rideData,
      id: newRideId,
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      driverAvatar: currentUser.avatar,
      seatsAvailable: rideData.seatsTotal,
      // Nếu hệ thống yêu cầu duyệt chuyến, đặt trạng thái PENDING, ngược lại mở ngay
      status: systemSettings?.requireRideApproval
        ? (RideStatus.PENDING as Ride["status"])
        : RideStatus.OPEN,
      platformFeePercent: systemSettings?.defaultPlatformFeePercent || 0,
    };
    set(ref(db, `rides/${newRideId}`), newRide);

    // Try to notify admin via serverless email endpoint (if available)
    (async () => {
      try {
        const endpoint = EMAIL_ENDPOINT;
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ride_created",
            payload: {
              rideId: newRide.id,
              origin: newRide.origin,
              destination: newRide.destination,
              driverName: newRide.driverName,
              driverPhone: newRide.driverPhone,
              departureTime: newRide.departureTime,
              price: newRide.price,
            },
          }),
        });
      } catch (err) {
        console.warn("Failed to call email endpoint for ride creation", err);
      }
    })();
  };

  // Admin: duyệt / từ chối chuyến
  const approveRide = (rideId: string) => {
                        console.log('approveRide called', { rideId });
                        update(ref(db, `rides/${rideId}`), { status: RideStatus.OPEN })
                          .then(() => console.log('approveRide: DB update succeeded', { rideId }))
                          .catch(err => console.error('approveRide: DB update failed', err));

    // Notify driver via serverless email endpoint (if driver has email)
    (async () => {
      try {
        const ride = rides.find((r) => r.id === rideId);
        const driverId = ride?.driverId;
        const driver = driverId
          ? allUsers.find((u) => u.id === driverId)
          : null;
        const driverEmail = driver?.email;
        // Respect driver's email permission flag: only send if not explicitly disabled
        const driverAllowsEmail = driver ? driver.canReceiveEmails !== false : false;
        if (!driverEmail || !driverAllowsEmail) {
          console.log(
            "approveRide: driver has no email, skipping notification",
            { rideId, driverId }
          );
          return;
        }

        const endpoint = EMAIL_ENDPOINT;
        console.log("approveRide: calling email endpoint", {
          endpoint,
          rideId,
          driverEmail,
        });

        const resp = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "ride_approved",
            payload: {
              rideId,
              origin: ride?.origin,
              destination: ride?.destination,
              driverId,
              driverEmail,
              departureTime: ride?.departureTime,
              price: ride?.price,
            },
          }),
        });

        let data: any = null;
        try {
          data = await resp.json();
        } catch (e) {
          data = await resp.text();
        }
        console.log("approveRide: email endpoint response", {
          status: resp.status,
          data,
        });
      } catch (err) {
        console.warn("Failed to call email endpoint for ride approval", err);
      }
    })();
  };

  const rejectRide = (rideId: string, reason?: string) => {
    const updates: any = { status: RideStatus.REJECTED };
    if (reason) updates["rejectionReason"] = reason;
    update(ref(db, `rides/${rideId}`), updates);
  };

  const createRideRequest = (
    requestData: Omit<
      RideRequest,
      "id" | "passengerId" | "status" | "createdAt"
    > & { passengerId?: string }
  ) => {
    if (!currentUser) return;
    const newReqId = `req${Date.now()}`;
    const newRequest: RideRequest = {
      ...requestData,
      id: newReqId,
      passengerId: requestData.passengerId || currentUser.id,
      // If system requires admin approval for new posts, mark as PENDING. Otherwise make it immediately OPEN/visible.
      // If system requires admin approval for new posts, mark as PENDING. Otherwise mark as APPROVED (visible).
      status: systemSettings?.requireRideApproval ? "PENDING" : "APPROVED",
      createdAt: new Date().toISOString(),
      platformFeePercent: systemSettings?.defaultPlatformFeePercent || 0,
    };
    set(ref(db, `rideRequests/${newReqId}`), newRequest);

    // Notify admin that a new ride request was created and may need approval
    (async () => {
      try {
        const endpoint = EMAIL_ENDPOINT;
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'ride_request_created',
            payload: {
              requestId: newReqId,
              passengerId: newRequest.passengerId,
              passengerName: newRequest.passengerName,
              passengerPhone: newRequest.passengerPhone,
              origin: newRequest.origin,
              destination: newRequest.destination,
              pickupTime: newRequest.pickupTime,
              priceOffered: newRequest.priceOffered,
              status: newRequest.status,
              createdAt: newRequest.createdAt,
              // Thông tin bắn khách (nếu có)
              referrerId: newRequest.referrerId,
              referralFee: newRequest.referralFee,
              rideType: newRequest.rideType,
              seatsNeeded: newRequest.seatsNeeded,
            },
          }),
        });
        let data: any = null;
        try { data = await resp.json(); } catch (e) { data = await resp.text(); }
        try {
          set(ref(db, `debug/emailLogs/${Date.now()}_rideRequest_${newReqId}`), {
            event: 'ride_request_created_email',
            requestId: newReqId,
            status: resp.status,
            data,
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.warn('createRideRequest: failed to notify admin', err);
      }
    })();
  };

  // Admin: approve / reject ride request posts
  const approveRideRequest = (requestId: string) => {
    console.log('approveRideRequest called', { requestId });
    update(ref(db, `rideRequests/${requestId}`), { status: "APPROVED" })
      .then(() => console.log('approveRideRequest: DB update succeeded', { requestId }))
      .catch((err) => console.error('approveRideRequest: DB update failed', err));

    // Notify driver (if assigned) via serverless email endpoint
    (async () => {
      try {
        const req = rideRequests.find((r) => r.id === requestId);
        if (!req) {
          console.log('approveRideRequest: request not found, skipping email', { requestId });
          // write debug entry to Firebase so we can inspect from server/UI
          try {
            set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
              event: 'approveRideRequest_missing_request',
              requestId,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.warn('approveRideRequest: failed writing debug log', err);
          }
          return;
        }

        // write debug entry that approval started
        try {
          set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
            event: 'approveRideRequest_started',
            requestId,
            requestSnapshot: req,
            timestamp: new Date().toISOString(),
            adminId: currentUserId || null,
          });
        } catch (err) {
          console.warn('approveRideRequest: failed writing debug start log', err);
        }

        // Prefer explicit driverId, fall back to referrerId if present. If none,
        // broadcast this approved request to all approved drivers with email.
        const targetDriverId = req.driverId || req.referrerId;
        const endpoint = EMAIL_ENDPOINT;

        if (targetDriverId) {
          const driver = allUsers.find((u) => u.id === targetDriverId);
          const driverEmail = driver?.email;
          const driverAllowsEmail = driver ? driver.canReceiveEmails !== false : false;
          if (!driverEmail) {
            console.log('approveRideRequest: target driver has no email, skipping notification', { requestId, targetDriverId });
          } else if (!driverAllowsEmail) {
            console.log('approveRideRequest: target driver is not allowed to receive emails, skipping', { requestId, targetDriverId });
          } else {
            console.log('approveRideRequest: calling email endpoint for assigned driver', { endpoint, requestId, driverEmail });
            const resp = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'ride_approved',
                payload: {
                  rideId: requestId,
                  origin: req.origin,
                  destination: req.destination,
                  driverId: targetDriverId,
                  driverEmail,
                  departureTime: req.pickupTime,
                  price: req.priceOffered,
                },
              }),
            });
            let data: any = null;
            try {
              data = await resp.json();
            } catch (e) {
              data = await resp.text();
            }
            console.log('approveRideRequest: email endpoint response', { status: resp.status, data, targetDriverId });
            try {
              set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
                event: 'approveRideRequest_email_response',
                requestId,
                targetDriverId,
                driverEmail,
                status: resp.status,
                data,
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('approveRideRequest: failed writing debug response log', err);
            }
          }
        } else {
          // No specific driver assigned — broadcast to approved drivers
          // Only include drivers who have an email and who allow receiving emails
          // No specific driver assigned — notify nearby drivers by location if available
          // If request does not include a pickup location coordinates, fall back to previous broadcast behavior
          if (req && typeof req.pickupLat === 'number' && typeof req.pickupLng === 'number') {
            console.log('approveRideRequest: calling notifyNearbyDrivers', { requestId, pickupLat: req.pickupLat, pickupLng: req.pickupLng });
            try {
              const notifyRes = await notifyNearbyDrivers(req.pickupLat, req.pickupLng, undefined, undefined, {
                requestId,
                origin: req.origin,
                destination: req.destination,
                pickupTime: req.pickupTime,
                price: req.priceOffered,
              });
              console.log('approveRideRequest: notifyNearbyDrivers results', { requestId, notifyRes });
              try {
                set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
                  event: 'approveRideRequest_notifyNearby_results',
                  requestId,
                  notifyRes,
                  timestamp: new Date().toISOString(),
                });
              } catch (err) {
                console.warn('approveRideRequest: failed writing notifyNearby debug log', err);
              }
            } catch (err) {
              console.warn('approveRideRequest: notifyNearbyDrivers failed', err);
              try {
                set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
                  event: 'approveRideRequest_notifyNearby_error',
                  requestId,
                  error: String(err),
                  timestamp: new Date().toISOString(),
                });
              } catch (e) {}
            }
          } else {
            // Fallback: original broadcast to all approved drivers with email permission
            const drivers = allUsers.filter(
              (u) => u.isDriver && u.driverStatus === DriverStatus.APPROVED && u.email && (u.canReceiveEmails !== false)
            );
            if (!drivers || drivers.length === 0) {
              console.log('approveRideRequest: no approved drivers with email found, skipping broadcast', { requestId });
              return;
            }

            console.log('approveRideRequest: broadcasting to drivers (fallback)', { count: drivers.length, requestId });

            const promises = drivers.map((d) =>
              fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'ride_approved',
                  payload: {
                    rideId: requestId,
                    origin: req.origin,
                    destination: req.destination,
                    driverId: d.id,
                    driverEmail: d.email,
                    departureTime: req.pickupTime,
                    price: req.priceOffered,
                  },
                }),
              }).then(async (resp) => {
                let data: any = null;
                try {
                  data = await resp.json();
                } catch (e) {
                  data = await resp.text();
                }
                return { driverId: d.id, email: d.email, status: resp.status, data };
              }).catch((err) => ({ driverId: d.id, email: d.email, error: String(err) }))
            );

            const results = await Promise.all(promises);
            console.log('approveRideRequest: broadcast results (fallback)', { requestId, results });
            try {
              set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
                event: 'approveRideRequest_broadcast_results',
                requestId,
                results,
                timestamp: new Date().toISOString(),
              });
            } catch (err) {
              console.warn('approveRideRequest: failed writing broadcast debug log', err);
            }
          }
        }
      } catch (err) {
        console.warn('approveRideRequest: failed to call email endpoint', err);
        try {
          set(ref(db, `debug/emailLogs/${Date.now()}_${requestId}`), {
            event: 'approveRideRequest_error',
            requestId,
            error: String(err),
            timestamp: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('approveRideRequest: failed writing error debug log', e);
        }
      }
    })();
  };

  const rejectRideRequest = (requestId: string, reason?: string) => {
    const updates: any = { status: "REJECTED" };
    if (reason) updates["rejectionReason"] = reason;
    update(ref(db, `rideRequests/${requestId}`), updates);
  };

  const cancelRideRequest = (requestId: string) => {
    update(ref(db, `rideRequests/${requestId}`), { status: "CANCELLED" });
  };

  const acceptRideRequest = (requestId: string) => {
    if (!currentUser) return;
    update(ref(db, `rideRequests/${requestId}`), {
      status: "ACCEPTED",
      driverId: currentUser.id,
      driverName: currentUser.name,
      driverPhone: currentUser.phone,
      driverAvatar: currentUser.avatar,
    });
  };

  const completeRideRequest = (requestId: string) => {
    if (!currentUser) return;
    const request = rideRequests.find((r) => r.id === requestId);
    if (!request) return;

    // Determine platform fee percent (request override -> system default -> 0)
    const feePercent =
      typeof request.platformFeePercent === "number"
        ? request.platformFeePercent
        : typeof systemSettings?.defaultPlatformFeePercent === "number"
        ? systemSettings!.defaultPlatformFeePercent
        : 0;

    const platformFee = (request.priceOffered || 0) * (feePercent || 0);
    const referralFee = request.referralFee || 0;
    const totalDeduction = platformFee + referralFee;

    // 1. Update Request Status
    update(ref(db, `rideRequests/${requestId}`), { status: "COMPLETED" });

    // 2. Deduct from Driver Wallet
    update(ref(db, `users/${currentUser.id}`), {
      walletBalance: currentUser.walletBalance - totalDeduction,
    });

    // 3. Create Fee Transaction (driver side)
    const txFeeId = `tx${Date.now()}_fee`;
    set(ref(db, `transactions/${txFeeId}`), {
      id: txFeeId,
      userId: currentUser.id,
      amount: -platformFee,
      type: TransactionType.RIDE_FEE,
      description: `Phí nền tảng (${(feePercent * 100).toFixed(2)}%) cho chuyến ${request.origin} - ${request.destination}`,
      createdAt: new Date().toISOString(),
      relatedRideId: requestId,
      status: TransactionStatus.COMPLETED,
    });

    // 3b. Credit the platform (admin) wallet with the collected fee
    try {
      const admin = allUsers.find((u) => u.id === "admin");
      if (admin) {
        update(ref(db, `users/${admin.id}`), {
          walletBalance: (admin.walletBalance || 0) + platformFee,
        });

        const txAdminId = `tx${Date.now()}_platform_recv`;
        set(ref(db, `transactions/${txAdminId}`), {
          id: txAdminId,
          userId: admin.id,
          amount: platformFee,
          type: TransactionType.COMMISSION_RECEIVED,
          description: `Thu phí nền tảng (${(feePercent * 100).toFixed(2)}%) từ chuyến ${request.origin} - ${request.destination}`,
          createdAt: new Date().toISOString(),
          relatedRideId: requestId,
          status: TransactionStatus.COMPLETED,
        });
      } else {
        console.warn("completeRideRequest: admin user not found, skipping platform credit");
      }
    } catch (err) {
      console.warn("completeRideRequest: failed to credit admin wallet", err);
    }

    // 4. Handle Commission
    if (referralFee > 0) {
      const txCommPaidId = `tx${Date.now()}_comm_paid`;
      set(ref(db, `transactions/${txCommPaidId}`), {
        id: txCommPaidId,
        userId: currentUser.id,
        amount: -referralFee,
        type: TransactionType.COMMISSION_PAID,
        description: `Trả hoa hồng cho chuyến ${request.origin} - ${request.destination}`,
        createdAt: new Date().toISOString(),
        relatedRideId: requestId,
        status: TransactionStatus.COMPLETED,
      });

      if (request.referrerId && request.referrerId !== currentUser.id) {
        const referrer = allUsers.find((u) => u.id === request.referrerId);
        if (referrer) {
          update(ref(db, `users/${referrer.id}`), {
            walletBalance: (referrer.walletBalance || 0) + referralFee,
          });

          const txCommRecvId = `tx${Date.now()}_comm_recv`;
          set(ref(db, `transactions/${txCommRecvId}`), {
            id: txCommRecvId,
            userId: request.referrerId,
            amount: referralFee,
            type: TransactionType.COMMISSION_RECEIVED,
            description: `Nhận hoa hồng từ chuyến ${request.origin} - ${request.destination}`,
            createdAt: new Date().toISOString(),
            relatedRideId: requestId,
            status: TransactionStatus.COMPLETED,
          });
        }
      }
    }
  };

  const cancelAcceptedRequest = (requestId: string) => {
    update(ref(db, `rideRequests/${requestId}`), {
      status: "PENDING",
      driverId: null,
      driverName: null,
      driverPhone: null,
      driverAvatar: null,
    });
  };

  const searchRides = (criteria: SearchCriteria) => {
    return rides.filter((ride) => {
      const matchOrigin =
        !criteria.origin ||
        ride.origin.toLowerCase().includes(criteria.origin.toLowerCase());
      const matchDest =
        !criteria.destination ||
        ride.destination
          .toLowerCase()
          .includes(criteria.destination.toLowerCase());
      const matchDate =
        !criteria.date || ride.departureTime.startsWith(criteria.date);
      const matchType =
        !criteria.rideType ||
        criteria.rideType === "ALL" ||
        ride.rideType === criteria.rideType;
      const matchPrice = !criteria.maxPrice || ride.price <= criteria.maxPrice;
      const matchSpecificPickup =
        !criteria.specificPickup ||
        (ride.description &&
          ride.description
            .toLowerCase()
            .includes(criteria.specificPickup.toLowerCase())) ||
        ride.origin
          .toLowerCase()
          .includes(criteria.specificPickup.toLowerCase());
      const matchSpecificDropoff =
        !criteria.specificDropoff ||
        (ride.description &&
          ride.description
            .toLowerCase()
            .includes(criteria.specificDropoff.toLowerCase())) ||
        ride.destination
          .toLowerCase()
          .includes(criteria.specificDropoff.toLowerCase());

      return (
        matchOrigin &&
        matchDest &&
        matchDate &&
        matchType &&
        matchPrice &&
        matchSpecificPickup &&
        matchSpecificDropoff &&
        ride.status === RideStatus.OPEN
      );
    });
  };

  const bookRide = (rideId: string, seats: number) => {
    if (!currentUser) return;
    const ride = rides.find((r) => r.id === rideId);
    if (!ride || ride.seatsAvailable < seats) return;

    const newBookingId = `b${Date.now()}`;
    const newBooking: Booking = {
      id: newBookingId,
      rideId,
      passengerId: currentUser.id,
      passengerName: currentUser.name,
      passengerPhone: currentUser.phone,
      seatsBooked: seats,
      status: BookingStatus.PENDING,
      bookingTime: new Date().toISOString(),
      totalPrice: ride.price * seats,
    };

    set(ref(db, `bookings/${newBookingId}`), newBooking);
    update(ref(db, `rides/${rideId}`), {
      seatsAvailable: ride.seatsAvailable - seats,
    });
  };

  const confirmBooking = (bookingId: string) => {
    update(ref(db, `bookings/${bookingId}`), {
      status: BookingStatus.CONFIRMED,
    });
  };

  const cancelBooking = (bookingId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    update(ref(db, `bookings/${bookingId}`), {
      status: BookingStatus.CANCELLED,
    });

    const ride = rides.find((r) => r.id === booking.rideId);
    if (ride) {
      update(ref(db, `rides/${ride.id}`), {
        seatsAvailable: ride.seatsAvailable + booking.seatsBooked,
      });
    }
  };

  const cancelRide = (rideId: string) => {
    update(ref(db, `rides/${rideId}`), { status: RideStatus.CANCELLED });
  };

  // Update platform fee percent for a ride (percent is decimal fraction, e.g. 0.01 = 1%)
  const updateRideFee = (rideId: string, percent: number) => {
    if (!rideId) return;
    update(ref(db, `rides/${rideId}`), { platformFeePercent: percent });
  };

  return (
    <AppContext.Provider
      value={{
        isAppReady,
        currentUser,
        allUsers,
        rides,
        bookings,
        rideRequests,
        transactions,
        systemSettings,
        login,
        logout,
        updateUserProfile,
        refreshUserData,
        registerDriver,
        approveDriver,
        rejectDriver,
        grantDriverPermission,
        revokeDriverPermission,
        grantEmailPermission,
        revokeEmailPermission,
        approveRide,
        rejectRide,
        approveRideRequest,
        rejectRideRequest,
        blockUser,
        adminUpdateWallet,
        approveTransaction,
        rejectTransaction,
        updateSystemSettings,
        createRide,
        createRideRequest,
        searchRides,
        bookRide,
        confirmBooking,
        cancelBooking,
        cancelRide,
        cancelRideRequest,
        acceptRideRequest,
        completeRideRequest,
        cancelAcceptedRequest,
        topUpWallet,
        withdrawWallet,
        updateDriverLocation,
        notifyNearbyDrivers,
        updateRideFee,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
