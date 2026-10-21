import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { componentPages, customComponentPages, nativeComponentPages } from '../.vitepress/theme/component-pages.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = path.join(projectRoot, 'design', 'components')

function frontmatter(item, order) {
  const description = item.summary.replaceAll('"', '\\"')
  return `---\ntitle: "${item.name}"\ndescription: "${description}"\nsection: "تخصيص العناصر"\nicon: "blocks"\npageOrder: ${order}\nnotice: ""\n---`
}

function pageContent(item, order) {
  const typeLabel = item.type === 'native' ? 'عنصر أصلي من سلة يدعمه الثيم بقالب مخصص.' : 'عنصر مخصص في ثيم الأول.'
  const features = item.features.map(feature => `- ${feature}`).join('\n')
  const settings = item.settings?.length
    ? `## الإعدادات المهمة\n\n${item.settings.map(setting => `- ${setting}`).join('\n')}\n\n`
    : ''
  const notes = item.notes?.length
    ? `## ملاحظات التشغيل\n\n${item.notes.map(note => `- ${note}`).join('\n')}\n\n`
    : ''
  return `${frontmatter(item, order)}

${item.summary}

> ${typeLabel}

## وظيفة العنصر

يُستخدم **${item.name}** داخل منشئ صفحات سلة لإضافة هذا النوع من المحتوى إلى الصفحة دون الحاجة إلى تعديل القالب يدوياً. يظهر العنصر وفق إعداداته ويتكيف مع اتجاه اللغة وأحجام الشاشات وأوضاع ألوان الثيم.

## المميزات

${features}
- متوافق مع اللغة العربية والإنجليزية.
- متجاوب مع سطح المكتب والتابلت والهاتف.
- يستجيب لأوضاع الألوان المفعلة في الثيم.

${settings}${notes}## طريقة الإضافة

1. افتح الصفحة المطلوبة من منشئ صفحات سلة.
2. اختر **إضافة عنصر** ثم ابحث عن **${item.name}**.
3. أضف المحتوى أو المنتجات والوسائط المطلوبة.
4. راجع خيارات العرض الخاصة بالعنصر واضبطها حسب الصفحة.
5. احفظ التغييرات وعاين النتيجة على سطح المكتب والهاتف.

## إرشادات الاستخدام

- استخدم صوراً وفيديوهات واضحة وبأبعاد متقاربة عند عرض أكثر من وسيط.
- لا تكرر عناصر تؤدي الوظيفة نفسها في الصفحة إلا عند وجود هدف واضح.
- اختبر النصوص الطويلة واتجاه اللغة قبل نشر الصفحة.
- راجع النتيجة في جميع أوضاع الألوان المستخدمة في المتجر.

## المعرّف التقني

\`${item.technical}\`
`
}

function links(items) {
  return items.map(item => `- [${item.name}](/design/components/${item.slug}) — ${item.summary}`).join('\n')
}

const indexContent = `---
title: "تخصيص العناصر"
description: "دليل عناصر ثيم الأول المخصصة وعناصر سلة الأصلية المدعومة، مع صفحة مستقلة لكل عنصر."
section: "تخصيص التصميم"
icon: "blocks"
notice: ""
---

يضم ثيم الأول **${customComponentPages.length} عنصراً مخصصاً**، إضافة إلى **${nativeComponentPages.length} عناصر أصلية من سلة** يدعمها الثيم بقوالب متوافقة مع تصميمه. افتح صفحة أي عنصر لمعرفة وظيفته ومميزاته وطريقة إضافته.

## العناصر المخصصة

${links(customComponentPages)}

## عناصر سلة الأصلية المدعومة

${links(nativeComponentPages)}
`

await mkdir(outputDir, { recursive: true })
await writeFile(path.join(outputDir, 'index.md'), indexContent, 'utf8')

await Promise.all(componentPages.map((item, index) =>
  writeFile(path.join(outputDir, `${item.slug}.md`), pageContent(item, index + 1), 'utf8')
))

console.log(`Generated ${componentPages.length + 1} component documentation pages.`)
