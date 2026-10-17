import Layout from './Layout.vue'
import DocMedia from './components/DocMedia.vue'
import './custom.css'

export default {
  Layout,
  enhanceApp({ app }) {
    app.component('DocMedia', DocMedia)
  }
}
