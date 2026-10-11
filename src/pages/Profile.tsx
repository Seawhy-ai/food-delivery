import { useTranslation } from 'react-i18next';
import { useUserStore } from '../store/useUserStore';
import { useTheme } from '../hooks/useTheme';
import { Link } from 'react-router-dom';
import { ChevronRight, LogOut } from 'lucide-react';
import { mockUser } from '../mockData';

export const Profile = () => {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const favorites = useUserStore((state) => state.favorites);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme as 'light' | 'dark' | 'system');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 用户头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="text-6xl">👤</div>
            <div>
              <h1 className="text-2xl font-bold">{mockUser.name}</h1>
              <p className="text-blue-100">{mockUser.phone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 快速导航 */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Link
            to="/orders"
            className="card p-6 text-center hover:shadow-lg transition-shadow"
          >
            <p className="text-3xl mb-2">📋</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('nav.orders')}
            </p>
          </Link>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-3xl mb-2">❤️</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('profile.favorites')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {favorites.length}
            </p>
          </div>
          <div className="card p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
            <p className="text-3xl mb-2">🎟️</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {t('profile.coupons')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              5
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* 地址管理 */}
          <div className="card p-4">
            <Link
              to="/addresses"
              className="flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📍</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('profile.addresses')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    管理收货地址
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </Link>
          </div>

          {/* 语言设置 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t('profile.language')}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { code: 'zh-CN', label: '中文' },
                { code: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    i18n.language === lang.code
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* 主题设置 */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎨</span>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {t('profile.theme')}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'light', label: t('profile.light') },
                { value: 'dark', label: t('profile.dark') },
                { value: 'system', label: t('profile.system') },
              ].map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => handleThemeChange(themeOption.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === themeOption.value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {themeOption.label}
                </button>
              ))}
            </div>
          </div>

          {/* 关于 */}
          <div className="card p-4">
            <div className="flex items-center justify-between hover:opacity-70 transition-opacity">
              <div className="flex items-center gap-3">
                <span className="text-2xl">ℹ️</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {t('profile.about')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    关于美团外卖
                  </p>
                </div>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>

          {/* 退出登录 */}
          <button className="card p-4 w-full hover:bg-red-50 dark:hover:bg-red-900 transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <p className="font-semibold text-red-500">
                {t('profile.logout')}
              </p>
            </div>
            <LogOut className="text-red-500" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
