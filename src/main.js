import './style.css'
import { supabase } from '../supabase.js'
const app = document.querySelector('#app')

const ADMIN_EMAIL = 'admin@admin.com'
const ADMIN_PASSWORD = '123456'

const SHIFTS = [
  '08:00',
  '09:00',
  '10:00',
  '12:00',
  '15:00',
  '18:00',
  '22:00',
  '00:00'
]

const SHIFT_START = {
  '08:00': 8,
  '09:00': 9,
  '10:00': 10,
  '12:00': 12,
  '15:00': 15,
  '18:00': 18,
  '22:00': 22,
  '00:00': 24
}

const SHIFT_END = {
  '08:00': 17,
  '09:00': 18,
  '10:00': 19,
  '12:00': 21,
  '15:00': 24,
  '18:00': 26,
  '22:00': 30,
  '00:00': 32
}

/* =========================
   LOCAL STORAGE
========================= */

function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || []
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users))
}

function getEmployees() {
  return JSON.parse(localStorage.getItem('employees')) || []
}

function saveEmployees(employees) {
  localStorage.setItem('employees', JSON.stringify(employees))
}

function getSchedules() {
  return JSON.parse(localStorage.getItem('schedules')) || {}
}

function saveSchedules(schedules) {
  localStorage.setItem('schedules', JSON.stringify(schedules))
}

function getScheduleKey(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

/* =========================
   AYDAKI İŞ GÜNLƏRİ
   Bazar ertəsi - Cümə
========================= */

function getMonthWorkDays(year, month) {
  const daysInMonth =
    new Date(year, month, 0).getDate()

  let count = 0

  for (let day = 1; day <= daysInMonth; day++) {
    const date =
      new Date(year, month - 1, day)

    const weekDay =
      date.getDay()

    if (
      weekDay !== 0 &&
      weekDay !== 6
    ) {
      count++
    }
  }

  return count
}

/* =========================
   12 SAAT İSTİRAHƏT
========================= */

function has12HourRest(previousShift, nextShift) {
  if (
    !previousShift ||
    previousShift === 'İstirahət'
  ) {
    return true
  }

  const previousEnd =
    SHIFT_END[previousShift]

  let nextStart =
    24 + SHIFT_START[nextShift]

  if (nextShift === '00:00') {
    nextStart = 48
  }

  return (
    nextStart -
    previousEnd >=
    12
  )
}

/* =========================
   LOGIN
========================= */

function showLogin() {
  app.innerHTML = `
    <div class="page">

      <div class="login-card">

        <h1>Növbə İdarəetmə Sistemi</h1>

        <p class="subtitle">
          Hesabınıza daxil olun
        </p>

        <form id="loginForm">

          <label>
            E-poçt

            <input
              type="email"
              id="loginEmail"
              placeholder="example@email.com"
              required
            />
          </label>

          <label>
            Şifrə

            <input
              type="password"
              id="loginPassword"
              placeholder="Şifrənizi daxil edin"
              required
            />
          </label>

          <button type="submit">
            Daxil ol
          </button>
        
        
        <button
          type="button"
          id="forgotPasswordBtn"
          class="forgot-password-btn"
        >
          Şifrəni unutmusunuz?
        </button>
        
        </form>
       

        <div class="divider">
          <span>və ya</span>
        </div>

        <button
          class="register-btn"
          id="registerBtn"
        >
          Qeydiyyatdan keç
        </button>

        <p
          class="message"
          id="message"
        ></p>

      </div>

    </div>
  `

  document
    .querySelector('#registerBtn')
    .addEventListener(
      'click',
      showRegister
    )
    
  
  document
    .querySelector('#forgotPasswordBtn')
    .addEventListener(
      'click',
      async () => {
        const email =
          document
            .querySelector('#loginEmail')
            .value
            .trim()
            .toLowerCase()
  
        const message =
          document
            .querySelector('#message')
  
        if (!email) {
          message.textContent =
            'Əvvəlcə e-poçt ünvanınızı daxil edin.'
          return
        }
  
        const { error } =
          await supabase
            .auth
            .resetPasswordForEmail(
              email,
              {
                redirectTo:
                  'https://wonderful-panda-c34802.netlify.app'
              }
            )
  
        if (error) {
          console.error(error)
          message.textContent =
            'Şifrə yeniləmə linki göndərilmədi.'
          return
        }
  
        message.textContent =
          'Şifrə yeniləmə linki e-poçtunuza göndərildi.'
      }
    )
  

    document
    .querySelector('#loginForm')
    .addEventListener(
      'submit',
      async event => {

        event.preventDefault()

        const email =
          document
            .querySelector('#loginEmail')
            .value
            .trim()
            .toLowerCase()

        const password =
          document
            .querySelector('#loginPassword')
            .value

        const message =
          document
            .querySelector('#message')

            if (
              email === ADMIN_EMAIL &&
              password === ADMIN_PASSWORD
            ) {
              const {
                data: adminAuth,
                error: adminAuthError
              } = await supabase.auth.signInWithPassword({
                email,
                password
              })
            
              if (adminAuthError) {
                console.error(adminAuthError)
                message.textContent =
                  'Admin hesabına giriş mümkün olmadı.'
                return
              }
            
              const {
                data: adminProfile,
                error: adminProfileError
              } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', adminAuth.user.id)
                .single()
            
              if (
                adminProfileError ||
                !adminProfile ||
                adminProfile.role !== 'admin'
              ) {
                console.error(adminProfileError)
            
                await supabase.auth.signOut()
            
                message.textContent =
                  'Bu hesabın admin səlahiyyəti yoxdur.'
            
                return
              }
            
              localStorage.setItem(
                'currentUser',
                JSON.stringify(adminProfile)
              )
            
              await showAdminDashboard()
            
              return
            }

        const {
          data: authData,
          error: authError
        } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        
        if (authError) {
          message.textContent =
            'E-poçt və ya şifrə yanlışdır.'
          return
        }
        
        const {
          data: profile,
          error: profileError
        } = await supabase
      
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()
        
        if (profileError || !profile) {
          message.textContent =
            'Profil məlumatı tapılmadı.'
          await supabase.auth.signOut()
          return
        }


        
        if (profile.status === 'rejected') {
          message.textContent =
            'Hesabınız rədd edilib.'
        
          await supabase.auth.signOut()
          return
        }

        localStorage.setItem(
          'currentUser',
          JSON.stringify(profile)
        )

        showOperatorDashboard(profile)
      }
    )
}
function showResetPassword() {
  app.innerHTML = `
    <div class="page">
      <div class="login-card">
        <h1>Yeni şifrə</h1>

        <p class="subtitle">
          Yeni şifrənizi daxil edin
        </p>

        <form id="resetPasswordForm">

          <label>
            Yeni şifrə

            <input
              id="newPassword"
              type="password"
              minlength="6"
              required
            />
          </label>

          <label>
            Yeni şifrəni təkrarla

            <input
              id="confirmNewPassword"
              type="password"
              minlength="6"
              required
            />
          </label>

          <button type="submit">
            Şifrəni yenilə
          </button>

        </form>

        <p
          id="resetMessage"
          class="message"
        ></p>
      </div>
    </div>
  `

  document
    .querySelector('#resetPasswordForm')
    .addEventListener(
      'submit',
      async event => {

        event.preventDefault()

        const password =
          document
            .querySelector('#newPassword')
            .value

        const confirmPassword =
          document
            .querySelector('#confirmNewPassword')
            .value

        const message =
          document
            .querySelector('#resetMessage')

        if (password !== confirmPassword) {
          message.textContent =
            'Şifrələr eyni deyil.'
          return
        }

        if (password.length < 6) {
          message.textContent =
            'Şifrə minimum 6 simvol olmalıdır.'
          return
        }

        const { error } =
          await supabase
            .auth
            .updateUser({
              password
            })

        if (error) {
          console.error(error)
          message.textContent =
            'Şifrə yenilənmədi.'
          return
        }

        message.textContent =
          'Şifrə uğurla yeniləndi.'

        setTimeout(() => {
          showLogin()
        }, 1500)
      }
    )
}
/* =========================
   REGISTER
========================= */

function showRegister() {
  app.innerHTML = `
    <div class="page">

      <div class="login-card">

        <h1>Qeydiyyat</h1>

        <p class="subtitle">
          Yeni hesab yaradın
        </p>

        <form id="registerForm">

          <label>
            Ad
            <input
              id="name"
              type="text"
              required
            />
          </label>

          <label>
            Soyad
            <input
              id="surname"
              type="text"
              required
            />
          </label>

          <label>
            E-poçt
            <input
              id="email"
              type="email"
              required
            />
          </label>

          <label>
            Şifrə
            <input
              id="password"
              type="password"
              minlength="6"
              required
            />
          </label>

          <label>
            Şifrəni təkrarla
            <input
              id="confirmPassword"
              type="password"
              required
            />
          </label>

          <button type="submit">
            Hesab yarat
          </button>

        </form>

        <div class="divider">
          <span>və ya</span>
        </div>

        <button
          id="backBtn"
          class="register-btn"
        >
          Girişə qayıt
        </button>

        <p
          id="registerMessage"
          class="message"
        ></p>

      </div>

    </div>
  `

  document
    .querySelector('#backBtn')
    .addEventListener(
      'click',
      showLogin
    )

  document
    .querySelector('#registerForm')
    .addEventListener(
      'submit',
      async event => {

        event.preventDefault()

        const name =
          document
            .querySelector('#name')
            .value
            .trim()

        const surname =
          document
            .querySelector('#surname')
            .value
            .trim()

        const email =
          document
            .querySelector('#email')
            .value
            .trim()
            .toLowerCase()

        const password =
          document
            .querySelector('#password')
            .value

        const confirmPassword =
          document
            .querySelector('#confirmPassword')
            .value

        const message =
          document
            .querySelector('#registerMessage')

        if (
          password !==
          confirmPassword
        ) {
          message.textContent =
            'Şifrələr eyni deyil.'
          return
        }

        const users =
          getUsers()

        if (
          users.some(
            user =>
              user.email.toLowerCase() === email
          ) ||
          email === ADMIN_EMAIL
        ) {
          message.textContent =
            'Bu e-poçt artıq istifadə olunur.'
          return
        }

        const fullName =
  `${name} ${surname}`.trim()

  const { data, error } =
  await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })

if (error) {
  console.error(error)

  message.textContent =
    'Qeydiyyat zamanı xəta baş verdi: ' +
    error.message

  return
}

if (data.user) {
  const { error: profileError } =
    await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email,
        full_name: fullName,
        role: 'operator',
        status: 'approved'
      })

  if (profileError) {
    console.error(profileError)

    message.textContent =
      'Hesab yaradıldı, amma profil əlavə olunmadı.'

    return
  }
}

if (error) {
  console.error(error)

  message.textContent =
    'Qeydiyyat zamanı xəta baş verdi: ' +
    error.message

  return
}

        document
          .querySelector('#registerForm')
          .reset()

          message.textContent =
          'Qeydiyyat uğurludur. İndi hesabınıza daxil ola bilərsiniz.'
      }
    )
}

/* =========================
   ADMIN DASHBOARD
========================= */

async function showAdminDashboard() {
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    alert('İstifadəçilər yüklənmədi.')
    return
  }

  const employees =
    getEmployees()

  const pending =
    users.filter(
      user =>
        user.status === 'pending'
    ).length

  const approved =
    users.filter(
      user =>
        user.status === 'approved'
    ).length

  app.innerHTML = `
    <div class="dashboard">

      <aside class="sidebar">

        <h2>Növbə Sistemi</h2>

        <button
          id="dashboardBtn"
          class="menu-btn"
        >
          Dashboard
        </button>

        <button
          id="usersBtn"
          class="menu-btn"
        >
          İstifadəçilər
        </button>

        <button
          id="employeesBtn"
          class="menu-btn"
        >
          Əməkdaşlar
        </button>

        <button
          id="scheduleBtn"
          class="menu-btn"
        >
          Növbə cədvəli
        </button>

        <button
          id="statisticsBtn"
          class="menu-btn"
        >
          Statistika
        </button>

        <button
          id="logoutBtn"
          class="menu-btn logout"
        >
          Çıxış
        </button>

      </aside>

      <main class="dashboard-content">

        <div class="topbar">

          <div>
            <h1>Admin Dashboard</h1>
            <p>Sistemə ümumi baxış</p>
          </div>

          <div class="admin-datetime">
          <div>Admin</div>
        
          <div id="adminDate"></div>
        
          <div id="adminClock"></div>
        </div>

        </div>

        <div class="admin-overview-grid">

        <div class="overview-card blue">
          <div class="overview-icon">👥</div>
          <div>
            <span>Ümumi istifadəçilər</span>
            <strong>${users.length}</strong>
            <small>Sistemdə qeydiyyatdan keçən istifadəçi sayı</small>
          </div>
        </div>
      
        <div class="overview-card green">
          <div class="overview-icon">🧑‍💼</div>
          <div>
            <span>Əməkdaşlar</span>
            <strong>${employees.length}</strong>
            <small>Sistemdə olan ümumi əməkdaş sayı</small>
          </div>
        </div>
      
        <div class="overview-card purple">
          <div class="overview-icon">📅</div>
          <div>
            <span>Bugünkü növbədə</span>
            <strong id="todayShiftCount">0</strong>
            <small>Bu gün növbəsi olan əməkdaş sayı</small>
          </div>
        </div>
      
        <div class="overview-card orange">
          <div class="overview-icon">🕒</div>
          <div>
            <span>Hazırda növbədə</span>
            <strong id="activeShiftCount">0</strong>
            <small>Hazırda növbəsi başlamış əməkdaş sayı</small>
          </div>
        </div>
      
      </div>
      
      <div class="dashboard-detail-grid">
      
        <div class="dashboard-big-card">
      
          <h2>Bugünkü növbə vəziyyəti</h2>
          <p id="todayScheduleDate"></p>
      
          <div class="today-shift-stats">
      
            <div class="today-stat">
              <span>Hazırda növbədə</span>
              <strong id="activeShiftDetail">0</strong>
              <small>Növbəsi başlamış əməkdaş sayı</small>
            </div>
      
            <div class="today-stat">
              <span>Gözlənilir</span>
              <strong id="waitingShiftCount">0</strong>
              <small>Növbəsi başlayacaq əməkdaş sayı</small>
            </div>
      
            <div class="today-stat">
              <span>Bugünkü ümumi növbə</span>
              <strong id="todayShiftDetail">0</strong>
              <small>Bu gün növbəsi olan əməkdaş sayı</small>
            </div>
      
          </div>
      
          <div class="shift-progress">
            <div
              id="activeProgress"
              class="shift-progress-active"
            ></div>
          </div>
      
        </div>
      
        <div class="dashboard-big-card">
      
          <h2>Cari günün xülasəsi</h2>
      
          <div class="summary-row">
            <span>Bugünkü tarix</span>
            <strong id="summaryTodayDate">-</strong>
          </div>
      
          <div class="summary-row">
            <span>Bugünkü növbədə olan əməkdaşlar</span>
            <strong id="summaryTodayShift">0</strong>
          </div>
      
          <div class="summary-row">
            <span>Hazırda növbədə olanlar</span>
            <strong id="summaryActiveShift">0</strong>
          </div>
      
          <div class="summary-row">
            <span>Növbəsi başlayacaq əməkdaşlar</span>
            <strong id="summaryWaitingShift">0</strong>
          </div>
      
        </div>
      
      </div>
      
      <div
        id="dashboardArea"
        class="content-card"
      >
        <h2>İdarəetmə paneli</h2>
        <p>Sol menyudan bölmə seçin.</p>
      </div>

      </main>

    </div>
  `
  function activateAdminMenu(buttonId) {
    const buttons =
      document.querySelectorAll(
        '.sidebar .menu-btn'
      )
  
    buttons.forEach(button => {
      button.classList.remove('active')
    })
  
    const selected =
      document.getElementById(buttonId)
  
    if (selected) {
      selected.classList.add('active')
    }
  }
  async function updateTodayShiftDashboard() {
    const now = new Date()
  
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
  
    const currentMinutes =
      now.getHours() * 60 +
      now.getMinutes()
  
    const {
      data: scheduleData,
      error
    } = await supabase
      .from('schedules')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()
  
    if (error) {
      console.error(error)
      return
    }
  
    let todayCount = 0
    let activeCount = 0
    let waitingCount = 0
  
    if (scheduleData) {
      const scheduleEmployees =
        scheduleData.employees || []
  
      const rows =
        scheduleData.employee_rows || {}
  
      scheduleEmployees.forEach(employee => {
        const shifts =
          rows[employee.id] || []
  
        const shift =
          shifts[day - 1]
  
          if (
            !shift ||
            !SHIFTS.includes(
              String(shift).trim()
            )
          ) {
            return
          }
          
          todayCount++
  
        const [hour, minute] =
          shift.split(':').map(Number)
  
   let startMinutes =
  hour * 60 + (minute || 0)

if (shift === '00:00') {
  startMinutes = 24 * 60
}
  
          const SHIFT_END_MINUTES = {
            '08:00': 17 * 60,
            '09:00': 18 * 60,
            '10:00': 19 * 60,
            '12:00': 21 * 60,
            '15:00': 24 * 60,
            '18:00': 26 * 60,
            '22:00': 30 * 60,
            '00:00': 32 * 60
          }
          
          let adjustedCurrentMinutes =
            currentMinutes
          
          if (
            shift === '18:00' &&
            now.getHours() < 2
          ) {
            adjustedCurrentMinutes += 24 * 60
          }
          
          if (
            shift === '22:00' &&
            now.getHours() < 6
          ) {
            adjustedCurrentMinutes += 24 * 60
          }
          
          if (
            shift === '00:00' &&
            now.getHours() < 8
          ) {
            adjustedCurrentMinutes += 24 * 60
          }
          
          const endMinutes =
            SHIFT_END_MINUTES[shift]
          
          if (
            adjustedCurrentMinutes >= startMinutes &&
            adjustedCurrentMinutes < endMinutes
          ) {
            activeCount++
          } else if (
            adjustedCurrentMinutes < startMinutes
          ) {
            waitingCount++
          }
      })
    }
  
    const formattedDate =
      `${String(day).padStart(2, '0')}.` +
      `${String(month).padStart(2, '0')}.` +
      `${year}`
  
    document.querySelector(
      '#todayShiftCount'
    ).textContent = todayCount
  
    document.querySelector(
      '#activeShiftCount'
    ).textContent = activeCount
  
    document.querySelector(
      '#activeShiftDetail'
    ).textContent = activeCount
  
    document.querySelector(
      '#waitingShiftCount'
    ).textContent = waitingCount
  
    document.querySelector(
      '#todayShiftDetail'
    ).textContent = todayCount
  
    document.querySelector(
      '#todayScheduleDate'
    ).textContent =
      `${formattedDate} tarixinə olan məlumat`
  
    document.querySelector(
      '#summaryTodayDate'
    ).textContent = formattedDate
  
    document.querySelector(
      '#summaryTodayShift'
    ).textContent = todayCount
  
    document.querySelector(
      '#summaryActiveShift'
    ).textContent = activeCount
  
    document.querySelector(
      '#summaryWaitingShift'
    ).textContent = waitingCount
  
    const percent =
      todayCount > 0
        ? Math.round(
            activeCount / todayCount * 100
          )
        : 0
  
    document.querySelector(
      '#activeProgress'
    ).style.width = `${percent}%`
  }
  
  updateTodayShiftDashboard()
  
  setInterval(
    updateTodayShiftDashboard,
    60000
  )
  function updateAdminDateTime() {
    const now = new Date()
  
    const day =
    String(now.getDate()).padStart(2, '0')
  
  const month =
    String(now.getMonth() + 1).padStart(2, '0')
  
  const year =
    now.getFullYear()
  
  const date =
    `${day}.${month}.${year}`
  
    const time =
      now.toLocaleTimeString(
        'az-AZ',
        {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }
      )
  
    const dateElement =
      document.querySelector('#adminDate')
  
    const clockElement =
      document.querySelector('#adminClock')
  
    if (dateElement) {
      dateElement.textContent = date
    }
  
    if (clockElement) {
      clockElement.textContent = time
    }
  }
  
  updateAdminDateTime()
  
  setInterval(updateAdminDateTime, 1000)
  document
    .querySelector('#dashboardBtn')
    .addEventListener(
      'click',
      showAdminDashboard
    )

    document
    .querySelector('#usersBtn')
    .addEventListener(
      'click',
      () => {
        activateAdminMenu('usersBtn')
        showUsersSection()
      }
    )

  document
    .querySelector('#employeesBtn')
    .addEventListener(
      'click',
      showEmployeesSection
    )

  document
    .querySelector('#scheduleBtn')
    .addEventListener(
      'click',
      showScheduleSection
    )

  document
    .querySelector('#statisticsBtn')
    .addEventListener(
      'click',
      showStatisticsSection
    )

  document
    .querySelector('#logoutBtn')
    .addEventListener(
      'click',
      logout
    )
}

/* =========================
   USERS
========================= */

async function showUsersSection() {
  const {
    data: users,
    error
  } =
    await supabase
      .from('profiles')
      .select('*')
      .order(
        'created_at',
        {
          ascending: false
        }
      )

  if (error) {
    console.error(error)

    alert(
      'İstifadəçilər yüklənmədi.'
    )

    return
  }

  const area =
    document.querySelector('#dashboardArea')

  area.innerHTML = `
    <h2>İstifadəçilər</h2>

    <p>
      Qeydiyyatdan keçən istifadəçiləri idarə edin.
    </p>

    <div class="table-wrapper">

      <table>

        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-poçt</th>
            <th>Status</th>
            <th>Əməliyyat</th>
          </tr>
        </thead>

        <tbody>

          ${
            users.length
              ? users.map(
                  user => `
                    <tr>

                    <td>
                    ${user.full_name || '-'}
                  </td>

                      <td>
                        ${user.email}
                      </td>

                      <td>

                        <span
                          class="status ${user.status}"
                        >
                          ${
                            user.status === 'approved'
                              ? 'Təsdiqlənib'
                              : user.status === 'rejected'
                              ? 'Rədd edilib'
                              : 'Gözləyir'
                          }
                        </span>

                      </td>

                      <td>
                      <select
                      class="user-role-select"
                      data-id="${user.id}"
                    >
                    <option value="operator" ${user.role === 'operator' ? 'selected' : ''}>Operator</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    
                    
                        <div class="actions">

                          <button
                            class="approve-btn"
                            data-id="${user.id}"
                          >
                            Təsdiq et
                          </button>

                          <button
                            class="reject-btn"
                            data-id="${user.id}"
                          >
                            Rədd et
                          </button>

                        </div>

                      </td>

                    </tr>
                  `
                ).join('')

              : `
                <tr>
                  <td colspan="4">
                    İstifadəçi yoxdur.
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>
  `


document
document
  .querySelectorAll('.approve-btn')
  .forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'approved'
        })
        .eq('id', id)

      if (error) {
        console.error(error)
        alert('İstifadəçi təsdiqlənmədi.')
        return
      }

      await showUsersSection()
    })
  })

document
  .querySelectorAll('.reject-btn')
  .forEach(button => {
    button.addEventListener('click', async () => {
      const id = button.dataset.id

      const { error } = await supabase
        .from('profiles')
        .update({
          status: 'rejected'
        })
        .eq('id', id)

      if (error) {
        console.error(error)
        alert('İstifadəçi üçün imtina əməliyyatı alınmadı.')
        return
      }

      await showUsersSection()
    })
  })
  document
  .querySelectorAll('.user-role-select')
  .forEach(select => {
    select.addEventListener('change', async () => {
      const id = select.dataset.id
      const role = select.value

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', id)

      if (error) {
        console.error(error)
        alert('Rol dəyişdirilmədi.')
        return
      }

      alert('Rol uğurla dəyişdirildi.')
    })
  })
} // <-- showUsersSection bağlanır, bunu saxla



function updateUserStatus(
  id,
  status
) {
  const users =
    getUsers().map(
      user =>
        user.id === id
          ? {
              ...user,
              status
            }
          : user
    )

  saveUsers(users)

  showUsersSection()
  
}

/* =========================
   EMPLOYEES
   ADD / EDIT / DELETE
========================= */

function showEmployeesSection() {
  const employees =
    getEmployees()

  const area =
    document.querySelector('#dashboardArea')

  area.innerHTML = `
    <h2>Əməkdaşlar</h2>

    <p>
      Əməkdaşları əlavə edə, dəyişdirə və silə bilərsiniz.
    </p>

    <form
      id="employeeForm"
      style="margin-top:25px;"
    >

      <input
        id="editingEmployeeId"
        type="hidden"
      />

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr 1fr;
          gap:15px;
        "
      >

        <label>
          Ad

          <input
            id="employeeName"
            type="text"
            required
          />
        </label>

        <label>
          Soyad

          <input
            id="employeeSurname"
            type="text"
            required
          />
        </label>

        <label>
          Cins

          <select
            id="employeeGender"
            required
          >

            <option value="">
              Seçin
            </option>

            <option value="Kişi">
              Kişi
            </option>

            <option value="Qadın">
              Qadın
            </option>

          </select>

        </label>
        <div class="forbidden-shifts-field">
        <label>Qadağan olunmuş növbələr</label>
      
        <div class="forbidden-shifts-list">
          ${SHIFTS.map(shift => `
            <label class="forbidden-shift-option">
              <input
                type="checkbox"
                name="forbiddenShift"
                value="${shift}"
              >
              <span>${shift}</span>
            </label>
          `).join('')}
        </div>
      </div>
      </div>

      <div
        style="
          display:flex;
          gap:10px;
        "
      >

        <button
          id="saveEmployeeBtn"
          type="submit"
          style="max-width:240px;"
        >
          Əməkdaş əlavə et
        </button>

        <button
          id="cancelEditBtn"
          type="button"
          style="
            max-width:150px;
            background:#6b7280;
            display:none;
          "
        >
          Ləğv et
        </button>

      </div>

    </form>

    <div
      class="table-wrapper"
      style="margin-top:25px;"
    >

      <table>

        <thead>
          <tr>
            <th>№</th>
            <th>Ad Soyad</th>
            <th>Cins</th>
            <th>Əməliyyat</th>
          </tr>
        </thead>

        <tbody>

          ${
            employees.length
              ? employees.map(
                  (employee, index) => `
                    <tr>

                      <td>
                        ${index + 1}
                      </td>

                      <td>
                      ${employee.name}
                      ${employee.surname}
                    
                      ${
                        employee.forbiddenShifts?.length
                          ? `<span class="forbidden-shifts-text">
                              — Qadağan: ${employee.forbiddenShifts.join(', ')}
                            </span>`
                          : ''
                      }
                    </td>

                      <td>
                        ${employee.gender}
                      </td>

                      <td>

                        <div class="actions">

                          <button
                            class="edit-employee-btn"
                            data-id="${employee.id}"
                            style="background:#f59e0b;"
                          >
                            Edit
                          </button>

                          <button
                            class="delete-employee-btn"
                            data-id="${employee.id}"
                            style="background:#dc2626;"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>
                  `
                ).join('')

              : `
                <tr>
                  <td colspan="4">
                    Əməkdaş yoxdur.
                  </td>
                </tr>
              `
          }

        </tbody>

      </table>

    </div>
  `

  const form =
    document.querySelector('#employeeForm')

  const editingInput =
    document.querySelector('#editingEmployeeId')

  const nameInput =
    document.querySelector('#employeeName')

  const surnameInput =
    document.querySelector('#employeeSurname')

  const genderInput =
    document.querySelector('#employeeGender')

  const saveButton =
    document.querySelector('#saveEmployeeBtn')

  const cancelButton =
    document.querySelector('#cancelEditBtn')

  form.addEventListener(
    'submit',
    event => {

      event.preventDefault()

      const name =
        nameInput.value.trim()

      const surname =
        surnameInput.value.trim()

      const gender =
        genderInput.value
        const forbiddenShifts =
        Array.from(
          document.querySelectorAll(
            'input[name="forbiddenShift"]:checked'
          )
        ).map(input => input.value)
      const editingId =
        Number(
          editingInput.value
        )

      let employees =
        getEmployees()

      if (editingId) {

        employees =
          employees.map(
            employee =>
              employee.id === editingId
                ? {
                    ...employee,
                    name,
                    surname,
                    gender,
                    forbiddenShifts
                  }
                : employee
          )
        

        saveEmployees(employees)

        showEmployeesSection()

        return
      }

      const exists =
        employees.some(
          employee =>
            employee.name.toLowerCase() ===
              name.toLowerCase() &&
            employee.surname.toLowerCase() ===
              surname.toLowerCase()
        )

      if (exists) {
        alert(
          'Bu əməkdaş artıq mövcuddur.'
        )
        return
      }

      employees.push({
        id: Date.now(),
        name,
        surname,
        gender
      })

      saveEmployees(employees)

      showEmployeesSection()
    }
  )

  document
    .querySelectorAll('.edit-employee-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            Number(
              button.dataset.id
            )

          const employee =
            getEmployees().find(
              item =>
                item.id === id
            )

          if (!employee) {
            return
          }

          editingInput.value =
            employee.id

          nameInput.value =
            employee.name

          surnameInput.value =
            employee.surname

          genderInput.value =
            employee.gender
            document
            .querySelectorAll(
              'input[name="forbiddenShift"]'
            )
            .forEach(input => {
              input.checked =
                (
                  employee.forbiddenShifts ||
                  []
                ).includes(input.value)
            })
          saveButton.textContent =
            'Dəyişiklikləri yadda saxla'

          cancelButton.style.display =
            'block'

          nameInput.focus()
        }
      )
    })

  document
    .querySelectorAll('.delete-employee-btn')
    .forEach(button => {

      button.addEventListener(
        'click',
        () => {

          const id =
            Number(
              button.dataset.id
            )

          const employee =
            getEmployees().find(
              item =>
                item.id === id
            )

          if (!employee) {
            return
          }

          const confirmed =
            confirm(
              `${employee.name} ${employee.surname} silinsin?`
            )

          if (!confirmed) {
            return
          }

          const employees =
            getEmployees().filter(
              item =>
                item.id !== id
            )

          saveEmployees(employees)

          const schedules =
            getSchedules()

          Object.keys(
            schedules
          ).forEach(key => {

            if (
              schedules[key]
                ?.employeeRows?.[id]
            ) {
              delete schedules[key]
                .employeeRows[id]
            }
          })

          saveSchedules(schedules)

          showEmployeesSection()
        }
      )
    })

  cancelButton.addEventListener(
    'click',
    () => {

      editingInput.value = ''
      nameInput.value = ''
      surnameInput.value = ''
      genderInput.value = ''

      saveButton.textContent =
        'Əməkdaş əlavə et'

      cancelButton.style.display =
        'none'
    }
  )
}

/* =========================
   SCHEDULE SCREEN
========================= */

async function showScheduleSection() {
  const area =
    document.querySelector('#dashboardArea')

  const today =
    new Date()

  area.innerHTML = `
    <h2>Növbə cədvəli</h2>

    <p>
      Hər əməkdaş ayın iş günlərinin sayı qədər işləyir.
      Növbələr arasında minimum 12 saat istirahət saxlanılır.
    </p>

    <div
      style="
        display:grid;
        grid-template-columns:
        180px 180px 210px;
        gap:15px;
        margin-top:25px;
        align-items:end;
      "
    >

      <label>
        Ay

        <select id="scheduleMonth">

          ${[
            'Yanvar',
            'Fevral',
            'Mart',
            'Aprel',
            'May',
            'İyun',
            'İyul',
            'Avqust',
            'Sentyabr',
            'Oktyabr',
            'Noyabr',
            'Dekabr'
          ].map(
            (month, index) => `
              <option
                value="${index + 1}"
                ${
                  today.getMonth() === index
                    ? 'selected'
                    : ''
                }
              >
                ${month}
              </option>
            `
          ).join('')}

        </select>

      </label>

      <label>
        İl

        <input
          id="scheduleYear"
          type="number"
          value="${today.getFullYear()}"
          min="2025"
          max="2035"
        />

      </label>

      <button
      id="generateScheduleBtn"
    >
      Avtomatik yarat
    </button>
    <button
  id="exportScheduleExcelBtn"
  type="button"
>
  Excel yüklə
</button>
    <button
      id="recoverScheduleBtn"
      type="button"
    >
      Recover
    </button>

    </div>

    <p
      id="workDayInfo"
      style="
        margin-top:15px;
        font-weight:600;
      "
    ></p>

    <p
      id="scheduleMessage"
      class="message"
    ></p>

    <div id="scheduleTableArea"></div>
  `

  function updateWorkDayInfo() {
    const month =
      Number(
        document
          .querySelector('#scheduleMonth')
          .value
      )

    const year =
      Number(
        document
          .querySelector('#scheduleYear')
          .value
      )

    const workDays =
      getMonthWorkDays(
        year,
        month
      )

    document
      .querySelector('#workDayInfo')
      .textContent =
      `Bu ayda ${workDays} iş günü var. Hər əməkdaş ${workDays} gün işləyəcək.`
  }

  document
    .querySelector('#generateScheduleBtn')
    .addEventListener(
      'click',
      generateScheduleFromForm
    )
    document
  .querySelector('#exportScheduleExcelBtn')
  .addEventListener(
    'click',
    exportScheduleToExcel
  )
    document
    .querySelector('#recoverScheduleBtn')
    .addEventListener(
      'click',
      recoverPreviousSchedule
    )
  document
    .querySelector('#scheduleMonth')
    .addEventListener(
      'change',
      () => {
        updateWorkDayInfo()
        loadSelectedSchedule()
      }
    )

  document
    .querySelector('#scheduleYear')
    .addEventListener(
      'change',
      () => {
        updateWorkDayInfo()
        loadSelectedSchedule()
      }
    )

    updateWorkDayInfo()
    await loadSelectedSchedule()
    }
    function exportScheduleToExcel() {
      const table =
        document.querySelector(
          '#scheduleTableArea table'
        )
    
      if (!table) {
        alert(
          'Yükləmək üçün əvvəlcə növbə cədvəli yaradın.'
        )
        return
      }
    
      const month =
        Number(
          document.querySelector(
            '#scheduleMonth'
          ).value
        )
    
      const year =
        Number(
          document.querySelector(
            '#scheduleYear'
          ).value
        )
    
      const clonedTable =
        table.cloneNode(true)
    
      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
          </head>
          <body>
            ${clonedTable.outerHTML}
          </body>
        </html>
      `
    
      const blob =
        new Blob(
          ['\ufeff', html],
          {
            type:
              'application/vnd.ms-excel;charset=utf-8;'
          }
        )
    
      const url =
        URL.createObjectURL(blob)
    
      const link =
        document.createElement('a')
    
      link.href = url
    
      link.download =
        `Novbe_Cedveli_${String(month).padStart(2, '0')}_${year}.xls`
    
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    
      URL.revokeObjectURL(url)
    }
/* =========================
   GENERATE
========================= */

async function generateScheduleFromForm() {
  const month =
    Number(
      document
        .querySelector('#scheduleMonth')
        .value
    )

  const year =
    Number(
      document
        .querySelector('#scheduleYear')
        .value
    )

  const employees =
    getEmployees()

  const message =
    document.querySelector('#scheduleMessage')

  if (!employees.length) {
    message.textContent =
      'Əvvəlcə əməkdaş əlavə edin.'
    return
  }
  async function loadSavedSchedule(
    year,
    month
  ) {
    const {
      data,
      error
    } = await supabase
      .from('schedules')
      .select('*')
      .eq('year', Number(year))
      .eq('month', Number(month))
      .maybeSingle()
  
    if (error) {
      console.error(
        'Cədvəl yükləmə xətası:',
        error
      )
      return null
    }
  
    if (!data) {
      return null
    }
  
    return {
      year: data.year,
      month: data.month,
  
      daysInMonth:
        new Date(
          data.year,
          data.month,
          0
        ).getDate(),
  
      targetWorkDays:
        data.target_work_days,
  
      employeeRows:
        data.employee_rows || {},
  
      employees:
        data.employees || []
    }
  }
  const schedule =
    createAutomaticSchedule(
      year,
      month,
      employees
    )

    const {
      data: existingSchedule,
      error: existingError
    } = await supabase
      .from('schedules')
      .select(`
        employee_rows,
        employees,
        target_work_days
      `)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()
    
    if (existingError) {
      console.error(existingError)
    
      message.textContent =
        'Əvvəlki cədvəl yoxlanılmadı.'
    
      return
    }
    
    const { error } = await supabase
      .from('schedules')
      .upsert(
        {
          year: year,
          month: month,
    
          target_work_days:
            schedule.targetWorkDays,
    
          employee_rows:
            schedule.employeeRows,
    
          employees:
            employees,
    
          previous_employee_rows:
            existingSchedule?.employee_rows || null,
    
          previous_employees:
            existingSchedule?.employees || null,
    
          previous_target_work_days:
            existingSchedule?.target_work_days || null
        },
        {
          onConflict: 'year,month'
        }
      )
  
  if (error) {
    console.error(error)
  
    message.textContent =
      'Cədvəli Supabase-də yadda saxlamaq mümkün olmadı.'
  
    return
  }
  const savedYear =
  Number(
    document.querySelector(
      '#scheduleYear'
    ).value
  )

const savedMonth =
  Number(
    document.querySelector(
      '#scheduleMonth'
    ).value
  )

const savedSchedule =
  await loadSavedSchedule(
    savedYear,
    savedMonth
  )

if (savedSchedule) {
  renderEmployeeSchedule(
    savedSchedule
  )
}
  message.textContent =
    `Cədvəl yaradıldı. Hər əməkdaş üçün hədəf ${schedule.targetWorkDays} iş günüdür.`
  
  renderEmployeeSchedule(
    schedule
  )
}
/* =========================
   AVTOMATİK NÖVBƏ
========================= */

async function recoverPreviousSchedule() {
  const month =
    Number(
      document
        .querySelector('#scheduleMonth')
        .value
    )

  const year =
    Number(
      document
        .querySelector('#scheduleYear')
        .value
    )

  const { data, error } =
    await supabase
      .from('schedules')
      .select('*')
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

  if (error) {
    console.error(error)
    alert('Cədvəl yüklənmədi.')
    return
  }

  if (!data) {
    alert('Cədvəl tapılmadı.')
    return
  }

  // 1-ci Recover:
  // Son manual dəyişiklikdən əvvəlki vəziyyəti qaytar
  if (data.manual_previous_employee_rows) {
    const {
      data: recoveredManual,
      error: manualError
    } =
      await supabase
        .from('schedules')
        .update({
          employee_rows:
            data.manual_previous_employee_rows,

          manual_previous_employee_rows:
            null
        })
        .eq('id', data.id)
        .select()
        .single()

    if (manualError) {
      console.error(manualError)

      alert(
        'Manual dəyişiklik geri qaytarılmadı.'
      )

      return
    }

    const schedule = {
      year:
        recoveredManual.year,

      month:
        recoveredManual.month,

      daysInMonth:
        new Date(
          recoveredManual.year,
          recoveredManual.month,
          0
        ).getDate(),

      targetWorkDays:
        recoveredManual.target_work_days,

      employeeRows:
        recoveredManual.employee_rows || {}
    }

    renderEmployeeSchedule(schedule)

    alert(
      'Son manual növbə dəyişikliyi geri qaytarıldı.'
    )

    return
  }

  // 2-ci Recover:
  // Əvvəlki ümumi cədvəli qaytar
  if (!data.previous_employee_rows) {
    alert(
      'Geri qaytarılacaq əvvəlki cədvəl yoxdur.'
    )

    return
  }

  const {
    data: recovered,
    error: recoverError
  } =
    await supabase
      .from('schedules')
      .update({
        employee_rows:
          data.previous_employee_rows,

        employees:
          data.previous_employees ||
          data.employees,

        target_work_days:
          data.previous_target_work_days ||
          data.target_work_days,

        previous_employee_rows:
          data.employee_rows,

        previous_employees:
          data.employees,

        previous_target_work_days:
          data.target_work_days
      })
      .eq('id', data.id)
      .select()
      .single()

  if (recoverError) {
    console.error(recoverError)

    alert(
      'Əvvəlki cədvəl bərpa edilmədi.'
    )

    return
  }

  const schedule = {
    year:
      recovered.year,

    month:
      recovered.month,

    daysInMonth:
      new Date(
        recovered.year,
        recovered.month,
        0
      ).getDate(),

    targetWorkDays:
      recovered.target_work_days,

    employeeRows:
      recovered.employee_rows || {}
  }

  renderEmployeeSchedule(schedule)

  alert(
    'Əvvəlki ümumi cədvəl bərpa edildi.'
  )
}
/* =========================
   AVTOMATİK NÖVBƏ
========================= */

function createAutomaticSchedule(
  year,
  month,
  employees
) {
  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate()

  const targetWorkDays =
    getMonthWorkDays(
      year,
      month
    )

  const FIXED_SHIFTS = [
    '08:00',
    '09:00',
    '10:00',
    '22:00',
    '00:00'
  ]

  const FLEX_SHIFTS = [
    '12:00',
    '15:00',
    '18:00'
  ]

  const ALL_SHIFTS = [
    ...FIXED_SHIFTS,
    ...FLEX_SHIFTS
  ]

  if (!employees.length) {
    throw new Error(
      'Əməkdaş siyahısı boşdur.'
    )
  }

  const employeeRows = {}
  const workedCount = {}
  const shiftCounts = {}

  employees.forEach(employee => {
    employeeRows[employee.id] =
      Array(daysInMonth).fill(
        'İstirahət'
      )

    workedCount[employee.id] = 0

    shiftCounts[employee.id] = {}

    ALL_SHIFTS.forEach(shift => {
      shiftCounts[
        employee.id
      ][shift] = 0
    })
  })
  const weeklyRestDays = {}

  employees.forEach(employee => {
    weeklyRestDays[employee.id] = new Set()
  
    for (
      let weekStart = 0;
      weekStart < daysInMonth;
      weekStart += 7
    ) {
      const weekDays = []
  
      for (
        let i = 0;
        i < 7 &&
        weekStart + i < daysInMonth;
        i++
      ) {
        weekDays.push(weekStart + i)
      }
  
      const shuffledDays =
        [...weekDays].sort(
          () => Math.random() - 0.5
        )
  
      const restCount =
        weekDays.length === 7
          ? 2
          : Math.max(
              0,
              weekDays.length - 5
            )
  
      shuffledDays
        .slice(0, restCount)
        .forEach(dayIndex => {
          weeklyRestDays[
            employee.id
          ].add(dayIndex)
        })
    }
  })
  /*
    Ay üzrə ümumi neçə iş növbəsi
    paylanmalıdır.
  */

    const minimumAssignments =
    daysInMonth * 8
  
  const baseAssignments =
    employees.length *
    targetWorkDays
  
  const totalAssignments =
    Math.max(
      baseAssignments,
      minimumAssignments
    )
  
    const employeeTargets = {}

    employees.forEach(employee => {
      employeeTargets[employee.id] =
        targetWorkDays
    })

  /*
    Hər gün neçə nəfər işləyəcək.
    Minimum 8 nəfər.
  */

  const dailyEmployeeCount =
    Array(daysInMonth).fill(8)

  let remainingAssignments =
    totalAssignments -
    minimumAssignments

  /*
    Əlavə işçiləri günlər arasında
    təsadüfi paylayırıq.
  */

  while (
    remainingAssignments > 0
  ) {
    const day =
      Math.floor(
        Math.random() *
        daysInMonth
      )

    if (
      dailyEmployeeCount[day] <
      employees.length
    ) {
      dailyEmployeeCount[day]++

      remainingAssignments--
    }
  }

  /*
    Hər gün əməkdaşları seçirik.
  */

  for (
    let dayIndex = 0;
    dayIndex < daysInMonth;
    dayIndex++
  ) {
    const remainingDays =
      daysInMonth -
      dayIndex

    /*
      Əməkdaşları qalan iş günü
      ehtiyacına görə sıralayırıq.
    */

    const candidates =
      [...employees]
      .filter(employee => {
        const hasNotReachedTarget =
          workedCount[employee.id] <
          (
            employeeTargets[employee.id] ||
            targetWorkDays
          )
      
          const remainingNeed =
          (
            employeeTargets[employee.id] ||
            targetWorkDays
          ) -
          workedCount[employee.id]
        
        const remainingCalendarDays =
          daysInMonth - dayIndex
        
        const mustWorkToday =
          remainingNeed >= remainingCalendarDays
        
        const isRestDay =
          weeklyRestDays[
            employee.id
          ]?.has(dayIndex) &&
          !mustWorkToday
      
        return (
          hasNotReachedTarget &&
          !isRestDay
        )
      })
        .map(employee => ({
          employee,

          need:
          (
            employeeTargets[
              employee.id
            ] ||
            targetWorkDays
          ) -
          workedCount[
            employee.id
          ],

          random:
            Math.random()
        }))
        .sort((a, b) => {
          /*
            Ayın sonuna yaxın işləməsi
            vacib olan əməkdaş üstünlük
            alır.
          */

          const mustA =
            a.need >=
            remainingDays
              ? 1
              : 0

          const mustB =
            b.need >=
            remainingDays
              ? 1
              : 0

          if (mustA !== mustB) {
            return mustB - mustA
          }

          if (a.need !== b.need) {
            return b.need - a.need
          }

          return (
            a.random -
            b.random
          )
        })

    const countForToday =
      Math.min(
        dailyEmployeeCount[
          dayIndex
        ],
        candidates.length
      )

    const todayEmployees =
      candidates
        .slice(
          0,
          countForToday
        )
        .map(
          item =>
            item.employee
        )

    /*
      Əvvəl 08,09,10,22,00
      növbələrinin hərəsinə
      DƏQİQ 1 nəfər.
    */

    const availableToday =
      [...todayEmployees]
      const isShiftAllowed = (
        employee,
        shift
      ) => {
        const forbiddenShifts =
          employee.forbiddenShifts || []
      
        return !forbiddenShifts.includes(shift)
      }
    FIXED_SHIFTS.forEach(
      shift => {
        if (
          !availableToday.length
        ) {
          return
        }

        /*
          Həmin növbəni ay ərzində
          ən az işləyən əməkdaşı seç.
        */
          const eligibleEmployees =
          availableToday.filter(
            employee => {
              const forbiddenShifts =
                employee.forbiddenShifts || []
        
              return !forbiddenShifts.includes(
                shift
              )
            }
          )
        
        if (!eligibleEmployees.length) {
          return
        }
        eligibleEmployees.sort(
          (a, b) => {
            const diff =
              shiftCounts[a.id][
                shift
              ] -
              shiftCounts[b.id][
                shift
              ]

            if (diff !== 0) {
              return diff
            }

            return (
              Math.random() -
              0.5
            )
          }
        )

        const employee =
        eligibleEmployees[0]
      
      const employeeIndex =
        availableToday.findIndex(
          item =>
            item.id === employee.id
        )
      
      if (employeeIndex !== -1) {
        availableToday.splice(
          employeeIndex,
          1
        )
      }

        employeeRows[
          employee.id
        ][dayIndex] =
          shift

        shiftCounts[
          employee.id
        ][shift]++
      }
    )

    /*
      12,15,18 növbələrinin
      hərəsinə minimum 1 nəfər.
    */

    FLEX_SHIFTS.forEach(
      shift => {
        if (
          !availableToday.length
        ) {
          return
        }

        availableToday.sort(
          (a, b) => {
            const diff =
              shiftCounts[a.id][
                shift
              ] -
              shiftCounts[b.id][
                shift
              ]

            if (diff !== 0) {
              return diff
            }

            return (
              Math.random() -
              0.5
            )
          }
        )

        const employee =
          availableToday.shift()

        employeeRows[
          employee.id
        ][dayIndex] =
          shift

        shiftCounts[
          employee.id
        ][shift]++
      }
    )
    FLEX_SHIFTS.forEach(shift => {
      if (!availableToday.length) {
        return
      }
    
      const eligibleEmployees =
        availableToday.filter(employee => {
          const forbiddenShifts =
            employee.forbiddenShifts || []
    
          return !forbiddenShifts.includes(shift)
        })
    
      if (!eligibleEmployees.length) {
        return
      }
    
      eligibleEmployees.sort((a, b) => {
        const diff =
          shiftCounts[a.id][shift] -
          shiftCounts[b.id][shift]
    
        if (diff !== 0) {
          return diff
        }
    
        return Math.random() - 0.5
      })
    
      const employee =
        eligibleEmployees[0]
    
      const employeeIndex =
        availableToday.findIndex(
          item => item.id === employee.id
        )
    
      if (employeeIndex !== -1) {
        availableToday.splice(
          employeeIndex,
          1
        )
      }
    
      employeeRows[
        employee.id
      ][dayIndex] = shift
    
      shiftCounts[
        employee.id
      ][shift]++
    })
    /*
      Qalan əməkdaşlar yalnız
      12,15,18 növbələrinə
      balanslı paylanır.
    */

    availableToday.forEach(
      employee => {
        const availableShifts =
          [...FLEX_SHIFTS]
            .sort(
              (a, b) => {
                const diff =
                  shiftCounts[
                    employee.id
                  ][a] -
                  shiftCounts[
                    employee.id
                  ][b]

                if (
                  diff !== 0
                ) {
                  return diff
                }

                return (
                  Math.random() -
                  0.5
                )
              }
            )

        const selectedShift =
          availableShifts[0]

        employeeRows[
          employee.id
        ][dayIndex] =
          selectedShift

        shiftCounts[
          employee.id
        ][selectedShift]++
      }
    )

    /*
      Bu gün işləyənlərin
      aylıq sayını artır.
    */

    todayEmployees.forEach(
      employee => {
        workedCount[
          employee.id
        ]++
      }
    )
  }

  /*
    AYLIQ İŞ NORMASINI TAMAMLA
  */
  employees.forEach(employee => {
     // verdiyim tamamlayıcı kod
  })
  
  /*
    Son yoxlama:
    hər əməkdaş targetWorkDays
    qədər işləməlidir.
  */

  /*
    Son yoxlama:
    hər əməkdaş targetWorkDays
    qədər işləməlidir.
  */

  employees.forEach(employee => {
    const count =
      employeeRows[
        employee.id
      ].filter(
        shift =>
          shift !==
          'İstirahət'
      ).length

      if (
        count < targetWorkDays
      ) {
        console.warn(
          employee.name,
          'normadan az işləyir:',
          count,
          'Hədəf:',
          targetWorkDays
        )
      }
  })

  return {
    year,
    month,
    daysInMonth,
    targetWorkDays,
    employeeRows
  }
}

/* =========================
   LOAD SCHEDULE
========================= */

async function loadSelectedSchedule() {
  const month =
    Number(
      document
        .querySelector('#scheduleMonth')
        .value
    )

  const year =
    Number(
      document
        .querySelector('#scheduleYear')
        .value
    )

  const {
    data,
    error
  } = await supabase
    .from('schedules')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (error) {
    console.error(
      'Cədvəl yüklənmədi:',
      error
    )

    document
      .querySelector('#scheduleTableArea')
      .innerHTML = `
        <p style="margin-top:25px;">
          Cədvəl yüklənərkən xəta baş verdi.
        </p>
      `

    return
  }

  if (!data) {
    document
      .querySelector('#scheduleTableArea')
      .innerHTML = `
        <p style="margin-top:25px;">
          Bu ay üçün cədvəl yaradılmayıb.
        </p>
      `

    return
  }

  const schedule = {
    year: data.year,

    month: data.month,

    daysInMonth:
      new Date(
        data.year,
        data.month,
        0
      ).getDate(),

    targetWorkDays:
      data.target_work_days,

    employeeRows:
      data.employee_rows || {}
  }

  renderEmployeeSchedule(schedule)
}
/* =========================
   TABLE
========================= */

function renderEmployeeSchedule(schedule) {
  const employees = getEmployees()

  const area =
    document.querySelector('#scheduleTableArea')

  const days =
    Array.from(
      {
        length: schedule.daysInMonth
      },
      (_, index) => index + 1
    )

  area.innerHTML = `
    <div
      style="
        margin-top:20px;
        margin-bottom:10px;
        font-weight:600;
      "
    >
      Aylıq iş günü:
      ${schedule.targetWorkDays || '-'}
    </div>

    <div class="table-wrapper">

      <table class="employee-schedule-table">

        <thead>
          <tr>

            <th class="employee-name-column">
              Əməkdaş
            </th>

            ${days.map(day => {
              const date = new Date(
                schedule.year,
                schedule.month - 1,
                day
              )

              const weekDay = date.getDay()

              const isWeekend =
                weekDay === 0 ||
                weekDay === 6

              const isWeekStart =
                weekDay === 1 &&
                day !== 1

              return `
                <th class="
                  ${isWeekend ? 'weekend-day' : ''}
                  ${isWeekStart ? 'week-start' : ''}
                ">
                  ${String(day).padStart(2, '0')}.${String(schedule.month).padStart(2, '0')}
                </th>
              `
            }).join('')}

          </tr>
        </thead>

        <tbody>

          ${employees.map(employee => {

            const shifts =
              schedule.employeeRows?.[
                employee.id
              ] || []

            return `
              <tr>

                <td class="employee-name-column">
                  <strong>
                    ${employee.name}
                    ${employee.surname}
                  </strong>
                </td>

                ${days.map((_, index) => {

                  const shift =
                    shifts[index] ||
                    'İstirahət'

                  return `
                    <td
                      class="${
                        shift === 'İstirahət'
                          ? 'rest-day'
                          : ''
                      }"
                    >

                      <button
                        type="button"
                        class="shift-edit-btn"
                        data-employee-id="${employee.id}"
                        data-day-index="${index}"
                        data-current-shift="${shift}"
                      >
                        ${shift}
                      </button>

                    </td>
                  `
                }).join('')}

              </tr>
            `
          }).join('')}

        </tbody>

      </table>

    </div>
  `

  area.onclick = event => {

    const button =
      event.target.closest(
        '.shift-edit-btn'
      )

    if (!button) {
      return
    }

    const employeeId =
      button.dataset.employeeId

    const dayIndex =
      Number(
        button.dataset.dayIndex
      )

    const currentShift =
      button.dataset.currentShift

    document
      .querySelectorAll(
        '.shift-dropdown'
      )
      .forEach(
        menu => menu.remove()
      )

    const dropdown =
      document.createElement('div')

    dropdown.className =
      'shift-dropdown'

    const options = [
      'İstirahət',
      '08:00',
      '09:00',
      '10:00',
      '12:00',
      '15:00',
      '18:00',
      '22:00',
      '00:00'
    ]

    options.forEach(option => {

      const optionButton =
        document.createElement(
          'button'
        )

      optionButton.type =
        'button'

      optionButton.className =
        'shift-dropdown-option'

      if (
        option === currentShift
      ) {
        optionButton
          .classList
          .add('current')
      }

      optionButton.textContent =
        option

      optionButton.addEventListener(
        'click',
        async optionEvent => {

          optionEvent.stopPropagation()

          const oldShift =
          schedule.employeeRows[
            employeeId
          ][dayIndex]
        
        const beforeManualChange =
          JSON.parse(
            JSON.stringify(
              schedule.employeeRows
            )
          )
        
        schedule.employeeRows[
          employeeId
        ][dayIndex] = option

          const { error } =
            await supabase
              .from('schedules')
              .update({
                manual_previous_employee_rows:
                  beforeManualChange,
              
                employee_rows:
                  schedule.employeeRows
              })
              .eq(
                'year',
                schedule.year
              )
              .eq(
                'month',
                schedule.month
              )

          if (error) {

            console.error(error)

            schedule.employeeRows[
              employeeId
            ][dayIndex] =
              oldShift

            alert(
              'Növbə yadda saxlanmadı.'
            )

            return
          }

          dropdown.remove()

          renderEmployeeSchedule(
            schedule
          )
        }
      )

      dropdown.appendChild(
        optionButton
      )
    })

    const cell =
      button.closest('td')

    cell.style.position =
      'relative'

    cell.appendChild(
      dropdown
    )
  }
}

/* =========================
   STATISTICS
========================= */

async function showStatisticsSection() {
  const area =
    document.querySelector('#dashboardArea')

  const now = new Date()

  const year =
    Number(
      localStorage.getItem('selectedYear')
    ) || now.getFullYear()

  const month =
    Number(
      localStorage.getItem('selectedMonth')
    ) || (now.getMonth() + 1)

  area.innerHTML = `
    <h2>Statistika</h2>

    <p>
      ${String(month).padStart(2, '0')}.${year}
      üzrə əməkdaş statistikası
    </p>

    <div id="statisticsContent">
      Məlumat yüklənir...
    </div>
  `

  const {
    data: schedule,
    error
  } = await supabase
    .from('schedules')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  const content =
    document.querySelector(
      '#statisticsContent'
    )

  if (error) {
    console.error(error)

    content.innerHTML = `
      <p>Statistika yüklənmədi.</p>
    `

    return
  }

  if (!schedule) {
    content.innerHTML = `
      <p>
        Bu ay üçün növbə cədvəli yaradılmayıb.
      </p>
    `

    return
  }

  const employees =
    schedule.employees || []

  const rows =
    schedule.employee_rows || {}

  const shifts = [
    '08:00',
    '09:00',
    '10:00',
    '12:00',
    '15:00',
    '18:00',
    '22:00',
    '00:00'
  ]

  const statistics =
    employees.map(employee => {

      const employeeShifts =
        rows[employee.id] || []

      const shiftCounts = {}

      shifts.forEach(shift => {
        shiftCounts[shift] = 0
      })

      let restDays = 0
      let workDays = 0

      employeeShifts.forEach(shift => {

        if (
          !shift ||
          String(shift)
            .trim()
            .toLowerCase() ===
            'istirahət'
        ) {
          restDays++
          return
        }

        if (
          shifts.includes(shift)
        ) {
          workDays++

          shiftCounts[shift]++
        }
      })

      return {
        employee,
        shiftCounts,
        restDays,
        workDays
      }
    })

  content.innerHTML = `
    <div class="table-wrapper">

      <table class="statistics-table">

        <thead>
          <tr>

            <th>Əməkdaş</th>

            ${shifts.map(
              shift => `
                <th>${shift}</th>
              `
            ).join('')}

            <th>İş günü</th>

            <th>İstirahət</th>

            <th>Ümumi növbə</th>

          </tr>
        </thead>

        <tbody>

          ${statistics.map(item => {

            const employeeName =
              item.employee.full_name ||
              item.employee.name ||
              item.employee.email ||
              'Adsız əməkdaş'

            return `
              <tr>

                <td>
                  <strong>
                    ${employeeName}
                  </strong>
                </td>

                ${shifts.map(
                  shift => `
                    <td>
                      ${
                        item.shiftCounts[
                          shift
                        ]
                      }
                    </td>
                  `
                ).join('')}

                <td>
                  <strong>
                    ${item.workDays}
                  </strong>
                </td>

                <td>
                  ${item.restDays}
                </td>

                <td>
                  <strong>
                    ${item.workDays}
                  </strong>
                </td>

              </tr>
            `
          }).join('')}

        </tbody>

      </table>

    </div>
  `
}

/* =========================
   OPERATOR
========================= */

function showOperatorDashboard(user) {
  app.innerHTML = `
    <div class="dashboard">

      <aside class="sidebar">

        <h2>Növbə Sistemi</h2>

        <button
          class="menu-btn active"
          id="operatorDashboardBtn"
        >
          Dashboard
        </button>

        <button
          class="menu-btn"
          id="operatorScheduleBtn"
        >
          Növbə cədvəli
        </button>

        <button
          class="menu-btn"
          id="operatorEmployeesBtn"
        >
          Əməkdaşlar
        </button>

        <button
        class="menu-btn"
        id="operatorProfileBtn"
      >
        Profil
      </button>

        <button
          class="menu-btn logout"
          id="logoutBtn"
        >
          Çıxış
        </button>

      </aside>

      <main class="dashboard-content">

        <div class="topbar">

          <div>
            <h1>
              Xoş gəldiniz,
              ${user.name}
            </h1>

            <p>
              Operator paneli
            </p>
          </div>

        </div>

        <div
          id="operatorArea"
          class="content-card"
        >
          <h2>Dashboard</h2>

          <p>
            Sistem məlumatlarını burada görə bilərsiniz.
          </p>
        </div>

      </main>

    </div>
  `

  document
    .querySelector('#operatorDashboardBtn')
    .addEventListener(
      'click',
      () => {

        document
          .querySelector('#operatorArea')
          .innerHTML = `
            <h2>Dashboard</h2>
            <p>
              Sistem məlumatlarını burada görə bilərsiniz.
            </p>
          `
      }
    )

  document
    .querySelector('#operatorScheduleBtn')
    .addEventListener(
      'click',
      showOperatorSchedule
    )

  document
    .querySelector('#operatorEmployeesBtn')
    .addEventListener(
      'click',
      showOperatorEmployees
    )
    document
    .querySelector('#operatorProfileBtn')
    .addEventListener('click', () => {
  
      document.querySelector('#operatorArea').innerHTML = `
        <h2>Profilim</h2>
  
        <div class="profile-info">
  
          <label>Ad Soyad</label>
          <input
            type="text"
            id="profileFullName"
            value="${user.full_name || user.name || ''}"
          >
  
          <label>E-poçt</label>
          <input
            type="email"
            id="profileEmail"
            value="${user.email || ''}"
            disabled
          >
  
          <label>Telefon nömrəsi</label>
          <input
            type="text"
            id="profilePhone"
            value="${user.phone || ''}"
            placeholder="+994..."
          >
  
          <button id="saveProfileBtn">
            Yadda saxla
          </button>
  
          <hr>
  
          <h3>Şifrəni dəyiş</h3>
  
          <input
            type="password"
            id="newPassword"
            placeholder="Yeni şifrə"
          >
  
          <button id="changePasswordBtn">
            Şifrəni dəyiş
          </button>
  
          <p id="profileMessage"></p>
  
        </div>
      `
  
      document
        .querySelector('#saveProfileBtn')
        .addEventListener('click', async () => {
  
          const fullName =
            document.querySelector('#profileFullName').value.trim()
  
          const phone =
            document.querySelector('#profilePhone').value.trim()
  
          const message =
            document.querySelector('#profileMessage')
  
          const { error } = await supabase
            .from('profiles')
            .update({
              full_name: fullName,
              phone: phone
            })
            .eq('id', user.id)
  
          if (error) {
            console.error(error)
            message.textContent =
              'Məlumatları yadda saxlamaq mümkün olmadı.'
            return
          }
  
          user.full_name = fullName
          user.phone = phone
  
          message.textContent =
            'Profil məlumatları yadda saxlanıldı.'
        })
  
      document
        .querySelector('#changePasswordBtn')
        .addEventListener('click', async () => {
  
          const password =
            document.querySelector('#newPassword').value
  
          const message =
            document.querySelector('#profileMessage')
  
          if (password.length < 6) {
            message.textContent =
              'Şifrə minimum 6 simvol olmalıdır.'
            return
          }
  
          const { error } = await supabase.auth.updateUser({
            password: password
          })
  
          if (error) {
            console.error(error)
            message.textContent =
              'Şifrəni dəyişmək mümkün olmadı.'
            return
          }
  
          document.querySelector('#newPassword').value = ''
  
          message.textContent =
            'Şifrə uğurla dəyişdirildi.'
        })
    })
 

  document
    .querySelector('#logoutBtn')
    .addEventListener(
      'click',
      logout
    )
}

async function showOperatorSchedule() {
  const area =
    document.querySelector('#operatorArea')

  area.innerHTML = `
    <h2>Növbə cədvəli</h2>
    <p>Cədvəl yüklənir...</p>
  `

  const { data: schedules, error } =
    await supabase
      .from('schedules')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)

  if (error) {
    console.error(error)

    area.innerHTML = `
      <h2>Növbə cədvəli</h2>
      <p>Cədvəli yükləmək mümkün olmadı.</p>
    `
    return
  }

  if (!schedules || !schedules.length) {
    area.innerHTML = `
      <h2>Növbə cədvəli</h2>
      <p>Hələ cədvəl yaradılmayıb.</p>
    `
    return
  }

  const savedSchedule = schedules[0]

  const employees =
    savedSchedule.employees || []

  const employeeRows =
    savedSchedule.employee_rows || {}

  const daysInMonth =
    new Date(
      savedSchedule.year,
      savedSchedule.month,
      0
    ).getDate()

  const days =
    Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    )

  area.innerHTML = `
    <h2>Növbə cədvəli</h2>

    <p>
      ${String(savedSchedule.month).padStart(2, '0')}.${savedSchedule.year}
      — yalnız baxış üçündür.
    </p>

    <div class="table-wrapper">

      <table class="employee-schedule-table">

        <thead>
          <tr>

            <th class="employee-name-column">
              Əməkdaş
            </th>

            ${days.map(
              day => `
                <th>
                  ${String(day).padStart(2, '0')}.${String(savedSchedule.month).padStart(2, '0')}
                </th>
              `
            ).join('')}

          </tr>
        </thead>

        <tbody>

          ${employees.map(
            employee => {

              const shifts =
                employeeRows?.[employee.id] || []

              return `
                <tr>

                <td class="employee-name-column">
                <strong>
                  ${employee.name}
                  ${employee.surname}
                </strong>
              
                ${
                  employee.forbiddenShifts?.length
                    ? `<span class="forbidden-shifts-text">
                        Qadağan: ${employee.forbiddenShifts.join(', ')}
                      </span>`
                    : ''
                }
              </td>

                  ${days.map(
                    (_, index) => {

                      const shift =
                      shifts[index] || 'İstirahət'
                    
                      return `
                      <td
                        class="${
                          shift === 'İstirahət'
                            ? 'rest-day'
                            : ''
                        }"
                      >
                        <button
                          type="button"
                          class="shift-edit-btn"
                          data-employee-id="${employee.id}"
                          data-day-index="${index}"
                          data-current-shift="${shift}"
                          
                        >
                          ${shift}
                        </button>
                      </td>
                    `
                    }
                  ).join('')}

                </tr>
              `
            }
          ).join('')}

        </tbody>

      </table>

    </div>
    `

    
}


function showOperatorEmployees() {
  const employees =
    getEmployees()
    window.currentAdminSchedule = schedule
  document
    .querySelector('#operatorArea')
    .innerHTML = `
      <h2>Əməkdaşlar</h2>

      <p>
        Bu bölmə yalnız baxış üçündür.
      </p>

      <div class="table-wrapper">

        <table>

          <thead>

            <tr>
              <th>№</th>
              <th>Ad Soyad</th>
              <th>Cins</th>
            </tr>

          </thead>

          <tbody>

            ${employees.map(
              (employee, index) => `
                <tr>

                  <td>
                    ${index + 1}
                  </td>

                  <td>
                  ${employee.name}
                  ${employee.surname}
                
                  ${
                    employee.forbiddenShifts?.length
                      ? `<span class="forbidden-shifts-text">
                          — Qadağan: ${employee.forbiddenShifts.join(', ')}
                        </span>`
                      : ''
                  }
                </td>

                  <td>
                    ${employee.gender}
                  </td>
                 
                </tr>
              `
            ).join('')}

          </tbody>

        </table>

      </div>
    `
}

function showOperatorStatistics() {
  document
    .querySelector('#operatorArea')
    .innerHTML = `
      <h2>Statistika</h2>

      <p>
        Statistika yalnız baxış üçündür.
      </p>
    `
}

/* =========================
   LOGOUT
========================= */

function logout() {
  localStorage.removeItem(
    'currentUser'
  )

  showLogin()
}

/* =========================
   START
========================= */

async function startApp() {
  const currentUser =
    JSON.parse(
      localStorage.getItem(
        'currentUser'
      )
    )

  const urlParams =
    new URLSearchParams(
      window.location.search
    )

  const recoveryCode =
    urlParams.get('code')

  // Maildəki recovery linkindən gəlibsə
  if (recoveryCode) {
    const {
      error
    } =
      await supabase.auth
        .exchangeCodeForSession(
          recoveryCode
        )

    if (error) {
      console.error(error)

      showLogin()

      alert(
        'Şifrə yeniləmə linki etibarsızdır və ya vaxtı bitib.'
      )

      return
    }

    // URL-dən code hissəsini təmizlə
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    )

    showResetPassword()

    return
  }

  // Supabase PASSWORD_RECOVERY event fallback
  supabase.auth.onAuthStateChange(
    (event) => {
      if (
        event ===
        'PASSWORD_RECOVERY'
      ) {
        showResetPassword()
      }
    }
  )

  const {
    data: { session }
  } = await supabase.auth.getSession()
  
  if (!session?.user) {
    localStorage.removeItem('currentUser')
    showLogin()
    return
  }
  
  const { data: profile, error: profileError } =
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
  
  if (profileError || !profile) {
    console.error(profileError)
    await supabase.auth.signOut()
    localStorage.removeItem('currentUser')
    showLogin()
    return
  }
  
  localStorage.setItem(
    'currentUser',
    JSON.stringify(profile)
  )
  
  if (profile.role === 'admin') {
    await showAdminDashboard()
  } else {
    showOperatorDashboard(profile)
  }
  }


startApp()