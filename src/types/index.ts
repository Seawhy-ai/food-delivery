// 餐厅相关类型
export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  rating: number;
  reviewCount: number;
  deliveryFee: number;
  deliveryTime: { min: number; max: number };
  distance: number;
  isFavorite: boolean;
  categories: string[];
  dishes: Dish[];
  address: string;
  phone: string;
  description: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  popularity: number;
  specs?: Spec[];
}

export interface Spec {
  id: string;
  name: string;
  options: SpecOption[];
}

export interface SpecOption {
  id: string;
  name: string;
  priceAdjust?: number;
}

// 购物车相关
export interface CartItem {
  id: string;
  dishId: string;
  restaurantId: string;
  name: string;
  price: number;
  quantity: number;
  specs?: Record<string, string>;
  image: string;
}

export interface Cart {
  restaurantId: string;
  items: CartItem[];
}

// 订单相关
export interface Order {
  id: string;
  restaurantId: string;
  restaurantName: string;
  items: OrderItem[];
  totalPrice: number;
  deliveryFee: number;
  discount: number;
  couponId?: string;
  address: Address;
  status: 'pending' | 'confirmed' | 'cooking' | 'delivering' | 'completed' | 'cancelled';
  createdAt: Date;
  review?: Review;
  estimatedDelivery?: number; // 分钟
}

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  specs?: Record<string, string>;
  image: string;
}

export interface Review {
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: Date;
}

// 地址相关
export interface Address {
  id: string;
  name: string; // 地址标签（家/公司等）
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
}

// 优惠券
export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'discount' | 'fullMinus'; // 折扣或满减
  value: number; // 折扣百分比或满减金额
  minAmount?: number; // 最低满足金额
  validUntil: Date;
  used: boolean;
  restaurantId?: string; // 如果为空则通用
}

// 用户相关
export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  favorites: string[]; // 餐厅ID
  coupons: Coupon[];
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}
