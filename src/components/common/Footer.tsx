import { useTranslation } from 'react-i18next';

export const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🍱 {t('app.title')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('app.slogan')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
              {t('profile.about')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-blue-500">关于美团</a></li>
              <li><a href="#" className="hover:text-blue-500">投资者关系</a></li>
              <li><a href="#" className="hover:text-blue-500">加入我们</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">帮助中心</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li><a href="#" className="hover:text-blue-500">常见问题</a></li>
              <li><a href="#" className="hover:text-blue-500">意见反馈</a></li>
              <li><a href="#" className="hover:text-blue-500">联系我们</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4">下载应用</h4>
            <div className="flex gap-2 text-2xl">
              <span>📱</span>
              <span>🖥️</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            © {currentYear} {t('app.title')}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
