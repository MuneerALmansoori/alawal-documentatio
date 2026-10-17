import { componentPages } from './component-pages.js'

export const navigation = [
  {
    label: 'مقدمة',
    icon: 'Home',
    items: [
      { title: 'مقدمة', link: '/intro', icon: 'Home' },
      { title: 'البدء السريع', link: '/quick-start', icon: 'Rocket' }
    ]
  },
  {
    label: 'تخصيص التصميم',
    icon: 'Palette',
    open: true,
    items: [
      { title: 'نظرة عامة', link: '/design/overview', icon: 'LayoutDashboard' },
      { title: 'تخصيص ألوان الثيم', link: '/design/colors', icon: 'Palette' },
      { title: 'الخطوط والتصميم', link: '/design/typography', icon: 'Type' },
      { title: 'الهيدر والقوائم', link: '/design/header', icon: 'PanelTop' },
      { title: 'البانرات والأقسام', link: '/design/sections', icon: 'PanelsTopLeft' },
      {
        title: 'تخصيص العناصر',
        link: '/design/components',
        icon: 'Blocks',
        children: [
          ...componentPages.map(item => ({ title: item.name, link: `/design/components/${item.slug}`, icon: 'Blocks' }))
        ]
      }
    ]
  },
  {
    label: 'صفحات المنتجات',
    icon: 'ShoppingBag',
    items: [
      { title: 'صفحة تفاصيل المنتج', link: '/products/page', icon: 'ShoppingBag' },
      { title: 'بطاقات المنتجات', link: '/products/cards', icon: 'LayoutGrid' },
      { title: 'وسائل الدفع', link: '/products/payments', icon: 'CreditCard' }
    ]
  },
  {
    label: 'الصفحات الأخرى',
    icon: 'FileText',
    items: [
      { title: 'صفحة التصنيفات', link: '/pages/categories', icon: 'ListFilter' },
      { title: 'السلة والشراء', link: '/pages/cart', icon: 'ShoppingCart' }
    ]
  },
  {
    label: 'تهيئة الجوال',
    icon: 'Smartphone',
    items: [
      { title: 'تجربة الهاتف والتابلت', link: '/mobile', icon: 'Smartphone' }
    ]
  },
  {
    label: 'المؤثرات والحركات',
    icon: 'Sparkles',
    items: [
      { title: 'الحركات والمؤثرات', link: '/advanced/motion', icon: 'Sparkles' }
    ]
  },
  {
    label: 'الإعدادات المتقدمة',
    icon: 'Settings',
    items: [
      { title: 'الإعدادات المتقدمة', link: '/advanced/settings', icon: 'Settings' }
    ]
  },
  {
    label: 'الأسئلة الشائعة',
    icon: 'CircleHelp',
    items: [
      { title: 'الأسئلة الشائعة', link: '/faq', icon: 'CircleHelp' }
    ]
  },
  {
    label: 'حل المشكلات',
    icon: 'Wrench',
    items: [
      { title: 'حل المشكلات', link: '/troubleshooting', icon: 'Wrench' }
    ]
  },
  {
    label: 'قائمة التحديثات',
    icon: 'List',
    items: [
      { title: 'قائمة التحديثات', link: '/changelog', icon: 'List' }
    ]
  }
]

export const extraPages = [
  { title: 'دليل عناصر الثيم', link: '/components', section: 'العناصر', icon: 'Blocks' },
  { title: 'الدعم والمساعدة', link: '/support', section: 'الدعم', icon: 'Headphones' }
]

export const pages = navigation
  .flatMap(group => group.items.flatMap(item => [
    { ...item, children: undefined, section: group.label },
    ...(item.children || []).map(child => ({ ...child, section: item.title }))
  ]))
  .concat(extraPages)

export const quickLinks = [
  { title: 'البدء السريع', subtitle: 'جهز المتجر خلال دقائق', link: '/quick-start', icon: 'Rocket', tone: 'violet' },
  { title: 'تخصيص التصميم', subtitle: 'الألوان والخطوط والهوية', link: '/design/colors', icon: 'Palette', tone: 'pink' },
  { title: 'صفحات المنتجات', subtitle: 'إعدادات تجربة الشراء', link: '/products/page', icon: 'ShoppingBag', tone: 'orange' },
  { title: 'تهيئة الجوال', subtitle: 'تحسين نسخة الهاتف', link: '/mobile', icon: 'Smartphone', tone: 'navy' }
]
