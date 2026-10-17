(() => {
  const escapeAttribute = value => String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')

  const decodeAttribute = value => String(value || '')
    .replaceAll('&quot;', '"')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&')

  const normalizeWidth = value => {
    const number = Number.parseFloat(value)
    return Math.min(100, Math.max(20, Number.isFinite(number) ? number : 100))
  }

  const getValue = (value, key, fallback = '') => {
    if (value && typeof value.get === 'function') return value.get(key, fallback)
    return value?.[key] ?? fallback
  }

  const setValue = (value, key, nextValue) => {
    if (value && typeof value.set === 'function') return value.set(key, nextValue)
    return { ...(value || {}), [key]: nextValue }
  }

  const resolveAsset = (source, getAsset) => {
    if (!source) return ''
    if (/^(?:https?:|data:|blob:|\/)/i.test(source)) return source
    const asset = typeof getAsset === 'function' ? getAsset(source) : source
    return asset && typeof asset.toString === 'function' ? asset.toString() : String(asset || source)
  }

  const buildPublicMediaPath = (fileName, config) => {
    const replacement = getValue(getValue(config, 'slug'), 'sanitize_replacement', '-') || '-'
    const escapedReplacement = replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const safeName = String(fileName || 'media')
      .toLocaleLowerCase()
      .normalize('NFC')
      .replace(/[^\p{L}\p{N}._-]+/gu, replacement)
      .replace(new RegExp(`${escapedReplacement}{2,}`, 'g'), replacement)
      .replace(new RegExp(`^${escapedReplacement}|${escapedReplacement}$`, 'g'), '')
    const publicFolder = String(getValue(config, 'public_folder', '/assets/uploads') || '/assets/uploads')
      .replace(/\/+$/, '')
    return `${publicFolder}/${safeName}`
  }

  const videoEmbedUrl = source => {
    const youtube = String(source || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&#/]+)/i)
    if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`
    const vimeo = String(source || '').match(/vimeo\.com\/(?:video\/)?(\d+)/i)
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
    return ''
  }

  const isDirectVideo = source => /\.(?:m4v|mov|mp4|ogv|webm)(?:[?#].*)?$/i.test(String(source || ''))

  const splitMarkdownBlocks = markdown => {
    const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n')
    const blocks = []
    let current = []
    let fence = ''

    const flush = () => {
      const raw = current.join('\n').trim()
      if (raw) blocks.push(raw)
      current = []
    }

    lines.forEach(line => {
      const fenceMatch = line.match(/^\s*(```+|~~~+)/)
      if (fenceMatch) {
        if (!fence) fence = fenceMatch[1][0]
        else if (fence === fenceMatch[1][0]) fence = ''
      }

      if (!fence && !line.trim()) flush()
      else current.push(line)
    })
    flush()
    return blocks
  }

  const mediaBlockPattern = /^<DocMedia type="(?:image|video)" src="[^"]*" width="[0-9.]+" alt="[^"]*" \/>$/

  const moveMediaBlock = (markdown, mediaOrder, visualTargetIndex, visualBlockCount, insertAfter) => {
    const blocks = splitMarkdownBlocks(markdown)
    const mediaIndexes = blocks
      .map((block, index) => mediaBlockPattern.test(block) ? index : -1)
      .filter(index => index >= 0)
    const sourceIndex = mediaIndexes[mediaOrder]
    if (!Number.isInteger(sourceIndex)) return markdown

    const ratio = visualBlockCount > 0 ? blocks.length / visualBlockCount : 1
    let targetIndex = Math.min(blocks.length - 1, Math.max(0, Math.round(visualTargetIndex * ratio)))
    if (insertAfter) targetIndex += 1

    const [media] = blocks.splice(sourceIndex, 1)
    if (sourceIndex < targetIndex) targetIndex -= 1
    targetIndex = Math.min(blocks.length, Math.max(0, targetIndex))
    blocks.splice(targetIndex, 0, media)
    return blocks.join('\n\n')
  }

  const previewCard = (type, source, width, alt) => {
    const safeSource = escapeAttribute(source)
    const safeAlt = escapeAttribute(alt)
    const style = `width:${width}%;max-width:100%;margin:16px auto;padding:4px;border:1px solid #e5eaf2;border-radius:8px;background:#fff;box-sizing:border-box;`

    if (!source) {
      return `<div style="${style}padding:24px;text-align:center;color:#667085;">أضف صورة أو رابط فيديو</div>`
    }

    if (type === 'video') {
      return `<div style="${style}aspect-ratio:16/9;display:grid;place-items:center;background:#111827;color:#fff;text-align:center;"><span>فيديو<br><small>${safeSource}</small></span></div>`
    }

    return `<img src="${safeSource}" alt="${safeAlt}" style="${style}height:auto;display:block;object-fit:contain;">`
  }

  const supportedMedia = file => {
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) return true
    return /\.(avif|bmp|gif|jpe?g|png|svg|webp|m4v|mov|mp4|ogv|webm)$/i.test(file.name)
  }

  const assignFiles = (input, files) => {
    const transfer = new DataTransfer()
    files.forEach(file => transfer.items.add(file))
    input.files = transfer.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const FileControl = CMS.getWidget('file').control
  const MarkdownWidget = CMS.getWidget('markdown')
  let activeMediaDrag = null
  let activeSortableEditor = null
  const DragMediaControl = createClass({
    getInitialState() {
      return { dragging: false, status: '' }
    },
    componentWillUnmount() {
      if (this.uploadFrame) cancelAnimationFrame(this.uploadFrame)
    },
    handleDragEnter(event) {
      event.preventDefault()
      event.stopPropagation()
      this.setState({ dragging: true })
    },
    handleDragOver(event) {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      if (!this.state.dragging) this.setState({ dragging: true })
    },
    handleDragLeave(event) {
      if (event.currentTarget.contains(event.relatedTarget)) return
      this.setState({ dragging: false })
    },
    waitForUploader(files, attempt = 0) {
      const input = document.querySelector('.nc-fileUploadButton input[type="file"]:not(:disabled)')
      if (input) {
        assignFiles(input, files)
        this.setState({ dragging: false, status: `تم رفع ${files[0].name}` })
        return
      }

      if (attempt >= 90) {
        this.setState({ dragging: false, status: 'تعذر فتح أداة الرفع. حاول مرة أخرى.' })
        return
      }

      this.uploadFrame = requestAnimationFrame(() => this.waitForUploader(files, attempt + 1))
    },
    handleDrop(event) {
      event.preventDefault()
      event.stopPropagation()

      const files = [...event.dataTransfer.files].filter(supportedMedia).slice(0, 1)
      if (!files.length) {
        this.setState({ dragging: false, status: 'يسمح بإسقاط الصور والفيديوهات فقط.' })
        return
      }

      const openLibraryButton = this.dropzone?.querySelector('button')
      if (!openLibraryButton) {
        this.setState({ dragging: false, status: 'تعذر فتح مكتبة الوسائط.' })
        return
      }

      this.setState({ dragging: false, status: 'جارٍ رفع الوسائط...' })
      openLibraryButton.click()
      this.waitForUploader(files)
    },
    render() {
      const className = `cms-media-dropzone${this.state.dragging ? ' is-dragging' : ''}`
      return h(
        'div',
        {
          ref: node => { this.dropzone = node },
          className,
          onDragEnter: this.handleDragEnter,
          onDragOver: this.handleDragOver,
          onDragLeave: this.handleDragLeave,
          onDrop: this.handleDrop
        },
        h(FileControl, this.props),
        h('div', { className: 'cms-media-dropzone__hint' },
          h('strong', {}, 'اسحب الصورة أو الفيديو وأفلته هنا'),
          h('span', {}, 'أو استخدم زر اختيار الملف من مكتبة الوسائط')
        ),
        this.state.status ? h('span', { className: 'cms-media-dropzone__status', role: 'status' }, this.state.status) : null
      )
    }
  })

  CMS.registerWidget('drag-media', DragMediaControl)

  const MediaBlockControl = createClass({
    getInitialState() {
      return { previewUrl: '', uploadStatus: '', uploading: false, uploadDragging: false }
    },
    componentWillUnmount() {
      document.removeEventListener('pointermove', this.handlePointerMove)
      document.removeEventListener('pointerup', this.handlePointerUp)
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
      document.body.classList.remove('is-reordering-doc-media')
      if (this.state.previewUrl) URL.revokeObjectURL(this.state.previewUrl)
    },
    update(key, nextValue) {
      this.props.onChange(setValue(this.props.value, key, nextValue))
    },
    handleDragStart(event) {
      const cards = [...document.querySelectorAll('[data-doc-media-card]')]
      const index = Math.max(0, cards.indexOf(this.card))
      activeMediaDrag = { index }
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/x-alawal-doc-media', String(index))
      event.dataTransfer.setData('text/plain', 'وسائط التوثيق')
      requestAnimationFrame(() => this.card?.classList.add('is-dragging'))
    },
    handleDragEnd() {
      activeMediaDrag = null
      this.card?.classList.remove('is-dragging')
      document.querySelectorAll('.cms-media-drop-target').forEach(node => node.classList.remove('cms-media-drop-target'))
    },
    handlePointerDown(event) {
      if (event.pointerType === 'mouse') return
      if (event.button !== 0) return
      const cards = [...document.querySelectorAll('[data-doc-media-card]')]
      activeMediaDrag = { index: Math.max(0, cards.indexOf(this.card)) }
      this.card?.classList.add('is-dragging')
      document.body.classList.add('is-reordering-doc-media')
      document.addEventListener('pointermove', this.handlePointerMove)
      document.addEventListener('pointerup', this.handlePointerUp, { once: true })
      event.preventDefault()
    },
    handlePointerMove(event) {
      this.autoScroll(event.clientY)
      activeSortableEditor?.showDropAtPoint(event.clientX, event.clientY)
    },
    handlePointerUp(event) {
      document.removeEventListener('pointermove', this.handlePointerMove)
      activeSortableEditor?.dropAtPoint(event.clientX, event.clientY)
      this.card?.classList.remove('is-dragging')
      document.body.classList.remove('is-reordering-doc-media')
      activeMediaDrag = null
    },
    handleMouseDown(event) {
      if (event.button !== 0) return
      const cards = [...document.querySelectorAll('[data-doc-media-card]')]
      activeMediaDrag = { index: Math.max(0, cards.indexOf(this.card)) }
      this.card?.classList.add('is-dragging')
      document.body.classList.add('is-reordering-doc-media')
      document.addEventListener('mousemove', this.handleMouseMove)
      document.addEventListener('mouseup', this.handleMouseUp, { once: true })
      event.preventDefault()
    },
    handleMouseMove(event) {
      this.autoScroll(event.clientY)
      activeSortableEditor?.showDropAtPoint(event.clientX, event.clientY)
    },
    autoScroll(clientY) {
      const edge = 72
      if (clientY < edge) window.scrollBy(0, -28)
      else if (clientY > window.innerHeight - edge) window.scrollBy(0, 28)
    },
    handleMouseUp(event) {
      document.removeEventListener('mousemove', this.handleMouseMove)
      activeSortableEditor?.dropAtPoint(event.clientX, event.clientY)
      this.card?.classList.remove('is-dragging')
      document.body.classList.remove('is-reordering-doc-media')
      activeMediaDrag = null
    },
    getMediaFileField() {
      return this.props.field
        .set('label', 'ملف الصورة أو الفيديو')
        .set('name', 'mediaFile')
        .set('widget', 'file')
        .set('required', false)
        .set('choose_url', false)
        .set('allow_multiple', false)
        .delete('fields')
    },
    async persistSelectedMedia(file) {
      if (!file || !supportedMedia(file)) {
        this.setState({ uploadStatus: 'يسمح برفع الصور والفيديوهات فقط.', uploadDragging: false })
        return
      }

      if (this.state.previewUrl) URL.revokeObjectURL(this.state.previewUrl)
      const previewUrl = URL.createObjectURL(file)
      const mediaType = file.type.startsWith('video/') ? 'video' : 'image'
      const mediaPath = buildPublicMediaPath(file.name, this.props.config)
      this.setState({ previewUrl, uploadStatus: 'جارٍ تجهيز الملف...', uploading: true, uploadDragging: false })
      this.props.onChange(
        setValue(setValue(this.props.value, 'mediaType', mediaType), 'mediaFile', mediaPath)
      )

      try {
        await this.props.onPersistMedia(file, { field: this.getMediaFileField() })
        this.setState({ uploadStatus: `تمت إضافة ${file.name}`, uploading: false })
      } catch (error) {
        console.error('Unable to persist documentation media', error)
        this.setState({ uploadStatus: 'تعذر رفع الملف. حاول مرة أخرى.', uploading: false })
      }
    },
    handleFileInput(event) {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) this.persistSelectedMedia(file)
    },
    handleUploadDragOver(event) {
      event.preventDefault()
      event.stopPropagation()
      event.dataTransfer.dropEffect = 'copy'
      if (!this.state.uploadDragging) this.setState({ uploadDragging: true })
    },
    handleUploadDragLeave(event) {
      if (event.currentTarget.contains(event.relatedTarget)) return
      this.setState({ uploadDragging: false })
    },
    handleUploadDrop(event) {
      event.preventDefault()
      event.stopPropagation()
      const file = [...event.dataTransfer.files].find(supportedMedia)
      this.persistSelectedMedia(file)
    },
    renderPreview(type, source, alt, width) {
      const style = { width: `${width}%` }
      if (!source) {
        return h('div', { className: 'cms-doc-media__empty', style }, 'أضف صورة أو رابط فيديو لتظهر المعاينة هنا')
      }

      if (type === 'video') {
        const embedUrl = videoEmbedUrl(source)
        if (embedUrl) {
          return h('iframe', {
            className: 'cms-doc-media__asset',
            style,
            src: embedUrl,
            title: alt || 'معاينة الفيديو',
            loading: 'lazy',
            allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
            allowFullScreen: true
          })
        }
        if (isDirectVideo(source)) {
          return h('video', { className: 'cms-doc-media__asset', style, src: source, controls: true, preload: 'metadata' })
        }
        return h('div', { className: 'cms-doc-media__empty', style }, 'رابط الفيديو غير قابل للمعاينة المباشرة')
      }

      return h('img', { className: 'cms-doc-media__asset', style, src: source, alt: alt || '' })
    },
    render() {
      const value = this.props.value
      const mediaType = getValue(value, 'mediaType', 'image') === 'video' ? 'video' : 'image'
      const mediaFile = getValue(value, 'mediaFile')
      const videoUrl = getValue(value, 'videoUrl')
      const width = normalizeWidth(getValue(value, 'width', 100))
      const alt = getValue(value, 'alt')
      const storedSource = resolveAsset(mediaFile, this.props.getAsset)
      const uploadedSource = this.state.previewUrl || storedSource
      const source = mediaType === 'video' ? (videoUrl || uploadedSource) : uploadedSource

      return h('div', {
        ref: node => { this.card = node },
        className: 'cms-doc-media',
        'data-doc-media-card': 'true',
        draggable: false
      },
      h('div', {
        className: 'cms-doc-media__handle',
        title: 'اسحب لوضع الوسائط بين النصوص',
        onPointerDown: this.handlePointerDown,
        onMouseDown: this.handleMouseDown
      },
        h('span', { 'aria-hidden': 'true' }, '⋮⋮'),
        h('strong', {}, mediaType === 'video' ? 'فيديو' : 'صورة'),
        h('small', {}, 'اسحب لتغيير الموضع')
      ),
      h('div', { className: 'cms-doc-media__preview' }, this.renderPreview(mediaType, source, alt, width)),
      h('details', { className: 'cms-doc-media__settings' },
        h('summary', {}, 'إعدادات الوسائط'),
        h('div', { className: 'cms-doc-media__fields' },
          h('label', {}, 'نوع الوسائط', h('select', {
            value: mediaType,
            onChange: event => this.update('mediaType', event.target.value)
          }, h('option', { value: 'image' }, 'صورة'), h('option', { value: 'video' }, 'فيديو'))),
          h('div', {
            className: `cms-doc-media__upload${this.state.uploadDragging ? ' is-dragging' : ''}`,
            onDragOver: this.handleUploadDragOver,
            onDragLeave: this.handleUploadDragLeave,
            onDrop: this.handleUploadDrop
          },
            h('label', { className: 'cms-doc-media__upload-button' },
              this.state.uploading ? 'جارٍ الرفع...' : 'اختيار صورة أو فيديو',
              h('input', {
                type: 'file',
                accept: 'image/*,video/*',
                disabled: this.state.uploading,
                onChange: this.handleFileInput
              })
            ),
            h('span', {}, 'أو اسحب الملف وأفلته هنا'),
            this.state.uploadStatus
              ? h('small', { className: 'cms-doc-media__upload-status', role: 'status' }, this.state.uploadStatus)
              : null
          ),
          mediaType === 'video' ? h('label', {}, 'رابط الفيديو', h('input', {
            type: 'url',
            value: videoUrl,
            placeholder: 'YouTube أو Vimeo أو رابط فيديو مباشر',
            onChange: event => this.update('videoUrl', event.target.value)
          })) : null,
          h('label', {}, `حجم العرض: ${width}%`, h('input', {
            type: 'range', min: 20, max: 100, step: 5, value: width,
            onChange: event => this.update('width', Number(event.target.value))
          })),
          h('label', {}, 'النص البديل أو وصف الفيديو', h('input', {
            type: 'text', value: alt, onChange: event => this.update('alt', event.target.value)
          }))
        )
      ))
    }
  })

  CMS.registerWidget('doc-media-block', MediaBlockControl)

  const SortableMarkdownControl = createClass({
    getInitialState() {
      return { revision: 0, reorderedValue: null }
    },
    componentDidMount() {
      activeSortableEditor = this
      this.connectEditor()
      this.observer = new MutationObserver(() => this.connectEditor())
      this.observer.observe(this.container, { childList: true, subtree: true })
    },
    componentWillUnmount() {
      if (activeSortableEditor === this) activeSortableEditor = null
      this.disconnectEditor()
      this.observer?.disconnect()
    },
    connectEditor() {
      const editor = this.container?.querySelector('[contenteditable="true"]')
      if (!editor || editor === this.editor) return
      this.disconnectEditor()
      this.editor = editor
      editor.addEventListener('dragover', this.handleEditorDragOver, true)
      editor.addEventListener('drop', this.handleEditorDrop, true)
      editor.addEventListener('dragleave', this.clearDropTargets, true)
    },
    disconnectEditor() {
      if (!this.editor) return
      this.editor.removeEventListener('dragover', this.handleEditorDragOver, true)
      this.editor.removeEventListener('drop', this.handleEditorDrop, true)
      this.editor.removeEventListener('dragleave', this.clearDropTargets, true)
      this.editor = null
    },
    clearDropTargets() {
      document.querySelectorAll('.cms-media-drop-target').forEach(node => node.classList.remove('cms-media-drop-target'))
    },
    getDropPosition(event) {
      return this.getDropPositionForTarget(event.target, event.clientY)
    },
    getDropPositionForTarget(target, clientY) {
      if (!this.editor) return null
      let block = target
      while (block?.parentElement && block.parentElement !== this.editor) block = block.parentElement
      if (!block || block.parentElement !== this.editor) return null
      const blocks = [...this.editor.children]
      return {
        block,
        index: blocks.indexOf(block),
        count: blocks.length,
        after: clientY > block.getBoundingClientRect().top + block.getBoundingClientRect().height / 2
      }
    },
    getDropPositionAtPoint(clientX, clientY) {
      const target = document.elementFromPoint(clientX, clientY)
      return target ? this.getDropPositionForTarget(target, clientY) : null
    },
    markDropPosition(position) {
      this.clearDropTargets()
      if (!position) return
      position.block.classList.add('cms-media-drop-target')
      position.block.dataset.dropAfter = position.after ? 'true' : 'false'
    },
    showDropAtPoint(clientX, clientY) {
      this.markDropPosition(this.getDropPositionAtPoint(clientX, clientY))
    },
    applyMediaMove(position, sourceOrder) {
      this.clearDropTargets()
      if (!position || !Number.isInteger(sourceOrder)) return
      const nextValue = moveMediaBlock(this.props.value, sourceOrder, position.index, position.count, position.after)
      if (nextValue !== this.props.value) {
        this.setState(state => ({ revision: state.revision + 1, reorderedValue: nextValue }))
        this.props.onChange(nextValue)
      }
    },
    dropAtPoint(clientX, clientY) {
      const sourceOrder = activeMediaDrag?.index
      this.applyMediaMove(this.getDropPositionAtPoint(clientX, clientY), sourceOrder)
    },
    handleEditorDragOver(event) {
      if (!activeMediaDrag && !event.dataTransfer.types.includes('application/x-alawal-doc-media')) return
      const position = this.getDropPosition(event)
      if (!position) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'move'
      this.markDropPosition(position)
    },
    handleEditorDrop(event) {
      if (!activeMediaDrag && !event.dataTransfer.types.includes('application/x-alawal-doc-media')) return
      const position = this.getDropPosition(event)
      if (!position) return
      event.preventDefault()
      event.stopPropagation()
      const sourceOrder = activeMediaDrag?.index ?? Number(event.dataTransfer.getData('application/x-alawal-doc-media'))
      this.applyMediaMove(position, sourceOrder)
      activeMediaDrag = null
    },
    handleMarkdownChange(nextValue) {
      if (this.state.reorderedValue !== null) this.setState({ reorderedValue: null })
      this.props.onChange(nextValue)
    },
    render() {
      return h('div', { ref: node => { this.container = node }, className: 'cms-sortable-markdown' },
        h(MarkdownWidget.control, {
          ...this.props,
          key: this.state.revision,
          value: this.state.reorderedValue ?? this.props.value,
          onChange: this.handleMarkdownChange
        })
      )
    }
  })

  CMS.registerWidget('sortable-markdown', SortableMarkdownControl, MarkdownWidget.preview)

  CMS.registerEditorComponent({
    id: 'doc-media',
    label: 'صورة أو فيديو',
    widget: 'doc-media-block',
    fields: [
      {
        label: 'نوع الوسائط',
        name: 'mediaType',
        widget: 'select',
        default: 'image',
        options: [
          { label: 'صورة', value: 'image' },
          { label: 'فيديو', value: 'video' }
        ]
      },
      {
        label: 'ملف الصورة أو الفيديو',
        name: 'mediaFile',
        widget: 'drag-media',
        required: false,
        choose_url: false,
        allow_multiple: false,
        media_library: {
          allow_multiple: false,
          config: {
            multiple: false
          }
        },
        hint: 'اسحب صورة أو فيديو إلى الحقل، أو اختر ملفاً محفوظاً من مكتبة الوسائط.'
      },
      {
        label: 'رابط الفيديو',
        name: 'videoUrl',
        widget: 'string',
        required: false,
        hint: 'يدعم رابط فيديو مباشر أو رابط YouTube أو Vimeo.'
      },
      {
        label: 'حجم العرض بالنسبة المئوية',
        name: 'width',
        widget: 'number',
        default: 100,
        value_type: 'int',
        min: 20,
        max: 100,
        step: 5,
        hint: 'اختر قيمة بين 20 و100. يتم توسيط الوسائط تلقائياً.'
      },
      {
        label: 'النص البديل أو وصف الفيديو',
        name: 'alt',
        widget: 'string',
        required: false
      }
    ],
    pattern: /^<DocMedia type="(image|video)" src="([^"]*)" width="([0-9.]+)" alt="([^"]*)" \/>$/m,
    fromBlock(match) {
      const mediaType = match[1]
      const source = decodeAttribute(match[2])

      return {
        mediaType,
        mediaFile: source,
        videoUrl: '',
        width: normalizeWidth(match[3]),
        alt: decodeAttribute(match[4])
      }
    },
    toBlock(data) {
      const mediaType = getValue(data, 'mediaType', 'image') === 'video' ? 'video' : 'image'
      const mediaFile = getValue(data, 'mediaFile')
      const videoUrl = getValue(data, 'videoUrl')
      const source = mediaType === 'video' ? (videoUrl || mediaFile) : mediaFile
      const width = normalizeWidth(getValue(data, 'width', 100))

      return `<DocMedia type="${mediaType}" src="${escapeAttribute(source)}" width="${width}" alt="${escapeAttribute(getValue(data, 'alt'))}" />`
    },
    toPreview(data, getAsset) {
      const mediaType = getValue(data, 'mediaType', 'image') === 'video' ? 'video' : 'image'
      const mediaFile = getValue(data, 'mediaFile')
      const storedMedia = mediaFile ? String(getAsset(mediaFile) || mediaFile) : ''
      const source = mediaType === 'video' ? (getValue(data, 'videoUrl') || storedMedia) : storedMedia
      return previewCard(mediaType, source, normalizeWidth(getValue(data, 'width', 100)), getValue(data, 'alt'))
    }
  })
})()
