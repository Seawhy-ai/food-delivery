import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Search, Heart } from 'lucide-react';
import { mockRestaurants } from '../mockData';
import { useUserStore } from '../store/useUserStore';

export const Home = () => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'sales'>('distance');
  const favorites = useUserStore((state) => state.favorites);
  const toggleFavorite = useUserStore((state) => state.toggleFavorite);

  const filteredRestaurants = useMemo(() => {
    let result = [...mockRestaurants];

    if (searchText) {
      const text = searchText.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(text) ||
          r.description.toLowerCase().includes(text) ||
          r.categories.some((c) => c.toLowerCase().includes(text))
      );
    }

    result.sort((a, b) => {
      if (sortBy === 'distance') return a.distance - b.distance;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'sales') {
        const aSales = a.dishes.reduce((sum, d) => sum + d.popularity, 0);
        const bSales = b.dishes.reduce((sum, d) => sum + d.popularity, 0);
        return bSales - aSales;
      }
      return 0;
    });

    return result;
  }, [searchText, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 搜索栏 */}
      <div className="sticky top-16 z-40 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={t('home.search')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
          </div>

          {/* 排序按钮 */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {['distance', 'rating', 'sales'].map((sort) => (
              <button
                key={sort}
                onClick={() => setSortBy(sort as typeof sortBy)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  sortBy === sort
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {t(`home.${sort}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 餐厅列表 */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t('home.no_data')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRestaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurant/${restaurant.id}`}
                className="card p-4 hover:shadow-lg transition-all duration-200"
              >
                <div className="relative mb-4">
                  <div className="text-6xl text-center mb-2">{restaurant.logo}</div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleFavorite(restaurant.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-700 rounded-full shadow-md hover:shadow-lg"
                  >
                    <Heart
                      size={20}
                      fill={favorites.includes(restaurant.id) ? '#ef4444' : 'none'}
                      color={favorites.includes(restaurant.id) ? '#ef4444' : '#999'}
                    />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {restaurant.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {restaurant.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-3">
                  {restaurant.categories.slice(0, 2).map((cat) => (
                    <span
                      key={cat}
                      className="badge badge-success text-xs"
                    >
                      {cat}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex gap-4">
                    <span>⭐ {restaurant.rating}</span>
                    <span>{restaurant.reviewCount} {t('restaurant.reviews')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400">
                  <span>配送 ¥{restaurant.deliveryFee}</span>
                  <span>{restaurant.deliveryTime.min}-{restaurant.deliveryTime.max}分钟</span>
                  <span>{restaurant.distance.toFixed(1)}km</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
