import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/alawal-documentatio/',
  lang: 'ar-SA',
  title: 'مركز توثيق الأول',
  description: 'الدليل الرسمي لتخصيص واستخدام ثيم الأول على منصة سلة',
  cleanUrls: true,
  srcExclude: ['README.md'],
  sitemap: {
    hostname: 'https://muneeralmansoori.github.io/alawal-documentatio/'
  },
  head: [
    ['meta', { name: 'theme-color', content: '#7948F5' }],
    ['meta', { name: 'color-scheme', content: 'light dark' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap' }]
  ],
  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'البحث في التوثيق', buttonAriaLabel: 'البحث في التوثيق' },
              modal: {
                noResultsText: 'لا توجد نتائج مطابقة',
                resetButtonTitle: 'مسح البحث',
                footer: { selectText: 'اختيار', navigateText: 'تنقل', closeText: 'إغلاق' }
              }
            }
          }
        }
      }
    }
  },
  transformHtml(code) {
    return code.replace(/<html lang="ar-SA"(?: dir="[^"]*")?/, '<html lang="ar-SA" dir="rtl"')
  }
})
