(() => {
  const translations = new Map([
    ['Contents', 'المحتوى'],
    ['Media', 'الوسائط'],
    ['Collections', 'أقسام المحتوى'],
    ['Login', 'دخول لوحة الإدارة'],
    ['Go back to site', 'العودة إلى الموقع'],
    ['View Live', 'عرض الصفحة'],
    ['Published', 'منشور'],
    ['CHANGES SAVED', 'تم حفظ التغييرات'],
    ['Rich Text', 'محرر منسق']
  ])

  const translateTextNode = node => {
    const value = node.nodeValue?.trim()
    if (!value) return

    if (translations.has(value)) {
      node.nodeValue = node.nodeValue.replace(value, translations.get(value))
      return
    }

    const collectionMatch = value.match(/^Writing in (.+) collection$/)
    if (collectionMatch) {
      node.nodeValue = `تحرير ضمن ${collectionMatch[1]}`
      return
    }

    if (value.includes('(OPTIONAL)')) {
      node.nodeValue = node.nodeValue.replace('(OPTIONAL)', '(اختياري)')
    }
  }

  const translateElement = root => {
    if (!(root instanceof Element || root instanceof Document)) return

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) translateTextNode(node)

    root.querySelectorAll('input[placeholder="Search all"]').forEach(input => {
      input.placeholder = 'البحث في الأقسام'
      input.setAttribute('aria-label', 'البحث في الأقسام')
    })

    root.querySelectorAll('input, textarea, [contenteditable="true"]').forEach(field => {
      field.setAttribute('dir', 'rtl')
    })
  }

  let scheduled = false
  const scheduleTranslation = () => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      translateElement(document)
    })
  }

  document.documentElement.setAttribute('dir', 'rtl')
  translateElement(document)
  new MutationObserver(scheduleTranslation).observe(document.body, {
    childList: true,
    subtree: true
  })
})()
