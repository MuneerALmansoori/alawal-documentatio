<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Content, useData, useRoute, useRouter, withBase } from 'vitepress'
import {
  Blocks,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  CreditCard,
  FileText,
  Headphones,
  Home,
  Info,
  LayoutDashboard,
  LayoutGrid,
  List,
  ListFilter,
  Menu,
  MessageCircle,
  Moon,
  Palette,
  PanelTop,
  PanelsTopLeft,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Sun,
  Type,
  Wrench,
  X
} from '@lucide/vue'
import { navigation as staticNavigation, pages as staticPages, quickLinks } from './site-data.js'
import { data as searchablePages } from './search.data.mjs'
import siteSettings from '../../content/site-settings.json'
import WhatsAppIcon from './components/WhatsAppIcon.vue'
import { buildWhatsAppUrl } from './whatsapp.js'

const icons = {
  Blocks,
  BookOpen,
  CircleHelp,
  CreditCard,
  FileText,
  Headphones,
  Home,
  LayoutDashboard,
  LayoutGrid,
  List,
  ListFilter,
  Palette,
  PanelTop,
  PanelsTopLeft,
  Rocket,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Type,
  Wrench,
  'book-open': BookOpen,
  'circle-help': CircleHelp,
  'credit-card': CreditCard,
  'file-text': FileText,
  'headphones': Headphones,
  'layout-template': LayoutDashboard,
  'layout-grid': LayoutGrid,
  'list-filter': ListFilter,
  'panel-top': PanelTop,
  'panels-top-left': PanelsTopLeft,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  'smartphone': Smartphone,
  'sparkles': Sparkles,
  'type': Type,
  'wrench': Wrench,
  'palette': Palette,
  'rocket': Rocket,
  'settings': Settings,
  'home': Home,
  'list': List,
  'blocks': Blocks
}

const { frontmatter, page } = useData()
const route = useRoute()
const router = useRouter()
const customPages = computed(() => searchablePages
  .filter(item => item.link.startsWith('/content/'))
  .sort((a, b) => a.sectionOrder - b.sectionOrder || a.pageOrder - b.pageOrder || a.title.localeCompare(b.title, 'ar')))
const sidebarNavigation = computed(() => {
  const groups = staticNavigation.map((group, groupIndex) => ({
    ...group,
    sortOrder: groupIndex,
    items: group.items.map((item, itemIndex) => ({ ...item, sortOrder: itemIndex }))
  }))

  customPages.value
    .filter(item => !item.navigationHidden)
    .forEach(item => {
      let group = groups.find(candidate => candidate.label === item.section)
      if (!group) {
        group = {
          label: item.section,
          icon: item.icon || 'BookOpen',
          sortOrder: staticNavigation.length + item.sectionOrder,
          items: []
        }
        groups.push(group)
      }

      if (!group.items.some(candidate => candidate.link === item.link)) {
        group.items.push({
          title: item.title,
          link: item.link,
          icon: item.icon || 'book-open',
          sortOrder: item.pageOrder
        })
      }
    })

  return groups
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(group => ({ ...group, items: group.items.sort((a, b) => a.sortOrder - b.sortOrder) }))
})
const allPages = computed(() => {
  const knownLinks = new Set(staticPages.map(item => item.link))
  return staticPages.concat(customPages.value.filter(item => !knownLinks.has(item.link)))
})
const sidebarOpen = ref(false)
const isDark = ref(false)
const searchQuery = ref('')
const searchOpen = ref(false)
const whatsappUrl = computed(() => buildWhatsAppUrl(
  siteSettings.whatsappNumber,
  'مرحباً، أرغب في الاستفسار عن ثيم الأول.'
))
const openGroups = ref(new Set(staticNavigation.map((group, index) => group.open ? index : -1).filter(index => index >= 0)))
const openSubgroups = ref(new Set())

const normalizedPath = computed(() => route.path.replace(/\.html$/, '').replace(/\/$/, '') || '/')
const isHome = computed(() => normalizedPath.value === '/')
const currentPage = computed(() => allPages.value.find(item => item.link === normalizedPath.value))
const sectionLabel = computed(() => frontmatter.value.section || currentPage.value?.section || 'التوثيق')
const pageTitle = computed(() => frontmatter.value.title || page.value.title || 'مركز توثيق الأول')
const pageDescription = computed(() => frontmatter.value.description || 'شرح عملي لإعداد وتخصيص ثيم الأول.')
const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase('ar')
  if (!query) return []
  return searchablePages
    .filter(item => `${item.title} ${item.description} ${item.section} ${item.content}`.toLocaleLowerCase('ar').includes(query))
    .slice(0, 7)
})

function iconFor(name) {
  return icons[name] || BookOpen
}

function isActive(link) {
  return normalizedPath.value === link
}

function toggleGroup(index) {
  const next = new Set(openGroups.value)
  next.has(index) ? next.delete(index) : next.add(index)
  openGroups.value = next
}

function itemIsActive(item) {
  return isActive(item.link) || (item.children || []).some(child => isActive(child.link))
}

function toggleSubgroup(link) {
  const next = new Set(openSubgroups.value)
  next.has(link) ? next.delete(link) : next.add(link)
  openSubgroups.value = next
}

function openCurrentGroup() {
  const groupIndex = sidebarNavigation.value.findIndex(group => group.items.some(item => itemIsActive(item)))
  if (groupIndex >= 0) openGroups.value = new Set([...openGroups.value, groupIndex])

  const activeSubgroup = sidebarNavigation.value
    .flatMap(group => group.items)
    .find(item => item.children?.length && itemIsActive(item))
  if (activeSubgroup) openSubgroups.value = new Set([...openSubgroups.value, activeSubgroup.link])
}

function go(link) {
  searchQuery.value = ''
  sidebarOpen.value = false
  router.go(withBase(link))
}

function focusSearch() {
  searchOpen.value = true
  document.querySelector('#docs-search')?.focus()
}

function closeSearch() {
  window.setTimeout(() => { searchOpen.value = false }, 120)
}

function setTheme(dark) {
  isDark.value = dark
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  localStorage.setItem('alawal-docs-theme', dark ? 'dark' : 'light')
}

function toggleTheme() {
  setTheme(!isDark.value)
}

function handleShortcut(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    focusSearch()
  }
  if (event.key === 'Escape') sidebarOpen.value = false
}

watch(() => route.path, () => {
  sidebarOpen.value = false
  openCurrentGroup()
})

watch(sidebarOpen, open => {
  if (typeof document !== 'undefined') document.body.classList.toggle('sidebar-open', open)
})

onMounted(() => {
  document.documentElement.lang = 'ar'
  document.documentElement.dir = 'rtl'
  setTheme(localStorage.getItem('alawal-docs-theme') === 'dark')
  openCurrentGroup()

  window.addEventListener('keydown', handleShortcut)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleShortcut)
  document.body.classList.remove('sidebar-open')
})
</script>

<template>
  <aside class="docs-sidebar" aria-label="التنقل في التوثيق">
    <div class="brand">
      <span class="brand__mark"><BookOpen /></span>
      <span><strong>مركز توثيق الأول</strong><small>دليل بناء المتاجر بسهولة</small></span>
      <button class="icon-button sidebar-close" type="button" aria-label="إغلاق القائمة" @click="sidebarOpen = false"><X /></button>
    </div>

    <div class="theme-picker">
      <label>اختر الثيم</label>
      <div class="theme-picker__control">
        <span class="theme-picker__thumb"><LayoutDashboard /></span>
        <span class="theme-picker__copy"><strong>ثيم الأول</strong><small>متجر تجريبي</small></span>
        <ChevronDown />
      </div>
    </div>

    <nav class="docs-nav">
      <div v-for="(group, index) in sidebarNavigation" :key="group.label" class="nav-group" :class="{ 'is-open': openGroups.has(index) }">
        <button class="nav-group__toggle" type="button" :aria-expanded="openGroups.has(index)" @click="toggleGroup(index)">
          <span><component :is="iconFor(group.icon)" />{{ group.label }}</span><ChevronDown />
        </button>
        <div class="nav-group__items">
          <template v-for="item in group.items" :key="item.link">
            <div v-if="item.children?.length" class="nav-subgroup" :class="{ 'is-open': openSubgroups.has(item.link), 'is-active': itemIsActive(item) }">
              <div class="nav-subgroup__row">
                <button class="nav-subgroup__link" type="button" :class="{ 'is-active': isActive(item.link) }" @click="go(item.link)">
                  <component :is="iconFor(item.icon)" />{{ item.title }}
                </button>
                <button class="nav-subgroup__toggle" type="button" :aria-label="`عرض صفحات ${item.title}`" :aria-expanded="openSubgroups.has(item.link)" @click="toggleSubgroup(item.link)">
                  <ChevronDown />
                </button>
              </div>
              <div class="nav-subgroup__items">
                <button v-for="child in item.children" :key="child.link" type="button" :class="{ 'is-active': isActive(child.link) }" @click="go(child.link)">
                  <component :is="iconFor(child.icon)" />{{ child.title }}
                </button>
              </div>
            </div>
            <button v-else type="button" :class="{ 'is-active': isActive(item.link) }" @click="go(item.link)">
              <component :is="iconFor(item.icon)" />{{ item.title }}
            </button>
          </template>
        </div>
      </div>
    </nav>

    <div class="sidebar-meta"><span>الإصدار 1.358.0</span><button type="button" @click="go('/components')">41 عنصراً مخصصاً</button></div>
  </aside>

  <button class="backdrop" type="button" aria-label="إغلاق القائمة" @click="sidebarOpen = false"></button>

  <div class="app-shell">
    <header class="topbar">
      <div class="topbar__main">
        <button class="icon-button menu-toggle" type="button" aria-label="فتح قائمة التوثيق" @click="sidebarOpen = true"><Menu /></button>
        <nav class="topbar__nav" aria-label="التنقل الرئيسي">
          <button type="button" @click="go('/')">الرئيسية</button>
          <button type="button" @click="go('/components')">الثيمات</button>
          <button type="button" @click="go('/changelog')">قائمة التحديثات</button>
          <button type="button" @click="go('/faq')">الأسئلة الشائعة</button>
          <button type="button" @click="go('/support')">الدعم</button>
          <a class="topbar__admin" :href="withBase('/admin/index.html')" target="_self">إدارة المحتوى</a>
        </nav>
        <div class="topbar__tools">
          <a class="topbar-contact" href="https://github.com/MuneerALmansoori/alawal-documentatio/issues/new" target="_blank" rel="noreferrer"><MessageCircle /><span>تواصل معنا</span></a>
          <div class="topbar-search" role="search" @focusin="searchOpen = true" @focusout="closeSearch">
            <Search />
            <input id="docs-search" v-model="searchQuery" type="search" autocomplete="off" :placeholder="frontmatter.searchPlaceholder || 'ابحث في التوثيق...'" aria-label="البحث في التوثيق">
            <kbd>⌘ K</kbd>
            <div v-if="searchQuery && searchOpen" class="search-results" role="listbox">
              <button v-for="result in searchResults" :key="result.link" type="button" role="option" @click="go(result.link)"><span>{{ result.title }}</span><small>{{ result.section }}</small></button>
              <button v-if="!searchResults.length" type="button" disabled><span>لا توجد نتائج مطابقة</span><small>جرب كلمة أخرى</small></button>
            </div>
          </div>
          <button class="icon-button" type="button" :aria-label="isDark ? 'تفعيل الوضع النهاري' : 'تفعيل الوضع الليلي'" @click="toggleTheme">
            <Sun v-if="isDark" /><Moon v-else />
          </button>
        </div>
      </div>
    </header>

    <main>
      <section v-if="isHome" class="welcome" aria-labelledby="welcome-title">
        <div class="welcome__visual" aria-hidden="true">
          <div class="browser-preview"><div class="browser-preview__bar"><span></span><span></span><span></span></div><img :src="withBase(frontmatter.welcomeDesktopImage || '/assets/storefront-preview.png')" alt="معاينة الثيم على سطح المكتب"></div>
          <div class="phone-preview"><img :src="withBase(frontmatter.welcomeMobileImage || '/assets/storefront-preview.png')" alt="معاينة الثيم على الهاتف"></div>
        </div>
        <div class="welcome__content">
          <span class="eyebrow"><Sparkles /> {{ frontmatter.welcomeEyebrow || 'دليل ثيم الأول' }}</span>
          <h1 id="welcome-title">{{ frontmatter.title || 'مرحباً بك في مركز توثيق الأول' }}</h1>
          <p>{{ frontmatter.description || 'كل ما تحتاجه لتخصيص متجرك في سلة بسهولة واحترافية.' }}</p>
          <div class="quick-grid">
            <button v-for="item in quickLinks" :key="item.link" type="button" @click="go(item.link)">
              <span class="quick-grid__icon" :class="item.tone"><component :is="iconFor(item.icon)" /></span>
              <span><strong>{{ item.title }}</strong><small>{{ item.subtitle }}</small></span>
            </button>
          </div>
        </div>
      </section>

      <div class="content-layout">
        <article class="doc-article">
          <nav class="article-breadcrumbs" aria-label="مسار الصفحة"><button type="button" @click="go('/')">الرئيسية</button><ChevronLeft /><span>{{ sectionLabel }}</span><ChevronLeft /><span>{{ pageTitle }}</span></nav>
          <header class="article-header">
            <div class="article-header__title"><span class="article-header__icon"><component :is="iconFor(frontmatter.icon)" /></span><h1>{{ pageTitle }}</h1></div>
            <p>{{ pageDescription }}</p>
          </header>
          <div v-if="frontmatter.notice" class="notice"><Info /><span>{{ frontmatter.notice }}</span></div>
          <Content class="doc-content" />
        </article>

      </div>
    </main>
  </div>

  <a
    v-if="whatsappUrl"
    class="floating-whatsapp"
    :href="whatsappUrl"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="طلب محادثة عبر واتساب"
    title="تواصل معنا عبر واتساب"
  >
    <WhatsAppIcon />
  </a>
</template>
