import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrderStore } from '../store/useOrderStore';

export const Orders = () => {
  const { t } = useTranslation();
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate = useNavigate();
  const orders = useOrderStore((state) => state.getOrders());
  const updateOrderStatus = useOrderStore((state) => state.updateOrderStatus);
  const getOrderById = useOrderStore((state) => state.getOrderById);

  const [tab, setTab] = useState<'pending' | 'completed'>('pending');
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const selectedOrder = orderId ? getOrderById(orderId) : null;

  if (orderId && selectedOrder) {
    const handleCancelOrder = () => {
      if (selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') {
        updateOrderStatus(orderId, 'cancelled');
        navigate('/orders');
      }
    };

    const handleSubmitReview = () => {
      if (rating > 0) {
        updateOrderStatus(orderId, 'completed');
        navigate('/orders');
      }
    };

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-8"
          >
            <ArrowLeft size={20} />
            {t('common.back')}
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            {t('orders.detail')}
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 订单信息 */}
            <div className="lg:col-span-2 space-y-4">
              {/* 状态 */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-xl text-gray-900 dark:text-white">
                    {t(`orders.status_${selectedOrder.status}`)}
                  </h2>
                  <span className={`badge ${
                    selectedOrder.status === 'completed'
                      ? 'badge-success'
                      : selectedOrder.status === 'cancelled'
                      ? 'badge-error'
                      : 'badge-warning'
                  }`}>
                    {t(`orders.status_${selectedOrder.status}`)}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('orders.order_number')}: {selectedOrder.id}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('orders.order_time')}:{' '}
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>

              {/* 配送进度 */}
              {selectedOrder.status !== 'cancelled' && (
                <div className="card p-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    {t('orders.delivery_info')}
                  </h3>
                  <div className="space-y-3">
                    {['confirmed', 'cooking', 'delivering', 'completed'].map(
                      (status, index) => (
                        <div
                          key={status}
                          className="flex items-center gap-4"
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                              ['pending', 'confirmed', 'cooking', 'delivering', 'completed']
                                .indexOf(selectedOrder.status) >= index
                                ? 'bg-green-500'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            ✓
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {t(`orders.status_${status}`)}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 商品列表 */}
              <div className="card p-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  {t('orders.items')}
                </h3>
                <div className="space-y-4">
                  {selectedOrder.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
                    >
                      <div className="text-3xl">{item.image}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </h4>
                        {item.specs && Object.keys(item.specs).length > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {Object.values(item.specs).join(', ')}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          ¥{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        ¥{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 商家信息 */}
              <div className="card p-6">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  {t('orders.shop_info')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 font-semibold mb-2">
                  {selectedOrder.restaurantName}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {selectedOrder.address.address}
                </p>
              </div>

              {/* 评价 */}
              {selectedOrder.status === 'completed' && !selectedOrder.review && (
                <div className="card p-6">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                    {t('orders.rate')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        评分
                      </p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="text-3xl hover:scale-110 transition-transform"
                          >
                            {star <= rating ? '⭐' : '☆'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        评价
                      </p>
                      <textarea
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="分享您的用餐体验..."
                        className="input w-full h-24 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleSubmitReview}
                      disabled={rating === 0}
                      className="btn-primary w-full disabled:opacity-50"
                    >
                      提交评价
                    </button>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              {['pending', 'confirmed'].includes(selectedOrder.status) && (
                <button
                  onClick={handleCancelOrder}
                  className="btn-danger w-full"
                >
                  {t('orders.cancel')}
                </button>
              )}
            </div>

            {/* 订单总结 */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-4">
                  金额明细
                </h3>
                <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>商品</span>
                    <span>¥{selectedOrder.totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>配送费</span>
                    <span>¥{selectedOrder.deliveryFee.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>优惠</span>
                      <span>-¥{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 dark:text-white">
                    合计
                  </span>
                  <span className="text-2xl font-bold text-blue-500">
                    ¥
                    {(
                      selectedOrder.totalPrice +
                      selectedOrder.deliveryFee -
                      selectedOrder.discount
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('orders.title')}
        </h1>

        {/* 标签页 */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          {['pending', 'completed'].map((t_tab) => (
            <button
              key={t_tab}
              onClick={() => setTab(t_tab as typeof tab)}
              className={`pb-2 font-medium transition-colors ${
                tab === t_tab
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t(`orders.${t_tab}`)}
            </button>
          ))}
        </div>

        {/* 订单列表 */}
        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-4">📋</p>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('orders.empty')}
            </h2>
            <Link to="/" className="btn-primary inline-block">
              去点餐
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders
              .filter((order) => {
                if (tab === 'pending') {
                  return ['pending', 'confirmed', 'cooking', 'delivering'].includes(
                    order.status
                  );
                }
                return order.status === 'completed' || order.status === 'cancelled';
              })
              .map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="card p-4 hover:shadow-lg transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {order.restaurantName}
                    </h3>
                    <span
                      className={`badge text-xs ${
                        order.status === 'completed'
                          ? 'badge-success'
                          : order.status === 'cancelled'
                          ? 'badge-error'
                          : 'badge-warning'
                      }`}
                    >
                      {t(`orders.status_${order.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {t('orders.total', { count: order.items.length })}
                  </p>
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <span className="text-lg font-bold text-blue-500">
                      ¥
                      {(
                        order.totalPrice +
                        order.deliveryFee -
                        order.discount
                      ).toFixed(2)}
                    </span>
                  </div>
                </Link>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
