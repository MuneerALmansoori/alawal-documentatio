<script setup>
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps({
  type: {
    type: String,
    default: 'image'
  },
  src: {
    type: String,
    default: ''
  },
  width: {
    type: [Number, String],
    default: 100
  },
  alt: {
    type: String,
    default: ''
  }
})

const source = computed(() => {
  const value = props.src.trim()

  if (!value || /^(?:https?:|data:|blob:|\/\/)/i.test(value)) {
    return value
  }

  return withBase(value.startsWith('/') ? value : `/${value}`)
})
const isVideo = computed(() => props.type === 'video')
const mediaWidth = computed(() => {
  const value = Number.parseFloat(props.width)
  const normalized = Number.isFinite(value) ? value : 100
  return `${Math.min(100, Math.max(20, normalized))}%`
})

function getEmbedUrl(value) {
  if (!value) return ''

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const parts = url.pathname.split('/').filter(Boolean)
      const id = url.searchParams.get('v') || (['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : '')
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.split('/').filter(Boolean).find(part => /^\d+$/.test(part))
      return id ? `https://player.vimeo.com/video/${id}` : ''
    }
  } catch {
    return ''
  }

  return ''
}

const embedUrl = computed(() => isVideo.value ? getEmbedUrl(source.value) : '')
const youtubeEmbedUrl = computed(() => embedUrl.value.includes('youtube-nocookie.com') ? embedUrl.value : '')
</script>

<template>
  <figure v-if="source" class="doc-media" :style="{ '--doc-media-width': mediaWidth }">
    <img v-if="!isVideo" class="doc-media__image" :src="source" :alt="alt" loading="lazy">
    <iframe
      v-else-if="embedUrl"
      class="doc-media__frame"
      :src="embedUrl"
      :title="alt || (youtubeEmbedUrl ? 'فيديو YouTube' : 'فيديو توضيحي')"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
    <video v-else class="doc-media__video" controls playsinline preload="metadata">
      <source :src="source">
      متصفحك لا يدعم تشغيل الفيديو.
    </video>
  </figure>
</template>
