import {
  acceptInvite,
  getUser,
  login,
  recoverPassword,
  requestPasswordRecovery,
} from '@netlify/identity'

const adminUrl = 'https://muneeralmansoori.github.io/alawal-documentatio/admin/'
const title = document.querySelector('#title')
const message = document.querySelector('#message')
const status = document.querySelector('#status')
const passwordForm = document.querySelector('#password-form')
const loginForm = document.querySelector('#login-form')
const recoveryForm = document.querySelector('#recovery-form')
const hashParams = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''))
const inviteToken = hashParams.get('invite_token')
const recoveryToken = hashParams.get('recovery_token')

function showOnly(form) {
  passwordForm.hidden = form !== passwordForm
  loginForm.hidden = form !== loginForm
  recoveryForm.hidden = form !== recoveryForm
}

function setStatus(text = '', kind = '') {
  status.textContent = text
  status.dataset.kind = kind
}

function setBusy(form, busy) {
  form.querySelector('button[type="submit"]').disabled = busy
}

function authErrorMessage(error) {
  const errorText = String(error?.message || '')
  if (/expired|invalid.*token|token.*invalid/i.test(errorText)) return 'رابط البريد غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا ثم حاول مرة أخرى.'
  if (/invalid.*credentials|email.*password/i.test(errorText)) return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.'
  return 'تعذر إكمال العملية الآن. تحقق من البيانات والاتصال ثم حاول مرة أخرى.'
}

function clearCallbackHash() {
  window.history.replaceState(null, document.title, window.location.pathname + window.location.search)
}

function redirectToAdmin() {
  setStatus('تمت العملية بنجاح. جارٍ فتح لوحة الإدارة...', 'success')
  window.setTimeout(() => window.location.assign(adminUrl), 700)
}

if (inviteToken || recoveryToken) {
  showOnly(passwordForm)
  title.textContent = inviteToken ? 'إنشاء كلمة مرور الحساب' : 'تعيين كلمة مرور جديدة'
  message.textContent = inviteToken
    ? 'أكمل قبول الدعوة بإنشاء كلمة مرور لحساب إدارة التوثيق.'
    : 'أنشئ كلمة مرور جديدة لاستعادة الوصول إلى حسابك.'
  document.querySelector('#new-password').focus()
} else {
  showOnly(loginForm)
  getUser().then((user) => {
    if (user) window.location.assign(adminUrl)
  })
}

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  setStatus()
  const password = document.querySelector('#new-password').value
  const confirmation = document.querySelector('#confirm-password').value

  if (password.length < 8) {
    setStatus('يجب أن تتكون كلمة المرور من ثمانية أحرف على الأقل.', 'error')
    return
  }
  if (password !== confirmation) {
    setStatus('كلمتا المرور غير متطابقتين.', 'error')
    return
  }

  setBusy(passwordForm, true)
  try {
    if (inviteToken) await acceptInvite(inviteToken, password)
    else await recoverPassword(recoveryToken, password)
    clearCallbackHash()
    redirectToAdmin()
  } catch (error) {
    setStatus(authErrorMessage(error), 'error')
    setBusy(passwordForm, false)
  }
})

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  setStatus()
  setBusy(loginForm, true)
  try {
    await login(document.querySelector('#email').value.trim(), document.querySelector('#password').value)
    redirectToAdmin()
  } catch (error) {
    setStatus(authErrorMessage(error), 'error')
    setBusy(loginForm, false)
  }
})

recoveryForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  setStatus()
  setBusy(recoveryForm, true)
  try {
    await requestPasswordRecovery(document.querySelector('#recovery-email').value.trim())
    setStatus('تم إرسال رابط الاستعادة. افتح الرسالة الجديدة من بريدك لإكمال تعيين كلمة المرور.', 'success')
  } catch (error) {
    setStatus(authErrorMessage(error), 'error')
  } finally {
    setBusy(recoveryForm, false)
  }
})

document.querySelector('#show-recovery').addEventListener('click', () => {
  title.textContent = 'استعادة كلمة المرور'
  message.textContent = 'أدخل بريد الحساب وسنرسل إليك رابطًا لتعيين كلمة مرور جديدة.'
  setStatus()
  showOnly(recoveryForm)
  document.querySelector('#recovery-email').focus()
})

document.querySelector('#show-login').addEventListener('click', () => {
  title.textContent = 'خدمة مصادقة توثيق الأول'
  message.textContent = 'سجّل الدخول بأمان للوصول إلى لوحة إدارة التوثيق.'
  setStatus()
  showOnly(loginForm)
  document.querySelector('#email').focus()
})
