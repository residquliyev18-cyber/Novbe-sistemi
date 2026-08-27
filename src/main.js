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
      event => {

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

          localStorage.setItem(
            'currentUser',
            JSON.stringify({
              name: 'Admin',
              email: ADMIN_EMAIL,
              role: 'admin'
            })
          )

          showAdminDashboard()

          return
        }

        const users =
          getUsers()

        const user =
          users.find(
            item =>
              item.email.toLowerCase() === email &&
              item.password === password
          )

        if (!user) {
          message.textContent =
            'E-poçt və ya şifrə yanlışdır.'
          return
        }

        if (user.status === 'pending') {
          message.textContent =
            'Hesabınız admin təsdiqini gözləyir.'
          return
        }

        if (user.status === 'rejected') {
          message.textContent =
            'Hesabınız rədd edilib.'
          return
        }

        localStorage.setItem(
          'currentUser',
          JSON.stringify(user)
        )

        showOperatorDashboard(user)
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
      event => {

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

        users.push({
          id: Date.now(),
          name,
          surname,
          email,
          password,
          role: 'operator',
          status: 'pending'
        })

        saveUsers(users)

        document
          .querySelector('#registerForm')
          .reset()

        message.textContent =
          'Qeydiyyat uğurludur. Admin təsdiq etdikdən sonra giriş edə bilərsiniz.'
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
          class="menu-btn active"
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

          <div class="admin-name">
            Admin
          </div>

        </div>

        <div class="stats-grid">

          <div class="stat-card">
            <span>Ümumi istifadəçi</span>
            <strong>${users.length}</strong>
          </div>

          <div class="stat-card">
            <span>Təsdiqlənib</span>
            <strong>${approved}</strong>
          </div>

          <div class="stat-card">
            <span>Təsdiq gözləyir</span>
            <strong>${pending}</strong>
          </div>

          <div class="stat-card">
            <span>Əməkdaş sayı</span>
            <strong>${employees.length}</strong>
          </div>

        </div>

        <div
          id="dashboardArea"
          class="content-card"
        >
          <h2>İdarəetmə paneli</h2>

          <p>
            Sol menyudan bölmə seçin.
          </p>
        </div>

      </main>

    </div>
  `

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
      showUsersSection
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
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
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
                    gender
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

function showScheduleSection() {
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
  loadSelectedSchedule()
}

/* =========================
   GENERATE
========================= */

function generateScheduleFromForm() {
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

  const schedule =
    createAutomaticSchedule(
      year,
      month,
      employees
    )

  const schedules =
    getSchedules()

  schedules[
    getScheduleKey(
      year,
      month
    )
  ] = schedule

  saveSchedules(schedules)

  message.textContent =
    `Cədvəl yaradıldı. Hər əməkdaş üçün hədəf ${schedule.targetWorkDays} iş günüdür.`

  renderEmployeeSchedule(
    schedule
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

  const restDayCount =
    daysInMonth -
    targetWorkDays

  const rows = {}
  const restDays = {}
  const shiftCounts = {}

  employees.forEach(
    employee => {

      rows[employee.id] =
        Array(
          daysInMonth
        ).fill(null)

      restDays[employee.id] =
        new Set()

      shiftCounts[employee.id] = {}

      SHIFTS.forEach(
        shift => {
          shiftCounts[
            employee.id
          ][shift] = 0
        }
      )
    }
  )

  /*
    Hər əməkdaşa ay üzrə
    lazım olan sayda istirahət veririk.

    İstirahət günləri həftənin
    istənilən gününə düşə bilər.
  */

  employees.forEach(
    (employee, employeeIndex) => {

      for (
        let restIndex = 0;
        restIndex < restDayCount;
        restIndex++
      ) {

        let day =
          Math.floor(
            (
              restIndex *
              daysInMonth
            ) /
            restDayCount
          )

        day =
          (
            day +
            employeeIndex * 2
          ) %
          daysInMonth

        let safety = 0

        while (
          restDays[
            employee.id
          ].has(day) &&
          safety <
            daysInMonth
        ) {
          day =
            (
              day + 1
            ) %
            daysInMonth

          safety++
        }

        restDays[
          employee.id
        ].add(day)
      }
    }
  )

  /*
    Gün-gün hər əməkdaşın
    növbəsini seçirik.
  */

  for (
    let day = 0;
    day < daysInMonth;
    day++
  ) {

    employees.forEach(
      (
        employee,
        employeeIndex
      ) => {

        /*
          Planlı istirahət
        */

        if (
          restDays[
            employee.id
          ].has(day)
        ) {
          rows[
            employee.id
          ][day] =
            'İstirahət'

          return
        }

        let allowedShifts =
          [...SHIFTS]

        /*
          Qadınlara gecə növbəsi yoxdur
        */

        if (
          employee.gender ===
          'Qadın'
        ) {
          allowedShifts =
            allowedShifts.filter(
              shift =>
                shift !== '22:00' &&
                shift !== '00:00'
            )
        }

        const previousShift =
          day > 0
            ? rows[
                employee.id
              ][day - 1]
            : null

        /*
          12 saat qaydasına
          uyğun növbələr
        */

        let validShifts =
          allowedShifts.filter(
            shift =>
              has12HourRest(
                previousShift,
                shift
              )
          )

        /*
          Əgər 12 saat qaydasına görə
          seçim çox azalırsa,
          yalnız uyğun olanlardan istifadə edilir.
        */

        if (!validShifts.length) {
          validShifts =
            ['18:00']
        }

        /*
          Əsas balans:
          həmin növbə kimə ən az
          düşübsə, ona üstünlük.
        */

        validShifts.sort(
          (a, b) => {

            const difference =
              shiftCounts[
                employee.id
              ][a] -
              shiftCounts[
                employee.id
              ][b]

            if (
              difference !== 0
            ) {
              return difference
            }

            return (
              (
                SHIFTS.indexOf(a) +
                employeeIndex +
                day
              ) %
              SHIFTS.length
            ) -
            (
              (
                SHIFTS.indexOf(b) +
                employeeIndex +
                day
              ) %
              SHIFTS.length
            )
          }
        )

        const minimum =
          shiftCounts[
            employee.id
          ][validShifts[0]]

        const balanced =
          validShifts.filter(
            shift =>
              shiftCounts[
                employee.id
              ][shift] <=
              minimum + 1
          )

        const selectedShift =
          balanced[
            (
              employeeIndex +
              day
            ) %
            balanced.length
          ]

        rows[
          employee.id
        ][day] =
          selectedShift

        shiftCounts[
          employee.id
        ][selectedShift]++
      }
    )
  }

  /*
    Son yoxlama:
    hər əməkdaşın işlədiyi
    gün sayı hədəfə bərabərdir.
  */

  employees.forEach(
    employee => {

      const worked =
        rows[
          employee.id
        ].filter(
          shift =>
            shift !==
              'İstirahət'
        ).length

      if (
        worked !==
        targetWorkDays
      ) {
        console.warn(
          `${employee.name}: ${worked}/${targetWorkDays}`
        )
      }
    }
  )

  return {
    year,
    month,
    daysInMonth,
    targetWorkDays,
    employeeRows: rows
  }
}

/* =========================
   LOAD SCHEDULE
========================= */

function loadSelectedSchedule() {
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

  const schedules =
    getSchedules()

  const schedule =
    schedules[
      getScheduleKey(
        year,
        month
      )
    ]

  if (!schedule) {
    document
      .querySelector('#scheduleTableArea')
      .innerHTML = `
        <p style="margin-top:25px;">
          Bu ay üçün cədvəl yaradılmayıb.
        </p>
      `

    return
  }

  renderEmployeeSchedule(
    schedule
  )
}

/* =========================
   TABLE
========================= */

function renderEmployeeSchedule(
  schedule
) {
  const employees =
    getEmployees()

  const area =
    document.querySelector('#scheduleTableArea')

  const days =
    Array.from(
      {
        length:
          schedule.daysInMonth
      },
      (_, index) =>
        index + 1
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

    <div
      class="table-wrapper"
    >

      <table
        class="employee-schedule-table"
      >

        <thead>

          <tr>

            <th
              class="employee-name-column"
            >
              Əməkdaş
            </th>

            ${days.map(
              day => `
                <th>
                  ${String(day).padStart(2, '0')}.${String(schedule.month).padStart(2, '0')}
                </th>
              `
            ).join('')}

          </tr>

        </thead>

        <tbody>

          ${employees.map(
            employee => {

              const shifts =
                schedule
                  .employeeRows?.[
                    employee.id
                  ] || []

              return `
                <tr>

                  <td
                    class="employee-name-column"
                  >
                    <strong>
                      ${employee.name}
                      ${employee.surname}
                    </strong>
                  </td>

                  ${shifts.map(
                    shift => `
                      <td
                        class="${
                          shift === 'İstirahət'
                            ? 'rest-day'
                            : ''
                        }"
                      >
                        ${shift}
                      </td>
                    `
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

/* =========================
   STATISTICS
========================= */

function showStatisticsSection() {
  const employees =
    getEmployees()

  const schedules =
    getSchedules()

  const counts = {}

  employees.forEach(
    employee => {

      counts[
        employee.id
      ] = {
        work: 0,
        rest: 0,
        shifts: {}
      }

      SHIFTS.forEach(
        shift => {
          counts[
            employee.id
          ].shifts[
            shift
          ] = 0
        }
      )
    }
  )

  Object.values(
    schedules
  ).forEach(
    schedule => {

      employees.forEach(
        employee => {

          const shifts =
            schedule
              .employeeRows?.[
                employee.id
              ] || []

          shifts.forEach(
            shift => {

              if (
                shift ===
                'İstirahət'
              ) {
                counts[
                  employee.id
                ].rest++
              } else {

                counts[
                  employee.id
                ].work++

                if (
                  counts[
                    employee.id
                  ].shifts[
                    shift
                  ] !==
                  undefined
                ) {
                  counts[
                    employee.id
                  ].shifts[
                    shift
                  ]++
                }
              }
            }
          )
        }
      )
    }
  )

  const area =
    document.querySelector('#dashboardArea')

  area.innerHTML = `
    <h2>Statistika</h2>

    <p>
      Əməkdaşların iş günü və növbə statistikası.
    </p>

    <div class="table-wrapper">

      <table>

        <thead>

          <tr>

            <th>Əməkdaş</th>
            <th>İş günü</th>
            <th>İstirahət</th>

            ${SHIFTS.map(
              shift => `
                <th>
                  ${shift}
                </th>
              `
            ).join('')}

          </tr>

        </thead>

        <tbody>

          ${
            employees.length
              ? employees.map(
                  employee => `
                    <tr>

                      <td>
                        ${employee.name}
                        ${employee.surname}
                      </td>

                      <td>
                        <strong>
                          ${
                            counts[
                              employee.id
                            ].work
                          }
                        </strong>
                      </td>

                      <td>
                        ${
                          counts[
                            employee.id
                          ].rest
                        }
                      </td>

                      ${SHIFTS.map(
                        shift => `
                          <td>
                            ${
                              counts[
                                employee.id
                              ].shifts[
                                shift
                              ]
                            }
                          </td>
                        `
                      ).join('')}

                    </tr>
                  `
                ).join('')

              : `
                <tr>
                  <td colspan="11">
                    Əməkdaş yoxdur.
                  </td>
                </tr>
              `
          }

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
          id="operatorStatisticsBtn"
        >
          Statistika
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
    .querySelector('#operatorStatisticsBtn')
    .addEventListener(
      'click',
      showOperatorStatistics
    )

  document
    .querySelector('#logoutBtn')
    .addEventListener(
      'click',
      logout
    )
}

function showOperatorSchedule() {
  const schedules =
    getSchedules()

  const keys =
    Object.keys(
      schedules
    )
      .sort()
      .reverse()

  const area =
    document.querySelector('#operatorArea')

  if (!keys.length) {
    area.innerHTML = `
      <h2>Növbə cədvəli</h2>
      <p>Hələ cədvəl yaradılmayıb.</p>
    `
    return
  }

  const schedule =
    schedules[keys[0]]

  const employees =
    getEmployees()

  const days =
    Array.from(
      {
        length:
          schedule.daysInMonth
      },
      (_, index) =>
        index + 1
    )

  area.innerHTML = `
    <h2>Növbə cədvəli</h2>

    <p>
      Bu bölmə yalnız baxış üçündür.
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
                  ${String(day).padStart(2, '0')}.${String(schedule.month).padStart(2, '0')}
                </th>
              `
            ).join('')}

          </tr>

        </thead>

        <tbody>

          ${employees.map(
            employee => {

              const shifts =
                schedule
                  .employeeRows?.[
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

                  ${shifts.map(
                    shift => `
                      <td
                        class="${
                          shift === 'İstirahət'
                            ? 'rest-day'
                            : ''
                        }"
                      >
                        ${shift}
                      </td>
                    `
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

const hasRecoveryCode =
  urlParams.has('code')

supabase.auth.onAuthStateChange(
  (event, session) => {

    if (
      event ===
      'PASSWORD_RECOVERY'
    ) {
      showResetPassword()
    }
  }
)

if (!hasRecoveryCode) {

  if (
    currentUser?.role ===
    'admin'
  ) {
    showAdminDashboard()
  }

  else if (
    currentUser?.role ===
    'operator'
  ) {
    showOperatorDashboard(
      currentUser
    )
  }

  else {
    showLogin()
  }
}