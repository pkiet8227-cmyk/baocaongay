// ============================================================
// MANAGER.JS
// QUẢN LÝ BÁO CÁO NGÀY
// FULL CODE
// EXCEL ĐẸP + TÔ MÀU + CĂN CHỈNH
// BỎ CỘT STT KHI XUẤT EXCEL
// ============================================================

(() => {
  "use strict";

  // ==========================================================
  // SUPABASE
  // ==========================================================

  const SUPABASE_URL_VALUE =
    typeof SUPABASE_URL !== "undefined"
      ? SUPABASE_URL
      : window.SUPABASE_URL;

  const SUPABASE_KEY_VALUE =
    typeof SUPABASE_ANON_KEY !== "undefined"
      ? SUPABASE_ANON_KEY
      : window.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL_VALUE || !SUPABASE_KEY_VALUE) {
    alert("❌ Chưa cấu hình Supabase trong config.js.");
    return;
  }

  if (
    typeof supabase === "undefined" ||
    typeof supabase.createClient !== "function"
  ) {
    alert("❌ Chưa tải được thư viện Supabase.");
    return;
  }

  const db = supabase.createClient(
    SUPABASE_URL_VALUE,
    SUPABASE_KEY_VALUE
  );

  // ==========================================================
  // BIẾN
  // ==========================================================

  let allData = [];
  let filteredData = [];
  let currentPage = 1;

  const PAGE_SIZE = 20;

  // ==========================================================
  // DOM
  // ==========================================================

  const loginBox =
    document.getElementById("loginBox");

  const managerBox =
    document.getElementById("managerBox");

  const emailInput =
    document.getElementById("loginId");

  const passwordInput =
    document.getElementById("password");

  const loginBtn =
    document.getElementById("loginBtn");

  const logoutBtn =
    document.getElementById("logoutBtn");

  const loginMessage =
    document.getElementById("loginMessage");

  const managerMessage =
    document.getElementById("managerMessage");

  const totalReports =
    document.getElementById("totalReports");

  const totalAmount =
    document.getElementById("totalAmount");

  const filterUser =
    document.getElementById("filterUser");

  const filterDate =
    document.getElementById("filterDate");

  const filterBtn =
    document.getElementById("filterBtn");

  const refreshBtn =
    document.getElementById("refreshBtn");

  const exportBtn =
    document.getElementById("exportBtn");

  const tableBody =
    document.getElementById("tableBody");

  const pagination =
    document.getElementById("pagination");

  const menuBtn =
    document.getElementById("menuBtn");

  const sideMenu =
    document.getElementById("sideMenu");

  const sideMenuOverlay =
    document.getElementById("sideMenuOverlay");

  const sideMenuClose =
    document.getElementById("sideMenuClose");

  const menuReportsBtn =
    document.getElementById("menuReportsBtn");

  const menuLogoutBtn =
    document.getElementById("menuLogoutBtn");

  const showSubmittedUsersBtn =
    document.getElementById("showSubmittedUsersBtn");

  const submittedUserCount =
    document.getElementById("submittedUserCount");

  // ==========================================================
  // KHỞI ĐỘNG
  // ==========================================================

  document.addEventListener(
    "DOMContentLoaded",
    async () => {

      // ------------------------------------------------------
      // LOGIN
      // ------------------------------------------------------

      loginBtn?.addEventListener(
        "click",
        login
      );

      passwordInput?.addEventListener(
        "keydown",
        (e) => {

          if (e.key === "Enter") {
            login();
          }

        }
      );

      emailInput?.addEventListener(
        "keydown",
        (e) => {

          if (e.key === "Enter") {
            login();
          }

        }
      );

      // ------------------------------------------------------
      // LOGOUT
      // ------------------------------------------------------

      logoutBtn?.addEventListener(
        "click",
        logout
      );

      menuLogoutBtn?.addEventListener(
        "click",
        logout
      );

      // ------------------------------------------------------
      // FILTER
      // ------------------------------------------------------

      filterBtn?.addEventListener(
        "click",
        () => {

          currentPage = 1;

          applyFilter();

        }
      );

      filterDate?.addEventListener(
        "change",
        () => {

          currentPage = 1;

          applyFilter();

        }
      );

      filterUser?.addEventListener(
        "keydown",
        (e) => {

          if (e.key === "Enter") {

            currentPage = 1;

            applyFilter();

          }

        }
      );

      // ------------------------------------------------------
      // REFRESH
      // ------------------------------------------------------

      refreshBtn?.addEventListener(
        "click",
        async () => {

          currentPage = 1;

          await loadData();

        }
      );

      // ------------------------------------------------------
      // EXCEL
      // ------------------------------------------------------

      exportBtn?.addEventListener(
        "click",
        exportExcel
      );

      // ------------------------------------------------------
      // MENU
      // ------------------------------------------------------

      menuBtn?.addEventListener(
        "click",
        openMenu
      );

      sideMenuClose?.addEventListener(
        "click",
        closeMenu
      );

      sideMenuOverlay?.addEventListener(
        "click",
        closeMenu
      );

      menuReportsBtn?.addEventListener(
        "click",
        () => {

          closeMenu();

          if (managerBox) {

            managerBox.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });

          }

        }
      );

      // ------------------------------------------------------
      // CÁN BỘ ĐÃ NHẬP
      // ------------------------------------------------------

      showSubmittedUsersBtn?.addEventListener(
        "click",
        showSubmittedUsers
      );

      // ------------------------------------------------------
      // HIỆN MENU
      // ------------------------------------------------------

      if (menuBtn) {
        menuBtn.style.display = "block";
      }

      // ------------------------------------------------------
      // KIỂM TRA SESSION
      // ------------------------------------------------------

      await checkSession();

    }
  );

  // ==========================================================
  // KIỂM TRA SESSION
  // ==========================================================

  async function checkSession() {

    try {

      const {
        data,
        error
      } = await db.auth.getSession();

      if (error) {

        console.error(
          "Session error:",
          error
        );

        showLogin();

        return;
      }

      if (data?.session) {

        showManager();

        await loadData();

      } else {

        showLogin();

      }

    } catch (error) {

      console.error(
        "checkSession:",
        error
      );

      showLogin();

    }

  }

  // ==========================================================
  // HIỆN LOGIN
  // ==========================================================

  function showLogin() {

    if (loginBox) {
      loginBox.style.display = "block";
    }

    if (managerBox) {
      managerBox.style.display = "none";
    }

  }

  // ==========================================================
  // HIỆN MANAGER
  // ==========================================================

  function showManager() {

    if (loginBox) {
      loginBox.style.display = "none";
    }

    if (managerBox) {
      managerBox.style.display = "block";
    }

    if (loginMessage) {
      loginMessage.textContent = "";
    }

  }

  // ==========================================================
  // ĐĂNG NHẬP
  // ==========================================================

  async function login() {

    const email =
      emailInput?.value?.trim() || "";

    const password =
      passwordInput?.value || "";

    if (!email || !password) {

      if (loginMessage) {

        loginMessage.textContent =
          "❌ Vui lòng nhập Gmail và mật khẩu.";

      }

      return;
    }

    if (loginBtn) {

      loginBtn.disabled = true;

      loginBtn.textContent =
        "⏳ ĐANG ĐĂNG NHẬP...";

    }

    if (loginMessage) {

      loginMessage.textContent =
        "⏳ Đang kiểm tra tài khoản...";

    }

    try {

      const {
        data,
        error
      } = await db.auth.signInWithPassword({

        email: email,

        password: password

      });

      if (error) {

        console.error(
          "Supabase login error:",
          error
        );

        if (loginMessage) {

          loginMessage.textContent =
            "❌ Đăng nhập thất bại: " +
            error.message;

        }

        return;
      }

      if (!data?.session) {

        if (loginMessage) {

          loginMessage.textContent =
            "❌ Không tạo được phiên đăng nhập.";

        }

        return;
      }

      showManager();

      currentPage = 1;

      await loadData();

    } catch (error) {

      console.error(
        "Login error:",
        error
      );

      if (loginMessage) {

        loginMessage.textContent =
          "❌ Lỗi hệ thống khi đăng nhập.";

      }

    } finally {

      if (loginBtn) {

        loginBtn.disabled = false;

        loginBtn.textContent =
          "🔐 ĐĂNG NHẬP";

      }

    }

  }

  // ==========================================================
  // ĐĂNG XUẤT
  // ==========================================================

  async function logout() {

    try {

      await db.auth.signOut();

      allData = [];

      filteredData = [];

      currentPage = 1;

      if (tableBody) {
        tableBody.innerHTML = "";
      }

      if (pagination) {
        pagination.innerHTML = "";
      }

      if (totalReports) {
        totalReports.textContent = "0";
      }

      if (totalAmount) {
        totalAmount.textContent = "0 đ";
      }

      if (submittedUserCount) {
        submittedUserCount.textContent = "0";
      }

      closeMenu();

      showLogin();

    } catch (error) {

      console.error(
        "Logout:",
        error
      );

    }

  }

  // ==========================================================
  // TẢI DỮ LIỆU
  // ==========================================================

  async function loadData() {

    if (managerMessage) {

      managerMessage.textContent =
        "⏳ Đang tải dữ liệu...";

    }

    try {

      const {
        data,
        error
      } = await db
        .from("bao_cao_ngay")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false
          }
        );

      if (error) {

        console.error(
          "Load data error:",
          error
        );

        if (managerMessage) {

          managerMessage.textContent =
            "❌ Lỗi tải dữ liệu: " +
            error.message;

        }

        return;
      }

      allData =
        Array.isArray(data)
          ? data
          : [];

      currentPage = 1;

      applyFilter();

      if (managerMessage) {

        managerMessage.textContent =
          `✅ Đã tải ${allData.length} báo cáo.`;

      }

    } catch (error) {

      console.error(
        "loadData:",
        error
      );

      if (managerMessage) {

        managerMessage.textContent =
          "❌ Không thể tải dữ liệu.";

      }

    }

  }

  // ==========================================================
  // LỌC DỮ LIỆU
  // ==========================================================

  function applyFilter() {

    const userKeyword =
      (filterUser?.value || "")
        .trim()
        .toLowerCase();

    const dateKeyword =
      filterDate?.value || "";

    filteredData =
      allData.filter(
        (row) => {

          const userName =
            String(
              row.user_name || ""
            ).toLowerCase();

          const reportDate =
            String(
              row.field_date || ""
            ).substring(0, 10);

          const matchUser =
            !userKeyword ||
            userName.includes(
              userKeyword
            );

          const matchDate =
            !dateKeyword ||
            reportDate === dateKeyword;

          return (
            matchUser &&
            matchDate
          );

        }
      );

    updateSubmittedUserCount();

    render();

  }

  // ==========================================================
  // ĐẾM CÁN BỘ
  // ==========================================================

  function updateSubmittedUserCount() {

    const users =
      new Set();

    filteredData.forEach(
      (row) => {

        const name =
          String(
            row.user_name || ""
          ).trim();

        if (name) {
          users.add(name);
        }

      }
    );

    if (submittedUserCount) {

      submittedUserCount.textContent =
        users.size;

    }

  }

  // ==========================================================
  // RENDER TABLE
  // ==========================================================

  function render() {

    if (totalReports) {

      totalReports.textContent =
        filteredData.length;

    }

    const total =
      filteredData.reduce(
        (sum, row) => {

          return (
            sum +
            parseAmount(
              row.expected_amount
            )
          );

        },
        0
      );

    if (totalAmount) {

      totalAmount.textContent =
        total.toLocaleString(
          "vi-VN"
        ) +
        " đ";

    }

    if (!tableBody) {
      return;
    }

    tableBody.innerHTML = "";

    if (filteredData.length === 0) {

      tableBody.innerHTML = `
        <tr>
          <td
            colspan="10"
            style="
              text-align:center;
              padding:25px;
              font-weight:bold;
            "
          >
            Không tìm thấy dữ liệu.
          </td>
        </tr>
      `;

      if (pagination) {
        pagination.innerHTML = "";
      }

      return;
    }

    const totalPages =
      Math.ceil(
        filteredData.length /
        PAGE_SIZE
      );

    if (currentPage > totalPages) {
      currentPage = totalPages;
    }

    const start =
      (currentPage - 1) *
      PAGE_SIZE;

    const end =
      start + PAGE_SIZE;

    const pageItems =
      filteredData.slice(
        start,
        end
      );

    pageItems.forEach(
      (row) => {

        const tr =
          document.createElement(
            "tr"
          );

        tr.innerHTML = `
          <td>
            ${escapeHtml(
              row.user_name
            )}
          </td>

          <td>
            ${escapeHtml(
              formatDate(
                row.field_date
              )
            )}
          </td>

          <td>
            ${escapeHtml(
              row.cif
            )}
          </td>

          <td>
            ${escapeHtml(
              row.customer_name
            )}
          </td>

          <td>
            ${escapeHtml(
              row.result
            )}
          </td>

          <td>
            ${escapeHtml(
              row.connection
            )}
          </td>

          <td
            style="
              white-space:normal;
              min-width:220px;
            "
          >
            ${escapeHtml(
              row.detail
            )}
          </td>

          <td>
            ${parseAmount(
              row.expected_amount
            ).toLocaleString(
              "vi-VN"
            )}
            đ
          </td>

          <td
            style="
              white-space:normal;
              min-width:220px;
            "
          >
            ${escapeHtml(
              row.next_action
            )}
          </td>

          <td>

            <button
              class="edit-btn"
              type="button"
              data-action="edit"
              data-id="${escapeAttr(
                row.id
              )}"
            >
              ✏️ Sửa
            </button>

            <button
              class="delete-btn"
              type="button"
              data-action="delete"
              data-id="${escapeAttr(
                row.id
              )}"
            >
              🗑️ Xóa
            </button>

          </td>
        `;

        tableBody.appendChild(
          tr
        );

      }
    );

    // --------------------------------------------------------
    // NÚT SỬA
    // --------------------------------------------------------

    tableBody
      .querySelectorAll(
        '[data-action="edit"]'
      )
      .forEach(
        (btn) => {

          btn.addEventListener(
            "click",
            () => {

              const id =
                btn.dataset.id;

              editReport(id);

            }
          );

        }
      );

    // --------------------------------------------------------
    // NÚT XÓA
    // --------------------------------------------------------

    tableBody
      .querySelectorAll(
        '[data-action="delete"]'
      )
      .forEach(
        (btn) => {

          btn.addEventListener(
            "click",
            () => {

              const id =
                btn.dataset.id;

              deleteReport(id);

            }
          );

        }
      );

    renderPagination();

  }

  // ==========================================================
  // PHÂN TRANG
  // ==========================================================

  function renderPagination() {

    if (!pagination) {
      return;
    }

    pagination.innerHTML = "";

    const totalPages =
      Math.ceil(
        filteredData.length /
        PAGE_SIZE
      );

    if (totalPages <= 1) {

      if (filteredData.length > 0) {

        const page =
          document.createElement(
            "button"
          );

        page.textContent = "1";

        page.classList.add(
          "active"
        );

        page.disabled = true;

        pagination.appendChild(
          page
        );

      }

      return;
    }

    // --------------------------------------------------------
    // NÚT TRƯỚC
    // --------------------------------------------------------

    const prev =
      document.createElement(
        "button"
      );

    prev.textContent = "‹";

    prev.disabled =
      currentPage === 1;

    prev.addEventListener(
      "click",
      () => {

        if (currentPage > 1) {

          currentPage--;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }

      }
    );

    pagination.appendChild(
      prev
    );

    // --------------------------------------------------------
    // TRANG
    // --------------------------------------------------------

    let startPage =
      Math.max(
        1,
        currentPage - 2
      );

    let endPage =
      Math.min(
        totalPages,
        currentPage + 2
      );

    if (currentPage <= 3) {

      startPage = 1;

      endPage =
        Math.min(
          totalPages,
          5
        );

    }

    if (
      currentPage >=
      totalPages - 2
    ) {

      startPage =
        Math.max(
          1,
          totalPages - 4
        );

      endPage = totalPages;

    }

    if (startPage > 1) {

      addPageButton(1);

      if (startPage > 2) {
        addDots();
      }

    }

    for (
      let i = startPage;
      i <= endPage;
      i++
    ) {

      addPageButton(i);

    }

    if (endPage < totalPages) {

      if (
        endPage <
        totalPages - 1
      ) {

        addDots();

      }

      addPageButton(
        totalPages
      );

    }

    // --------------------------------------------------------
    // NÚT SAU
    // --------------------------------------------------------

    const next =
      document.createElement(
        "button"
      );

    next.textContent = "›";

    next.disabled =
      currentPage === totalPages;

    next.addEventListener(
      "click",
      () => {

        if (
          currentPage <
          totalPages
        ) {

          currentPage++;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }

      }
    );

    pagination.appendChild(
      next
    );

    // --------------------------------------------------------
    // HÀM TẠO NÚT TRANG
    // --------------------------------------------------------

    function addPageButton(page) {

      const btn =
        document.createElement(
          "button"
        );

      btn.textContent = page;

      if (
        page ===
        currentPage
      ) {

        btn.classList.add(
          "active"
        );

      }

      btn.addEventListener(
        "click",
        () => {

          currentPage = page;

          render();

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );

      pagination.appendChild(
        btn
      );

    }

    // --------------------------------------------------------
    // DẤU ...
    // --------------------------------------------------------

    function addDots() {

      const dots =
        document.createElement(
          "span"
        );

      dots.textContent = "...";

      dots.style.padding =
        "0 5px";

      pagination.appendChild(
        dots
      );

    }

  }

  // ==========================================================
  // SỬA BÁO CÁO
  // ==========================================================

  async function editReport(id) {

    const row =
      allData.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!row) {

      alert(
        "❌ Không tìm thấy báo cáo."
      );

      return;
    }

    createEditModal(row);

  }

  // ==========================================================
  // TẠO MODAL SỬA
  // ==========================================================

  function createEditModal(row) {

    removeEditModal();

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "editReportModal";

    overlay.style.cssText = `
      position:fixed;
      inset:0;
      background:rgba(0,0,0,.6);
      z-index:100000;
      display:flex;
      justify-content:center;
      align-items:center;
      padding:15px;
    `;

    const modal =
      document.createElement(
        "div"
      );

    modal.style.cssText = `
      width:100%;
      max-width:600px;
      max-height:90vh;
      overflow-y:auto;
      background:white;
      border-radius:18px;
      padding:20px;
      box-shadow:0 20px 60px rgba(0,0,0,.35);
    `;

    modal.innerHTML = `
      <h2
        style="
          margin-top:0;
          margin-bottom:18px;
        "
      >
        ✏️ SỬA BÁO CÁO
      </h2>

      <div
        style="
          display:grid;
          gap:12px;
        "
      >

        <label>
          <b>Cán bộ</b>

          <input
            id="editUserName"
            type="text"
            value="${escapeAttr(
              row.user_name
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>Ngày field</b>

          <input
            id="editFieldDate"
            type="date"
            value="${escapeAttr(
              formatDateForInput(
                row.field_date
              )
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>Số CIF</b>

          <input
            id="editCif"
            type="text"
            value="${escapeAttr(
              row.cif
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>Tên khách hàng</b>

          <input
            id="editCustomerName"
            type="text"
            value="${escapeAttr(
              row.customer_name
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>Kết quả</b>

          <select
            id="editResult"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
            <option value="Sống">
              Sống
            </option>

            <option value="Chết">
              Chết
            </option>
          </select>
        </label>

        <label>
          <b>Kết nối</b>

          <input
            id="editConnection"
            type="text"
            value="${escapeAttr(
              row.connection
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>Kết quả chi tiết</b>

          <textarea
            id="editDetail"
            rows="4"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >${escapeHtml(
            row.detail
          )}</textarea>
        </label>

        <label>
          <b>Dự thu</b>

          <input
            id="editExpectedAmount"
            type="number"
            value="${escapeAttr(
              parseAmount(
                row.expected_amount
              )
            )}"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >
        </label>

        <label>
          <b>
            Hướng tác động tiếp theo
          </b>

          <textarea
            id="editNextAction"
            rows="4"
            style="
              width:100%;
              box-sizing:border-box;
              padding:11px;
              margin-top:5px;
            "
          >${escapeHtml(
            row.next_action
          )}</textarea>
        </label>

      </div>

      <div
        style="
          display:flex;
          gap:10px;
          margin-top:20px;
        "
      >

        <button
          id="cancelEditBtn"
          type="button"
          style="
            flex:1;
            padding:13px;
            border:0;
            border-radius:10px;
            background:#64748b;
            color:white;
            font-weight:800;
          "
        >
          HỦY
        </button>

        <button
          id="saveEditBtn"
          type="button"
          style="
            flex:1;
            padding:13px;
            border:0;
            border-radius:10px;
            background:#2563eb;
            color:white;
            font-weight:800;
          "
        >
          💾 LƯU THAY ĐỔI
        </button>

      </div>

      <div
        id="editMessage"
        style="
          text-align:center;
          margin-top:12px;
          font-weight:bold;
        "
      ></div>
    `;

    overlay.appendChild(
      modal
    );

    document.body.appendChild(
      overlay
    );

    const resultSelect =
      document.getElementById(
        "editResult"
      );

    if (resultSelect) {

      resultSelect.value =
        row.result || "Sống";

    }

    document
      .getElementById(
        "cancelEditBtn"
      )
      ?.addEventListener(
        "click",
        removeEditModal
      );

    document
      .getElementById(
        "saveEditBtn"
      )
      ?.addEventListener(
        "click",
        () =>
          saveEditReport(
            row.id
          )
      );

    overlay.addEventListener(
      "click",
      (e) => {

        if (
          e.target === overlay
        ) {

          removeEditModal();

        }

      }
    );

  }

  // ==========================================================
  // LƯU SỬA
  // ==========================================================

  async function saveEditReport(id) {

    const saveBtn =
      document.getElementById(
        "saveEditBtn"
      );

    const editMessage =
      document.getElementById(
        "editMessage"
      );

    const user_name =
      document.getElementById(
        "editUserName"
      )?.value.trim() || "";

    const field_date =
      document.getElementById(
        "editFieldDate"
      )?.value || null;

    const cif =
      document.getElementById(
        "editCif"
      )?.value.trim() || "";

    const customer_name =
      document.getElementById(
        "editCustomerName"
      )?.value.trim() || "";

    const result =
      document.getElementById(
        "editResult"
      )?.value || "";

    const connection =
      document.getElementById(
        "editConnection"
      )?.value.trim() || "";

    const detail =
      document.getElementById(
        "editDetail"
      )?.value.trim() || "";

    const expected_amount =
      parseAmount(
        document.getElementById(
          "editExpectedAmount"
        )?.value
      );

    const next_action =
      document.getElementById(
        "editNextAction"
      )?.value.trim() || "";

    // --------------------------------------------------------
    // VALIDATE
    // --------------------------------------------------------

    if (!user_name) {

      if (editMessage) {

        editMessage.textContent =
          "❌ Vui lòng nhập tên cán bộ.";

      }

      return;
    }

    if (!cif) {

      if (editMessage) {

        editMessage.textContent =
          "❌ Vui lòng nhập số CIF.";

      }

      return;
    }

    if (saveBtn) {

      saveBtn.disabled = true;

      saveBtn.textContent =
        "⏳ ĐANG LƯU...";

    }

    if (editMessage) {

      editMessage.textContent =
        "⏳ Đang cập nhật...";

    }

    try {

      const {
        error
      } = await db
        .from("bao_cao_ngay")
        .update({

          user_name,

          field_date,

          cif,

          customer_name,

          result,

          connection,

          detail,

          expected_amount,

          next_action

        })
        .eq(
          "id",
          id
        );

      if (error) {

        console.error(
          "Update error:",
          error
        );

        if (editMessage) {

          editMessage.textContent =
            "❌ Lỗi cập nhật: " +
            error.message;

        }

        return;
      }

      removeEditModal();

      await loadData();

      if (managerMessage) {

        managerMessage.textContent =
          "✅ Đã sửa báo cáo thành công.";

      }

    } catch (error) {

      console.error(
        "saveEditReport:",
        error
      );

      if (editMessage) {

        editMessage.textContent =
          "❌ Không thể cập nhật báo cáo.";

      }

    } finally {

      if (saveBtn) {

        saveBtn.disabled = false;

        saveBtn.textContent =
          "💾 LƯU THAY ĐỔI";

      }

    }

  }

  // ==========================================================
  // XÓA BÁO CÁO
  // ==========================================================

  async function deleteReport(id) {

    const row =
      allData.find(
        (item) =>
          String(item.id) ===
          String(id)
      );

    if (!row) {

      alert(
        "❌ Không tìm thấy báo cáo."
      );

      return;
    }

    const customer =
      row.customer_name ||
      row.cif ||
      "báo cáo này";

    const confirmed =
      confirm(
        `⚠️ Bạn có chắc muốn xóa báo cáo của "${customer}"?\n\nHành động này không thể hoàn tác.`
      );

    if (!confirmed) {
      return;
    }

    if (managerMessage) {

      managerMessage.textContent =
        "⏳ Đang xóa báo cáo...";

    }

    try {

      const {
        error
      } = await db
        .from("bao_cao_ngay")
        .delete()
        .eq(
          "id",
          id
        );

      if (error) {

        console.error(
          "Delete error:",
          error
        );

        if (managerMessage) {

          managerMessage.textContent =
            "❌ Không thể xóa: " +
            error.message;

        }

        return;
      }

      await loadData();

      if (managerMessage) {

        managerMessage.textContent =
          "✅ Đã xóa báo cáo thành công.";

      }

    } catch (error) {

      console.error(
        "deleteReport:",
        error
      );

      if (managerMessage) {

        managerMessage.textContent =
          "❌ Lỗi khi xóa báo cáo.";

      }

    }

  }

  // ==========================================================
  // CÁN BỘ ĐÃ NHẬP BÁO CÁO
  // ==========================================================

  function showSubmittedUsers() {

    removeSubmittedUserModal();

    const usersMap =
      new Map();

    filteredData.forEach(
      (row) => {

        const name =
          String(
            row.user_name || ""
          ).trim();

        if (!name) {
          return;
        }

        if (!usersMap.has(name)) {

          usersMap.set(
            name,
            0
          );

        }

        usersMap.set(
          name,
          usersMap.get(name) + 1
        );

      }
    );

    const users =
      Array.from(
        usersMap.entries()
      ).sort(
        (a, b) =>
          a[0].localeCompare(
            b[0],
            "vi"
          )
      );

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "submittedUserModal";

    overlay.className =
      "user-modal-overlay";

    const modal =
      document.createElement(
        "div"
      );

    modal.className =
      "user-modal";

    modal.innerHTML = `
      <div
        class="user-modal-header"
      >

        <h2>

          👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO

          <br>

          <span
            style="
              color:#2563eb;
              font-size:16px;
            "
          >
            ${users.length} cán bộ
          </span>

        </h2>

        <button
          class="user-modal-close"
          id="closeSubmittedUsers"
          type="button"
        >
          ×
        </button>

      </div>

      <div
        class="user-modal-body"
      >

        ${
          users.length === 0

            ? `

              <div
                style="
                  text-align:center;
                  padding:30px 10px;
                  color:#64748b;
                  font-weight:bold;
                "
              >
                Chưa có cán bộ nào nhập báo cáo.
              </div>

            `

            : users
                .map(
                  (
                    [name, count],
                    index
                  ) => `

                    <div
                      class="submitted-user-item"
                      data-user="${escapeAttr(
                        name
                      )}"
                      style="
                        cursor:pointer;
                      "
                    >

                      <div
                        class="submitted-user-number"
                      >
                        ${index + 1}
                      </div>

                      <div
                        style="
                          flex:1;
                        "
                      >

                        <div>
                          ${escapeHtml(
                            name
                          )}
                        </div>

                        <div
                          style="
                            font-size:13px;
                            color:#64748b;
                            margin-top:3px;
                          "
                        >
                          ${count} báo cáo
                        </div>

                      </div>

                      <div
                        style="
                          font-size:20px;
                        "
                      >
                        ›
                      </div>

                    </div>

                  `
                )
                .join("")
        }

      </div>
    `;

    overlay.appendChild(
      modal
    );

    document.body.appendChild(
      overlay
    );

    document
      .getElementById(
        "closeSubmittedUsers"
      )
      ?.addEventListener(
        "click",
        removeSubmittedUserModal
      );

    overlay.addEventListener(
      "click",
      (e) => {

        if (
          e.target === overlay
        ) {

          removeSubmittedUserModal();

        }

      }
    );

    modal
      .querySelectorAll(
        ".submitted-user-item"
      )
      .forEach(
        (item) => {

          item.addEventListener(
            "click",
            () => {

              const user =
                item.dataset.user ||
                "";

              if (filterUser) {

                filterUser.value =
                  user;

              }

              currentPage = 1;

              applyFilter();

              removeSubmittedUserModal();

              if (tableBody) {

                tableBody.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
                });

              }

            }
          );

        }
      );

  }

  // ==========================================================
  // XÓA MODAL CÁN BỘ
  // ==========================================================

  function removeSubmittedUserModal() {

    document
      .getElementById(
        "submittedUserModal"
      )
      ?.remove();

  }

  // ==========================================================
  // MENU
  // ==========================================================

  function openMenu() {

    if (sideMenuOverlay) {

      sideMenuOverlay.classList.add(
        "open"
      );

    }

    if (sideMenu) {

      sideMenu.classList.add(
        "open"
      );

    }

  }

  function closeMenu() {

    if (sideMenuOverlay) {

      sideMenuOverlay.classList.remove(
        "open"
      );

    }

    if (sideMenu) {

      sideMenu.classList.remove(
        "open"
      );

    }

  }

  // ==========================================================
  // XUẤT EXCEL
  // BỎ STT - GIỮ NGUYÊN MÀU + CĂN CHỈNH
  // ==========================================================

  function exportExcel() {

    // --------------------------------------------------------
    // KIỂM TRA THƯ VIỆN
    // --------------------------------------------------------

    if (
      typeof XLSX ===
      "undefined"
    ) {

      alert(
        "❌ Chưa tải được thư viện Excel.\n\nHãy kiểm tra manager.html đang dùng xlsx-js-style."
      );

      return;
    }

    // --------------------------------------------------------
    // KIỂM TRA DỮ LIỆU
    // --------------------------------------------------------

    if (
      !filteredData ||
      filteredData.length === 0
    ) {

      alert(
        "⚠️ Không có dữ liệu để xuất Excel."
      );

      return;
    }

    // --------------------------------------------------------
    // TRẠNG THÁI NÚT
    // --------------------------------------------------------

    const originalText =
      exportBtn?.textContent ||
      "📥 XUẤT EXCEL";

    if (exportBtn) {

      exportBtn.disabled = true;

      exportBtn.textContent =
        "⏳ ĐANG TẠO EXCEL...";

    }

    try {

      // ======================================================
      // THÔNG TIN
      // ======================================================

      const exportDate =
        new Date();

      const exportDateText =
        formatDateTime(
          exportDate
        );

      const total =
        filteredData.reduce(
          (sum, row) => {

            return (
              sum +
              parseAmount(
                row.expected_amount
              )
            );

          },
          0
        );

      // ======================================================
      // SHEET 1
      // BÁO CÁO NGÀY
      // ======================================================

      const sheetData = [];

      // ------------------------------------------------------
      // TIÊU ĐỀ
      // ------------------------------------------------------

      sheetData.push([
        "BÁO CÁO NGÀY"
      ]);

      sheetData.push([
        "Ngày xuất:",
        exportDateText
      ]);

      // ------------------------------------------------------
      // BỘ LỌC
      // ------------------------------------------------------

      const userFilterText =
        filterUser?.value?.trim() ||
        "Tất cả cán bộ";

      const dateFilterText =
        filterDate?.value
          ? formatDate(
              filterDate.value
            )
          : "Tất cả ngày";

      sheetData.push([
        "Bộ lọc cán bộ:",
        userFilterText
      ]);

      sheetData.push([
        "Bộ lọc ngày:",
        dateFilterText
      ]);

      sheetData.push([
        "Tổng số báo cáo:",
        filteredData.length
      ]);

      sheetData.push([
        "Tổng dự thu:",
        total
      ]);

      // ------------------------------------------------------
      // DÒNG TRỐNG
      // ------------------------------------------------------

      sheetData.push([]);

      // ======================================================
      // HEADER
      // KHÔNG CÒN STT
      // ======================================================

      sheetData.push([

        "Cán bộ",

        "Ngày field",

        "Số CIF",

        "Tên khách hàng",

        "Kết quả",

        "Kết nối",

        "Kết quả chi tiết",

        "Dự thu",

        "Hướng tác động tiếp theo"

      ]);

      // ======================================================
      // DỮ LIỆU
      // ======================================================

      filteredData.forEach(
        (row) => {

          sheetData.push([

            row.user_name || "",

            toExcelDate(
              row.field_date
            ),

            row.cif || "",

            row.customer_name || "",

            row.result || "",

            row.connection || "",

            row.detail || "",

            parseAmount(
              row.expected_amount
            ),

            row.next_action || ""

          ]);

        }
      );

      // ======================================================
      // DÒNG TỔNG
      // ======================================================

      const totalRowIndex =
        sheetData.length;

      sheetData.push([

        "",

        "",

        "",

        "",

        "",

        "",

        "TỔNG DỰ THU",

        total,

        ""

      ]);

      // ======================================================
      // TẠO WORKSHEET
      // ======================================================

      const ws =
        XLSX.utils.aoa_to_sheet(
          sheetData
        );

      // ======================================================
      // MERGE TIÊU ĐỀ
      // 9 CỘT: A -> I
      // ======================================================

      ws["!merges"] = [

        {
          s: {
            r: 0,
            c: 0
          },

          e: {
            r: 0,
            c: 8
          }
        }

      ];

      // ======================================================
      // ĐỘ RỘNG CỘT
      // ======================================================

      ws["!cols"] = [

        {
          wch: 20
        },

        {
          wch: 15
        },

        {
          wch: 16
        },

        {
          wch: 28
        },

        {
          wch: 15
        },

        {
          wch: 25
        },

        {
          wch: 50
        },

        {
          wch: 20
        },

        {
          wch: 50
        }

      ];

      // ======================================================
      // STYLE TIÊU ĐỀ CHÍNH
      // ======================================================

      const titleStyle = {

        font: {

          bold: true,

          sz: 18,

          color: {
            rgb: "FFFFFF"
          }

        },

        fill: {

          patternType: "solid",

          fgColor: {
            rgb: "1F4E78"
          }

        },

        alignment: {

          horizontal: "center",

          vertical: "center"

        },

        border: {

          top: {
            style: "thin",
            color: {
              rgb: "FFFFFF"
            }
          },

          bottom: {
            style: "thin",
            color: {
              rgb: "FFFFFF"
            }
          },

          left: {
            style: "thin",
            color: {
              rgb: "FFFFFF"
            }
          },

          right: {
            style: "thin",
            color: {
              rgb: "FFFFFF"
            }
          }

        }

      };

      // ======================================================
      // STYLE NHÃN THÔNG TIN
      // ======================================================

      const infoLabelStyle = {

        font: {

          bold: true,

          color: {
            rgb: "1F1F1F"
          }

        },

        alignment: {

          vertical: "center"

        }

      };

      // ======================================================
      // STYLE HEADER BẢNG
      // ======================================================

      const headerStyle = {

        font: {

          bold: true,

          sz: 11,

          color: {
            rgb: "FFFFFF"
          }

        },

        fill: {

          patternType: "solid",

          fgColor: {
            rgb: "1F4E78"
          }

        },

        alignment: {

          horizontal: "center",

          vertical: "center",

          wrapText: true

        },

        border: {

          top: {

            style: "thin",

            color: {
              rgb: "FFFFFF"
            }

          },

          bottom: {

            style: "thin",

            color: {
              rgb: "FFFFFF"
            }

          },

          left: {

            style: "thin",

            color: {
              rgb: "FFFFFF"
            }

          },

          right: {

            style: "thin",

            color: {
              rgb: "FFFFFF"
            }

          }

        }

      };

      // ======================================================
      // STYLE DÒNG TỔNG
      // ======================================================

      const totalStyle = {

        font: {

          bold: true,

          color: {
            rgb: "1F1F1F"
          }

        },

        fill: {

          patternType: "solid",

          fgColor: {
            rgb: "D9EAF7"
          }

        },

        alignment: {

          vertical: "center"

        },

        border: {

          top: {

            style: "thin",

            color: {
              rgb: "7F7F7F"
            }

          },

          bottom: {

            style: "thin",

            color: {
              rgb: "7F7F7F"
            }

          },

          left: {

            style: "thin",

            color: {
              rgb: "7F7F7F"
            }

          },

          right: {

            style: "thin",

            color: {
              rgb: "7F7F7F"
            }

          }

        }

      };

      // ======================================================
      // STYLE TITLE
      // ======================================================

      if (ws["A1"]) {

        ws["A1"].s =
          titleStyle;

      }

      // ======================================================
      // CHIỀU CAO TITLE
      // ======================================================

      ws["!rows"] = [];

      ws["!rows"][0] = {
        hpt: 30
      };

      // ======================================================
      // STYLE INFO
      // ======================================================

      const infoRows = [
        1,
        2,
        3,
        4,
        5
      ];

      infoRows.forEach(
        (rowIndex) => {

          const cell =
            ws[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: 0
              })
            ];

          if (cell) {

            cell.s =
              infoLabelStyle;

          }

        }
      );

      // ======================================================
      // HEADER BẢNG
      // r = 7
      // Excel row = 8
      // 9 CỘT: A -> I
      // ======================================================

      for (
        let col = 0;
        col < 9;
        col++
      ) {

        const cell =
          ws[
            XLSX.utils.encode_cell({
              r: 7,
              c: col
            })
          ];

        if (cell) {

          cell.s =
            headerStyle;

        }

      }

      // ------------------------------------------------------
      // CHIỀU CAO HEADER
      // ------------------------------------------------------

      ws["!rows"][7] = {
        hpt: 32
      };

      // ======================================================
      // STYLE DATA
      // ======================================================

      const firstDataRow = 8;

      const lastDataRow =
        firstDataRow +
        filteredData.length -
        1;

      for (
        let rowIndex =
          firstDataRow;
        rowIndex <= lastDataRow;
        rowIndex++
      ) {

        for (
          let col = 0;
          col < 9;
          col++
        ) {

          const cell =
            ws[
              XLSX.utils.encode_cell({
                r: rowIndex,
                c: col
              })
            ];

          if (!cell) {
            continue;
          }

          cell.s = {

            alignment: {

              vertical: "top",

              wrapText:
                col === 6 ||
                col === 8

            },

            border: {

              top: {
                style: "thin",
                color: {
                  rgb: "D9D9D9"
                }
              },

              bottom: {
                style: "thin",
                color: {
                  rgb: "D9D9D9"
                }
              },

              left: {
                style: "thin",
                color: {
                  rgb: "D9D9D9"
                }
              },

              right: {
                style: "thin",
                color: {
                  rgb: "D9D9D9"
                }
              }

            }

          };

          // --------------------------------------------------
          // NGÀY FIELD
          // --------------------------------------------------

          if (col === 1) {

            cell.z =
              "dd/mm/yyyy";

            cell.s.alignment = {

              horizontal:
                "center",

              vertical:
                "center"

            };

          }

          // --------------------------------------------------
          // DỰ THU
          // --------------------------------------------------

          if (col === 7) {

            cell.z =
              '#,##0" đ"';

            cell.s.alignment = {

              horizontal:
                "right",

              vertical:
                "center"

            };

          }

        }

      }

      // ======================================================
      // STYLE TOTAL
      // ======================================================

      for (
        let col = 0;
        col < 9;
        col++
      ) {

        const cell =
          ws[
            XLSX.utils.encode_cell({
              r: totalRowIndex,
              c: col
            })
          ];

        if (cell) {

          cell.s =
            totalStyle;

        }

      }

      // ------------------------------------------------------
      // Ô TỔNG TIỀN
      // ------------------------------------------------------

      const totalAmountCell =
        ws[
          XLSX.utils.encode_cell({
            r: totalRowIndex,
            c: 7
          })
        ];

      if (totalAmountCell) {

        totalAmountCell.z =
          '#,##0" đ"';

        totalAmountCell.s.alignment = {

          horizontal:
            "right",

          vertical:
            "center"

        };

      }

      // ======================================================
      // FILTER
      // ======================================================

      ws["!autofilter"] = {

        ref:
          `A8:I${lastDataRow + 1}`

      };

      // ======================================================
      // FREEZE HEADER
      // ======================================================

      ws["!freeze"] = {

        xSplit: 0,

        ySplit: 8

      };

      // ======================================================
      // PAGE SETUP
      // ======================================================

      ws["!pageSetup"] = {

        orientation:
          "landscape",

        fitToWidth:
          1,

        fitToHeight:
          0

      };

      // ======================================================
      // SHEET 2
      // TỔNG QUAN
      // ======================================================

      const summaryData = [

        [
          "TỔNG QUAN BÁO CÁO NGÀY"
        ],

        [],

        [
          "Chỉ tiêu",
          "Giá trị"
        ],

        [
          "Tổng số báo cáo",
          filteredData.length
        ],

        [
          "Tổng dự thu",
          total
        ],

        [],

        [
          "Cán bộ",
          "Số báo cáo",
          "Tổng dự thu"
        ]

      ];

      // ======================================================
      // THỐNG KÊ CÁN BỘ
      // ======================================================

      const userStats =
        new Map();

      filteredData.forEach(
        (row) => {

          const user =
            String(
              row.user_name || ""
            ).trim() ||
            "Chưa nhập";

          const amount =
            parseAmount(
              row.expected_amount
            );

          if (!userStats.has(user)) {

            userStats.set(
              user,
              {
                count: 0,
                amount: 0
              }
            );

          }

          const item =
            userStats.get(
              user
            );

          item.count++;

          item.amount +=
            amount;

        }
      );

      const sortedUsers =
        Array.from(
          userStats.entries()
        ).sort(
          (a, b) =>
            a[0].localeCompare(
              b[0],
              "vi"
            )
        );

      sortedUsers.forEach(
        ([user, stats]) => {

          summaryData.push([

            user,

            stats.count,

            stats.amount

          ]);

        }
      );

      const wsSummary =
        XLSX.utils.aoa_to_sheet(
          summaryData
        );

      // ======================================================
      // MERGE TITLE
      // ======================================================

      wsSummary["!merges"] = [

        {
          s: {
            r: 0,
            c: 0
          },

          e: {
            r: 0,
            c: 2
          }
        }

      ];

      // ======================================================
      // WIDTH
      // ======================================================

      wsSummary["!cols"] = [

        {
          wch: 30
        },

        {
          wch: 18
        },

        {
          wch: 22
        }

      ];

      // ======================================================
      // STYLE SUMMARY TITLE
      // ======================================================

      if (wsSummary["A1"]) {

        wsSummary["A1"].s =
          titleStyle;

      }

      // ======================================================
      // SUMMARY HEADER 1
      // ======================================================

      for (
        let col = 0;
        col < 2;
        col++
      ) {

        const cell =
          wsSummary[
            XLSX.utils.encode_cell({
              r: 2,
              c: col
            })
          ];

        if (cell) {

          cell.s =
            headerStyle;

        }

      }

      // ======================================================
      // SUMMARY HEADER 2
      // ======================================================

      for (
        let col = 0;
        col < 3;
        col++
      ) {

        const cell =
          wsSummary[
            XLSX.utils.encode_cell({
              r: 6,
              c: col
            })
          ];

        if (cell) {

          cell.s =
            headerStyle;

        }

      }

      // ======================================================
      // FORMAT SUMMARY MONEY
      // ======================================================

      for (
        let rowIndex = 7;
        rowIndex <
        summaryData.length;
        rowIndex++
      ) {

        const cell =
          wsSummary[
            XLSX.utils.encode_cell({
              r: rowIndex,
              c: 2
            })
          ];

        if (cell) {

          cell.z =
            '#,##0" đ"';

        }

      }

      // ======================================================
      // TỔNG DỰ THU SUMMARY
      // ======================================================

      if (wsSummary["B5"]) {

        wsSummary["B5"].z =
          '#,##0" đ"';

      }

      // ======================================================
      // WORKBOOK
      // ======================================================

      const wb =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        wb,
        ws,
        "BaoCaoNgay"
      );

      XLSX.utils.book_append_sheet(
        wb,
        wsSummary,
        "TongQuan"
      );

      // ======================================================
      // TÊN FILE
      // ======================================================

      const now =
        new Date();

      const date =
        now.getFullYear() +
        "-" +
        String(
          now.getMonth() + 1
        ).padStart(
          2,
          "0"
        ) +
        "-" +
        String(
          now.getDate()
        ).padStart(
          2,
          "0"
        );

      const fileName =
        `Bao_Cao_Ngay_${date}.xlsx`;

      // ======================================================
      // GHI FILE
      // ======================================================

      XLSX.writeFile(
        wb,
        fileName
      );

      // ======================================================
      // THÔNG BÁO
      // ======================================================

      if (managerMessage) {

        managerMessage.textContent =
          `✅ Đã xuất ${filteredData.length} báo cáo ra Excel.`;

      }

    } catch (error) {

      console.error(
        "Export Excel error:",
        error
      );

      alert(
        "❌ Không thể xuất Excel.\n\n" +
        (
          error?.message ||
          "Lỗi không xác định."
        )
      );

    } finally {

      if (exportBtn) {

        exportBtn.disabled =
          false;

        exportBtn.textContent =
          originalText;

      }

    }

  }

  // ==========================================================
  // FORMAT DATE HIỂN THỊ
  // ==========================================================

  function formatDate(value) {

    if (!value) {
      return "";
    }

    const dateString =
      String(value)
        .substring(0, 10);

    const parts =
      dateString.split("-");

    if (
      parts.length === 3
    ) {

      const year =
        parts[0];

      const month =
        parts[1];

      const day =
        parts[2];

      if (
        year &&
        month &&
        day
      ) {

        return (
          `${day}/${month}/${year}`
        );

      }

    }

    return dateString;

  }

  // ==========================================================
  // FORMAT DATETIME
  // ==========================================================

  function formatDateTime(
    value
  ) {

    if (!value) {
      return "";
    }

    const date =
      value instanceof Date
        ? value
        : new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return "";

    }

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const year =
      date.getFullYear();

    const hours =
      String(
        date.getHours()
      ).padStart(
        2,
        "0"
      );

    const minutes =
      String(
        date.getMinutes()
      ).padStart(
        2,
        "0"
      );

    return (
      `${day}/${month}/${year} ${hours}:${minutes}`
    );

  }

  // ==========================================================
  // FORMAT DATE CHO INPUT DATE
  // ==========================================================

  function formatDateForInput(
    value
  ) {

    if (!value) {
      return "";
    }

    return String(value)
      .substring(
        0,
        10
      );

  }

  // ==========================================================
  // CHUYỂN NGÀY -> DATE CHO EXCEL
  // ==========================================================

  function toExcelDate(
    value
  ) {

    if (!value) {
      return null;
    }

    const dateString =
      String(value)
        .substring(
          0,
          10
        );

    const parts =
      dateString.split("-");

    if (
      parts.length !== 3
    ) {

      return null;

    }

    const year =
      Number(
        parts[0]
      );

    const month =
      Number(
        parts[1]
      );

    const day =
      Number(
        parts[2]
      );

    if (
      !year ||
      !month ||
      !day
    ) {

      return null;

    }

    return new Date(
      year,
      month - 1,
      day
    );

  }

  // ==========================================================
  // XỬ LÝ SỐ TIỀN
  // ==========================================================

  function parseAmount(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {

      return 0;

    }

    if (
      typeof value === "number"
    ) {

      return Number.isFinite(
        value
      )
        ? value
        : 0;

    }

    let text =
      String(value)
        .trim();

    if (!text) {
      return 0;
    }

    // Loại bỏ ký hiệu tiền
    text =
      text
        .replace(
          /đ/gi,
          ""
        )
        .trim();

    // Loại bỏ dấu phẩy, dấu chấm
    text =
      text
        .replace(
          /,/g,
          ""
        )
        .replace(
          /\./g,
          ""
        )
        .replace(
          /\s/g,
          ""
        );

    const number =
      Number(text);

    return Number.isFinite(
      number
    )
      ? number
      : 0;

  }

  // ==========================================================
  // ESCAPE HTML
  // ==========================================================

  function escapeHtml(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /'/g,
        "&#039;"
      );

  }

  // ==========================================================
  // ESCAPE ATTRIBUTE
  // ==========================================================

  function escapeAttr(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return "";

    }

    return String(value)

      .replace(
        /&/g,
        "&amp;"
      )

      .replace(
        /"/g,
        "&quot;"
      )

      .replace(
        /</g,
        "&lt;"
      )

      .replace(
        />/g,
        "&gt;"
      );

  }

  // ==========================================================
  // REMOVE EDIT MODAL
  // ==========================================================

  function removeEditModal() {

    document
      .getElementById(
        "editReportModal"
      )
      ?.remove();

  }

})();
