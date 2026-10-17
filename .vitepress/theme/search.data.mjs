import { createContentLoader } from 'vitepress'

export default createContentLoader('**/*.md', {
  includeSrc: true,
  transform(pages) {
    return pages
      .filter(page => page.url !== '/README')
      .map(page => ({
        link: page.url.replace(/\/$/, '') || '/',
        title: page.frontmatter.title || '',
        description: page.frontmatter.description || '',
        section: page.frontmatter.section || 'التوثيق',
        icon: page.frontmatter.icon || 'book-open',
        pageOrder: Number(page.frontmatter.pageOrder ?? 100),
        sectionOrder: Number(page.frontmatter.sectionOrder ?? 100),
        navigationHidden: page.frontmatter.navigationHidden === true,
        content: (page.src || '')
          .replace(/^---[\s\S]*?---/m, '')
          .replace(/[`*_>#\[\]()-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      }))
  }
})
