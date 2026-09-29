(() => {

  "use strict";

  // ============================================================

  // QUẢN LÝ BÁO CÁO NGÀY

  // FULL VERSION

  //

  // - Đăng nhập Supabase Auth

  // - Lọc cán bộ / ngày

  // - Làm mới dữ liệu

  // - Sửa báo cáo bằng POPUP

  // - Xóa từng báo cáo

  // - Xóa toàn bộ dữ liệu

  // - Danh sách cán bộ đã nhập

  // - Phân trang 20 dòng

  // - Xuất Excel

  // - Sửa lỗi xác nhận "XOA TAT CA"

  // ============================================================

  // ============================================================

  // KẾT NỐI SUPABASE

  // ============================================================

  let db = null;

  try {

    if (

      !window.supabase ||

      typeof window.supabase.createClient !== "function"

    ) {

      throw new Error(

        "Không tìm thấy thư viện Supabase."

      );

    }

    if (

      typeof SUPABASE_URL === "undefined" ||

      typeof SUPABASE_ANON_KEY === "undefined"

    ) {

      throw new Error(

        "Không tìm thấy SUPABASE_URL hoặc SUPABASE_ANON_KEY."

      );

    }

    db = window.supabase.createClient(

      SUPABASE_URL,

      SUPABASE_ANON_KEY

    );

  } catch (error) {

    console.error(

      "Supabase init error:",

      error

    );

    alert(

      "❌ Không thể kết nối Supabase.\n\n" +

      error.message

    );

    return;

  }

  // ============================================================

  // BIẾN

  // ============================================================

  let allData = [];

  let filteredData = [];

  let currentPage = 1;

  const PAGE_SIZE = 20;

  // ============================================================

  // DOM

  // ============================================================

  let loginBox;

  let managerBox;

  let emailInput;

  let passwordInput;

  let loginBtn;

  let loginMessage;

  let logoutBtn;

  let managerMessage;

  let totalReports;

  let totalAmount;

  let filterUser;

  let filterDate;

  let filterBtn;

  let refreshBtn;

  let exportBtn;

  let tableBody;

  let pagination;

  let menuBtn;

  let sideMenu;

  let sideMenuOverlay;

  let sideMenuClose;

  let menuReportsBtn;

  let menuLogoutBtn;

  let showSubmittedUsersBtn;

  let submittedUserCount;

  let deleteAllBtn;

  // ============================================================

  // DOM READY

  // ============================================================

  document.addEventListener(

    "DOMContentLoaded",

    () => {

      // --------------------------------------------------------

      // LOGIN

      // --------------------------------------------------------

      loginBox =

        document.getElementById(

          "loginBox"

        );

      managerBox =

        document.getElementById(

          "managerBox"

        );

      emailInput =

        document.getElementById(

          "loginId"

        );

      passwordInput =

        document.getElementById(

          "password"

        );

      loginBtn =

        document.getElementById(

          "loginBtn"

        );

      loginMessage =

        document.getElementById(

          "loginMessage"

        );

      // --------------------------------------------------------

      // MANAGER

      // --------------------------------------------------------

      logoutBtn =

        document.getElementById(

          "logoutBtn"

        );

      managerMessage =

        document.getElementById(

          "managerMessage"

        );

      totalReports =

        document.getElementById(

          "totalReports"

        );

      totalAmount =

        document.getElementById(

          "totalAmount"

        );

      // --------------------------------------------------------

      // FILTER

      // --------------------------------------------------------

      filterUser =

        document.getElementById(

          "filterUser"

        );

      filterDate =

        document.getElementById(

          "filterDate"

        );

      filterBtn =

        document.getElementById(

          "filterBtn"

        );

      refreshBtn =

        document.getElementById(

          "refreshBtn"

        );

      exportBtn =

        document.getElementById(

          "exportBtn"

        );

      // --------------------------------------------------------

      // TABLE

      // --------------------------------------------------------

      tableBody =

        document.getElementById(

          "tableBody"

        );

      pagination =

        document.getElementById(

          "pagination"

        );

      // --------------------------------------------------------

      // MENU

      // --------------------------------------------------------

      menuBtn =

        document.getElementById(

          "menuBtn"

        );

      sideMenu =

        document.getElementById(

          "sideMenu"

        );

      sideMenuOverlay =

        document.getElementById(

          "sideMenuOverlay"

        );

      sideMenuClose =

        document.getElementById(

          "sideMenuClose"

        );

      menuReportsBtn =

        document.getElementById(

          "menuReportsBtn"

        );

      menuLogoutBtn =

        document.getElementById(

          "menuLogoutBtn"

        );

      // --------------------------------------------------------

      // CÁN BỘ

      // --------------------------------------------------------

      showSubmittedUsersBtn =

        document.getElementById(

          "showSubmittedUsersBtn"

        );

      submittedUserCount =

        document.getElementById(

          "submittedUserCount"

        );

      // --------------------------------------------------------

      // XÓA

      // --------------------------------------------------------

      deleteAllBtn =

        document.getElementById(

          "deleteAllBtn"

        );

      // ========================================================

      // EVENT

      // ========================================================

      loginBtn?.addEventListener(

        "click",

        login

      );

      passwordInput?.addEventListener(

        "keydown",

        (event) => {

          if (event.key === "Enter") {

            login();

          }

        }

      );

      emailInput?.addEventListener(

        "keydown",

        (event) => {

          if (event.key === "Enter") {

            passwordInput?.focus();

          }

        }

      );

      logoutBtn?.addEventListener(

        "click",

        logout

      );

      menuLogoutBtn?.addEventListener(

        "click",

        logout

      );

      filterBtn?.addEventListener(

        "click",

        applyFilter

      );

      // --------------------------------------------------------

      // LÀM MỚI

      // --------------------------------------------------------

      refreshBtn?.addEventListener(

        "click",

        async () => {

          await loadData();

        }

      );

      // --------------------------------------------------------

      // XUẤT EXCEL

      // --------------------------------------------------------

      exportBtn?.addEventListener(

        "click",

        exportExcel

      );

      // --------------------------------------------------------

      // DANH SÁCH CÁN BỘ

      // --------------------------------------------------------

      showSubmittedUsersBtn?.addEventListener(

        "click",

        showSubmittedUsers

      );

      // --------------------------------------------------------

      // XÓA TẤT CẢ

      // --------------------------------------------------------

      deleteAllBtn?.addEventListener(

        "click",

        deleteAllReports

      );

      // --------------------------------------------------------

      // MENU

      // --------------------------------------------------------

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

          document

            .querySelector(

              ".manager-card"

            )

            ?.scrollIntoView({

              behavior: "smooth",

              block: "start"

            });

        }

      );

      // ========================================================

      // KIỂM TRA SESSION

      // ========================================================

      checkSession();

    }

  );

  // ============================================================

  // KIỂM TRA ĐĂNG NHẬP

  // ============================================================

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

  // ============================================================

  // HIỆN LOGIN

  // ============================================================

  function showLogin() {

    if (loginBox) {

      loginBox.style.display =

        "block";

    }

    if (managerBox) {

      managerBox.style.display =

        "none";

    }

  }

  // ============================================================

  // HIỆN MANAGER

  // ============================================================

  function showManager() {

    if (loginBox) {

      loginBox.style.display =

        "none";

    }

    if (managerBox) {

      managerBox.style.display =

        "block";

    }

  }

  // ============================================================

  // LOGIN

  // ============================================================

  async function login() {

    const email =

      emailInput?.value.trim() || "";

    const password =

      passwordInput?.value || "";

    if (!email) {

      if (loginMessage) {

        loginMessage.textContent =

          "❌ Vui lòng nhập email.";

      }

      return;

    }

    if (!password) {

      if (loginMessage) {

        loginMessage.textContent =

          "❌ Vui lòng nhập mật khẩu.";

      }

      return;

    }

    if (loginBtn) {

      loginBtn.disabled =

        true;

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

      } =

        await db.auth.signInWithPassword({

          email,

          password

        });

      if (error) {

        console.error(

          "Login error:",

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

      if (loginMessage) {

        loginMessage.textContent =

          "";

      }

      if (passwordInput) {

        passwordInput.value =

          "";

      }

      showManager();

      await loadData();

    } catch (error) {

      console.error(

        "login:",

        error

      );

      if (loginMessage) {

        loginMessage.textContent =

          "❌ Có lỗi khi đăng nhập.";

      }

    } finally {

      if (loginBtn) {

        loginBtn.disabled =

          false;

        loginBtn.textContent =

          "🔐 ĐĂNG NHẬP";

      }

    }

  }

  // ============================================================

  // LOGOUT

  // ============================================================

  async function logout() {

    try {

      closeMenu();

      const {

        error

      } =

        await db.auth.signOut();

      if (error) {

        console.error(

          error

        );

        alert(

          "❌ Đăng xuất thất bại.\n\n" +

          error.message

        );

        return;

      }

      allData = [];

      filteredData = [];

      currentPage = 1;

      showLogin();

      if (emailInput) {

        emailInput.value =

          "";

      }

      if (passwordInput) {

        passwordInput.value =

          "";

      }

      if (tableBody) {

        tableBody.innerHTML =

          "";

      }

      if (pagination) {

        pagination.innerHTML =

          "";

      }

    } catch (error) {

      console.error(

        "logout:",

        error

      );

    }

  }

  // ============================================================

  // LOAD DATA

  // ============================================================

  async function loadData() {

    if (!db) return;

    if (managerMessage) {

      managerMessage.textContent =

        "⏳ Đang tải dữ liệu...";

    }

    try {

      let allRows = [];

      let from = 0;

      const batchSize = 1000;

      while (true) {

        const {

          data,

          error

        } =

          await db

            .from("bao_cao_ngay")

            .select("*")

            .order(

              "field_date",

              {

                ascending: false

              }

            )

            .order(

              "created_at",

              {

                ascending: false

              }

            )

            .range(

              from,

              from + batchSize - 1

            );

        if (error) {

          console.error(

            "Load data error:",

            error

          );

          throw error;

        }

        if (

          !data ||

          data.length === 0

        ) {

          break;

        }

        allRows.push(

          ...data

        );

        if (

          data.length <

          batchSize

        ) {

          break;

        }

        from +=

          batchSize;

      }

      allData =

        allRows;

      filteredData =

        [...allData];

      currentPage =

        1;

      updateStats();

      updateSubmittedUserCount();

      render();

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

          "❌ Không thể tải dữ liệu: " +

          error.message;

      }

    }

  }

  // ============================================================

  // LỌC

  // ============================================================

  function applyFilter() {

    const user =

      filterUser?.value

        .trim()

        .toLowerCase() || "";

    const date =

      filterDate?.value || "";

    filteredData =

      allData.filter(

        (row) => {

          const rowUser =

            String(

              row.user_name || ""

            )

              .trim()

              .toLowerCase();

          let matchUser =

            true;

          let matchDate =

            true;

          if (user) {

            matchUser =

              rowUser.includes(

                user

              );

          }

          if (date) {

            const rowDate =

              formatDateForInput(

                row.field_date

              );

            matchDate =

              rowDate ===

              date;

          }

          return (

            matchUser &&

            matchDate

          );

        }

      );

    currentPage =

      1;

    updateStats();

    render();

    if (managerMessage) {

      managerMessage.textContent =

        `🔎 Đang hiển thị ${filteredData.length} báo cáo.`;

    }

  }

  // ============================================================

  // THỐNG KÊ

  // ============================================================

  function updateStats() {

    if (totalReports) {

      totalReports.textContent =

        filteredData.length

          .toLocaleString("vi-VN");

    }

    let total = 0;

    filteredData.forEach(

      (row) => {

        total +=

          parseAmount(

            row.expected_amount

          );

      }

    );

    if (totalAmount) {

      totalAmount.textContent =

        formatMoney(total);

    }

    updateSubmittedUserCount();

  }

  // ============================================================

  // ĐẾM CÁN BỘ

  // ============================================================

  function updateSubmittedUserCount() {

    const users =

      new Set();

    filteredData.forEach(

      (row) => {

        const user =

          String(

            row.user_name || ""

          ).trim();

        if (user) {

          users.add(

            user

          );

        }

      }

    );

    if (submittedUserCount) {

      submittedUserCount.textContent =

        users.size.toString();

    }

  }

  // ============================================================

  // RENDER

  // ============================================================

  function render() {

    if (!tableBody) return;

    tableBody.innerHTML =

      "";

    const totalPages =

      Math.max(

        1,

        Math.ceil(

          filteredData.length /

          PAGE_SIZE

        )

      );

    if (

      currentPage >

      totalPages

    ) {

      currentPage =

        totalPages;

    }

    const start =

      (currentPage - 1) *

      PAGE_SIZE;

    const end =

      start + PAGE_SIZE;

    const pageData =

      filteredData.slice(

        start,

        end

      );

    if (

      pageData.length === 0

    ) {

      const tr =

        document.createElement(

          "tr"

        );

      tr.innerHTML = `

        <td colspan="10" class="empty-row">

          📭 Không có dữ liệu báo cáo

        </td>

      `;

      tableBody.appendChild(

        tr

      );

      renderPagination();

      return;

    }

    pageData.forEach(

      (row) => {

        const tr =

          document.createElement(

            "tr"

          );

        const amount =

          parseAmount(

            row.expected_amount

          );

        tr.innerHTML = `

          <td>

            ${escapeHtml(

              row.user_name || ""

            )}

          </td>

          <td>

            ${formatDate(

              row.field_date

            )}

          </td>

          <td>

            ${escapeHtml(

              row.cif || ""

            )}

          </td>

          <td>

            ${escapeHtml(

              row.customer_name || ""

            )}

          </td>

          <td>

            ${escapeHtml(

              row.result || ""

            )}

          </td>

          <td>

            ${escapeHtml(

              row.connection || ""

            )}

          </td>

          <td class="detail-cell">

            ${escapeHtml(

              row.detail || ""

            )}

          </td>

          <td class="money-cell">

            ${formatMoney(

              amount

            )}

          </td>

          <td class="detail-cell">

            ${escapeHtml(

              row.next_action || ""

            )}

          </td>

          <td class="action-cell">

            <button

              type="button"

              class="edit-btn"

              data-id="${escapeAttr(

                row.id

              )}"

              title="Chỉnh sửa">

              ✏️

            </button>

            <button

              type="button"

              class="delete-btn"

              data-id="${escapeAttr(

                row.id

              )}"

              title="Xóa">

              🗑️

            </button>

          </td>

        `;

        const editButton =

          tr.querySelector(

            ".edit-btn"

          );

        const deleteButton =

          tr.querySelector(

            ".delete-btn"

          );

        editButton?.addEventListener(

          "click",

          () =>

            editReport(

              row.id

            )

        );

        deleteButton?.addEventListener(

          "click",

          () =>

            deleteReport(

              row.id

            )

        );

        tableBody.appendChild(

          tr

        );

      }

    );

    renderPagination();

  }

  // ============================================================

  // PHÂN TRANG

  // ============================================================

  function renderPagination() {

    if (!pagination) return;

    pagination.innerHTML =

      "";

    const totalPages =

      Math.ceil(

        filteredData.length /

        PAGE_SIZE

      );

    if (

      totalPages <= 1

    ) {

      return;

    }

    const wrapper =

      document.createElement(

        "div"

      );

    wrapper.className =

      "pagination-wrap";

    // ----------------------------------------------------------

    // TRƯỚC

    // ----------------------------------------------------------

    const prev =

      document.createElement(

        "button"

      );

    prev.type =

      "button";

    prev.textContent =

      "← Trước";

    prev.disabled =

      currentPage === 1;

    prev.addEventListener(

      "click",

      () => {

        if (

          currentPage > 1

        ) {

          currentPage--;

          render();

          window.scrollTo({

            top: 0,

            behavior: "smooth"

          });

        }

      }

    );

    wrapper.appendChild(

      prev

    );

    // ----------------------------------------------------------

    // THÔNG TIN TRANG

    // ----------------------------------------------------------

    const info =

      document.createElement(

        "span"

      );

    info.className =

      "page-info";

    info.textContent =

      `Trang ${currentPage} / ${totalPages}`;

    wrapper.appendChild(

      info

    );

    // ----------------------------------------------------------

    // SAU

    // ----------------------------------------------------------

    const next =

      document.createElement(

        "button"

      );

    next.type =

      "button";

    next.textContent =

      "Sau →";

    next.disabled =

      currentPage ===

      totalPages;

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

    wrapper.appendChild(

      next

    );

    pagination.appendChild(

      wrapper

    );

  }

  // ============================================================

  // SỬA BÁO CÁO

  // ============================================================

  async function editReport(id) {

    const row =

      allData.find(

        (item) =>

          String(item.id) ===

          String(id)

      );

    if (!row) {

      alert(

        "❌ Không tìm thấy dữ liệu cần sửa."

      );

      return;

    }

    createEditModal(

      row

    );

  }

  // ============================================================

  // TẠO MODAL SỬA

  // ============================================================

  function createEditModal(row) {

    removeEditModal();

    const modal =

      document.createElement(

        "div"

      );

    modal.id =

      "editReportModal";

    modal.className =

      "modal-overlay";

    modal.innerHTML = `

      <div class="edit-modal">

        <div class="edit-modal-header">

          <div>

            <h2>

              ✏️ SỬA BÁO CÁO

            </h2>

            <p>

              Chỉnh sửa thông tin báo cáo

            </p>

          </div>

          <button

            type="button"

            class="modal-close"

            id="editModalClose">

            ✕

          </button>

        </div>

        <div class="edit-form">

          <label>

            User cán bộ

            <input

              id="editUserName"

              type="text"

              value="${escapeAttr(

                row.user_name || ""

              )}">

          </label>

          <label>

            Ngày field

            <input

              id="editFieldDate"

              type="date"

              value="${escapeAttr(

                formatDateForInput(

                  row.field_date

                )

              )}">

          </label>

          <label>

            Số CIF

            <input

              id="editCif"

              type="text"

              value="${escapeAttr(

                row.cif || ""

              )}">

          </label>

          <label>

            Tên khách hàng

            <input

              id="editCustomerName"

              type="text"

              value="${escapeAttr(

                row.customer_name || ""

              )}">

          </label>

          <label>

            Kết quả

            <select

              id="editResult">

              <option value="">

                -- Chọn --

              </option>

              <option

                value="Sống"

                ${

                  row.result === "Sống"

                    ? "selected"

                    : ""

                }>

                Sống

              </option>

              <option

                value="Chết"

                ${

                  row.result === "Chết"

                    ? "selected"

                    : ""

                }>

                Chết

              </option>

            </select>

          </label>

          <label>

            Kết nối

            <select

              id="editConnection">

              <option value="">

                -- Chọn --

              </option>

              ${createOption(

                "KH",

                row.connection

              )}

              ${createOption(

                "Vợ-Chồng",

                row.connection

              )}

              ${createOption(

                "Ba-Mẹ",

                row.connection

              )}

              ${createOption(

                "Con",

                row.connection

              )}

              ${createOption(

                "Anh-Chị",

                row.connection

              )}

              ${createOption(

                "Hàng xóm",

                row.connection

              )}

              ${createOption(

                "Chính quyền địa phương",

                row.connection

              )}

              ${createOption(

                "Không gặp ai",

                row.connection

              )}

              ${createOption(

                "Bán nhà",

                row.connection

              )}

              ${createOption(

                "Chưa tìm được nhà",

                row.connection

              )}

            </select>

          </label>

          <label>

            Kết quả chi tiết

            <textarea

              id="editDetail"

              rows="4">${escapeHtml(

                row.detail || ""

              )}</textarea>

          </label>

          <label>

            Dự thu

            <input

              id="editExpectedAmount"

              type="text"

              inputmode="numeric"

              value="${escapeAttr(

                formatInputMoney(

                  row.expected_amount

                )

              )}">

          </label>

          <label>

            Hướng tác động tiếp theo

            <textarea

              id="editNextAction"

              rows="4">${escapeHtml(

                row.next_action || ""

              )}</textarea>

          </label>

        </div>

        <div class="edit-modal-footer">

          <button

            type="button"

            class="gray"

            id="editCancelBtn">

            HỦY

          </button>

          <button

            type="button"

            class="save-edit-btn"

            id="saveEditBtn">

            💾 LƯU THAY ĐỔI

          </button>

        </div>

      </div>

    `;

    document.body.appendChild(

      modal

    );

    document

      .getElementById(

        "editModalClose"

      )

      ?.addEventListener(

        "click",

        removeEditModal

      );

    document

      .getElementById(

        "editCancelBtn"

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

    // ----------------------------------------------------------

    // FORMAT TIỀN

    // ----------------------------------------------------------

    const amountInput =

      document.getElementById(

        "editExpectedAmount"

      );

    amountInput?.addEventListener(

      "input",

      () => {

        const value =

          amountInput.value

            .replace(

              /\D/g,

              ""

            );

        amountInput.value =

          value

            ? Number(

                value

              ).toLocaleString(

                "en-US"

              )

            : "";

      }

    );

    // ----------------------------------------------------------

    // CLICK RA NGOÀI MODAL

    // ----------------------------------------------------------

    modal.addEventListener(

      "click",

      (event) => {

        if (

          event.target ===

          modal

        ) {

          removeEditModal();

        }

      }

    );

  }

  // ============================================================

  // OPTION SELECT

  // ============================================================

  function createOption(

    value,

    currentValue

  ) {

    return `

      <option

        value="${escapeAttr(

          value

        )}"

        ${

          value === currentValue

            ? "selected"

            : ""

        }>

        ${escapeHtml(

          value

        )}

      </option>

    `;

  }

  // ============================================================

  // LƯU SỬA

  // ============================================================

  async function saveEditReport(id) {

    const userName =

      document

        .getElementById(

          "editUserName"

        )

        ?.value.trim() || "";

    const fieldDate =

      document

        .getElementById(

          "editFieldDate"

        )

        ?.value || "";

    const cif =

      document

        .getElementById(

          "editCif"

        )

        ?.value.trim() || "";

    const customerName =

      document

        .getElementById(

          "editCustomerName"

        )

        ?.value.trim() || "";

    const result =

      document

        .getElementById(

          "editResult"

        )

        ?.value || "";

    const connection =

      document

        .getElementById(

          "editConnection"

        )

        ?.value || "";

    const detail =

      document

        .getElementById(

          "editDetail"

        )

        ?.value.trim() || "";

    const amountText =

      document

        .getElementById(

          "editExpectedAmount"

        )

        ?.value || "";

    const expectedAmount =

      parseAmount(

        amountText

      );

    const nextAction =

      document

        .getElementById(

          "editNextAction"

        )

        ?.value.trim() || "";

    // ----------------------------------------------------------

    // KIỂM TRA

    // ----------------------------------------------------------

    if (!userName) {

      alert(

        "❌ Vui lòng nhập User cán bộ."

      );

      return;

    }

    if (!fieldDate) {

      alert(

        "❌ Vui lòng chọn ngày field."

      );

      return;

    }

    if (!cif) {

      alert(

        "❌ Vui lòng nhập Số CIF."

      );

      return;

    }

    const saveBtn =

      document.getElementById(

        "saveEditBtn"

      );

    if (saveBtn) {

      saveBtn.disabled =

        true;

      saveBtn.textContent =

        "⏳ ĐANG LƯU...";

    }

    try {

      const {

        error

      } =

        await db

          .from(

            "bao_cao_ngay"

          )

          .update({

            user_name:

              userName,

            field_date:

              fieldDate,

            cif:

              cif,

            customer_name:

              customerName,

            result:

              result,

            connection:

              connection,

            detail:

              detail,

            expected_amount:

              expectedAmount,

            next_action:

              nextAction

          })

          .eq(

            "id",

            id

          );

      if (error) {

        console.error(

          "Save edit error:",

          error

        );

        alert(

          "❌ Lưu thay đổi thất bại.\n\n" +

          error.message

        );

        return;

      }

      removeEditModal();

      alert(

        "✅ Đã lưu thay đổi."

      );

      await loadData();

      applyFilter();

    } catch (error) {

      console.error(

        "saveEditReport:",

        error

      );

      alert(

        "❌ Có lỗi khi lưu dữ liệu.\n\n" +

        error.message

      );

    } finally {

      if (saveBtn) {

        saveBtn.disabled =

          false;

        saveBtn.textContent =

          "💾 LƯU THAY ĐỔI";

      }

    }

  }

  // ============================================================

  // XÓA 1 BÁO CÁO

  // ============================================================

  async function deleteReport(id) {

    const row =

      allData.find(

        (item) =>

          String(item.id) ===

          String(id)

      );

    const customer =

      row?.customer_name || "";

    const confirmed =

      confirm(

        "⚠️ XÁC NHẬN XÓA\n\n" +

        "Bạn có chắc chắn muốn xóa báo cáo này?\n\n" +

        (

          customer

            ? "Khách hàng: " +

              customer +

              "\n\n"

            : ""

        ) +

        "Hành động này không thể hoàn tác."

      );

    if (!confirmed) {

      return;

    }

    try {

      const {

        error

      } =

        await db

          .from(

            "bao_cao_ngay"

          )

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

        alert(

          "❌ Xóa thất bại.\n\n" +

          error.message

        );

        return;

      }

      alert(

        "✅ Đã xóa báo cáo."

      );

      await loadData();

      applyFilter();

    } catch (error) {

      console.error(

        "deleteReport:",

        error

      );

      alert(

        "❌ Có lỗi khi xóa.\n\n" +

        error.message

      );

    }

  }

  // ============================================================

  // XÓA TOÀN BỘ DỮ LIỆU

  // ============================================================

  async function deleteAllReports() {

    // ----------------------------------------------------------

    // XÁC NHẬN LẦN 1

    // ----------------------------------------------------------

    const confirmed =

      confirm(

        "⚠️ CẢNH BÁO NGHIÊM TRỌNG!\n\n" +

        "Bạn có chắc chắn muốn XÓA TẤT CẢ dữ liệu báo cáo?\n\n" +

        "Toàn bộ dữ liệu của TẤT CẢ CÁC THÁNG sẽ bị xóa sạch.\n\n" +

        "Hành động này KHÔNG THỂ hoàn tác.\n\n" +

        "✓ Không xóa tài khoản đăng nhập.\n" +

        "✓ Không xóa cấu trúc bảng.\n\n" +

        "Bạn có chắc chắn muốn tiếp tục?"

      );

    if (!confirmed) {

      return;

    }

    // ----------------------------------------------------------

    // XÁC NHẬN LẦN 2

    // ----------------------------------------------------------

    const keyword =

      prompt(

        "Để xác nhận xóa toàn bộ dữ liệu,\n\n" +

        "hãy nhập chính xác:\n\n" +

        "XÓA TẤT CẢ"

      );

    // ==========================================================

    // CHUẨN HÓA TỪ XÁC NHẬN

    //

    // Chấp nhận:

    //

    // XOA TAT CA

    // XÓA TẤT CẢ

    // xoa tat ca

    // xóa tất cả

    //

    // Và có thể có dư khoảng trắng.

    // ==========================================================

    const normalizedKeyword =

      String(

        keyword || ""

      )

        .trim()

        .normalize("NFD")

        .replace(

          /[\u0300-\u036f]/g,

          ""

        )

        .replace(

          /đ/g,

          "d"

        )

        .replace(

          /Đ/g,

          "D"

        )

        .replace(

          /\s+/g,

          " "

        )

        .toUpperCase();

    // ----------------------------------------------------------

    // KIỂM TRA

    // ----------------------------------------------------------

    if (

      normalizedKeyword !==

      "XOA TAT CA"

    ) {

      alert(

        "❌ Xác nhận không đúng.\n\n" +

        "Dữ liệu chưa bị xóa."

      );

      return;

    }

    // ----------------------------------------------------------

    // KHÓA NÚT

    // ----------------------------------------------------------

    if (deleteAllBtn) {

      deleteAllBtn.disabled =

        true;

      deleteAllBtn.textContent =

        "⏳ ĐANG XÓA...";

    }

    if (managerMessage) {

      managerMessage.textContent =

        "⏳ Đang xóa toàn bộ dữ liệu...";

    }

    // ----------------------------------------------------------

    // XÓA SUPABASE

    // ----------------------------------------------------------

    try {

      const {

        error

      } =

        await db

          .from(

            "bao_cao_ngay"

          )

          .delete()

          .not(

            "id",

            "is",

            null

          );

      // --------------------------------------------------------

      // NẾU LỖI

      // --------------------------------------------------------

      if (error) {

        console.error(

          "Delete all error:",

          error

        );

        if (managerMessage) {

          managerMessage.textContent =

            "❌ Không thể xóa tất cả: " +

            error.message;

        }

        alert(

          "❌ XÓA TẤT CẢ THẤT BẠI.\n\n" +

          error.message +

          "\n\n" +

          "Nếu lỗi liên quan đến RLS hoặc DELETE policy,\n" +

          "hãy kiểm tra quyền DELETE của bảng\n" +

          "bao_cao_ngay trong Supabase."

        );

        return;

      }

      // --------------------------------------------------------

      // RESET DỮ LIỆU GIAO DIỆN

      // --------------------------------------------------------

      allData = [];

      filteredData = [];

      currentPage = 1;

      // --------------------------------------------------------

      // RESET BỘ LỌC

      // --------------------------------------------------------

      if (filterUser) {

        filterUser.value =

          "";

      }

      if (filterDate) {

        filterDate.value =

          "";

      }

      // --------------------------------------------------------

      // RESET THỐNG KÊ

      // --------------------------------------------------------

      if (totalReports) {

        totalReports.textContent =

          "0";

      }

      if (totalAmount) {

        totalAmount.textContent =

          "0 đ";

      }

      if (submittedUserCount) {

        submittedUserCount.textContent =

          "0";

      }

      // --------------------------------------------------------

      // RESET TABLE

      // --------------------------------------------------------

      if (tableBody) {

        tableBody.innerHTML =

          "";

      }

      if (pagination) {

        pagination.innerHTML =

          "";

      }

      render();

      // --------------------------------------------------------

      // THÔNG BÁO

      // --------------------------------------------------------

      if (managerMessage) {

        managerMessage.textContent =

          "✅ Đã xóa sạch toàn bộ dữ liệu báo cáo.";

      }

      alert(

        "✅ ĐÃ XÓA SẠCH TOÀN BỘ DỮ LIỆU!\n\n" +

        "Toàn bộ báo cáo của tất cả các tháng đã được xóa.\n\n" +

        "✓ Tài khoản quản lý vẫn còn.\n" +

        "✓ Cấu trúc bảng vẫn còn.\n" +

        "✓ Web vẫn hoạt động bình thường."

      );

    } catch (error) {

      console.error(

        "deleteAllReports:",

        error

      );

      if (managerMessage) {

        managerMessage.textContent =

          "❌ Lỗi khi xóa toàn bộ dữ liệu.";

      }

      alert(

        "❌ KHÔNG THỂ XÓA TOÀN BỘ DỮ LIỆU.\n\n" +

        (

          error?.message ||

          "Lỗi không xác định."

        )

      );

    } finally {

      // --------------------------------------------------------

      // MỞ KHÓA NÚT

      // --------------------------------------------------------

      if (deleteAllBtn) {

        deleteAllBtn.disabled =

          false;

        deleteAllBtn.textContent =

          "🗑️ XÓA TẤT CẢ";

      }

    }

  }

  // ============================================================

  // DANH SÁCH CÁN BỘ

  // ============================================================

  function showSubmittedUsers() {

    const usersMap =

      new Map();

    filteredData.forEach(

      (row) => {

        const user =

          String(

            row.user_name || ""

          ).trim();

        if (!user) return;

        if (

          !usersMap.has(user)

        ) {

          usersMap.set(

            user,

            0

          );

        }

        usersMap.set(

          user,

          usersMap.get(user) + 1

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

    removeSubmittedUserModal();

    const modal =

      document.createElement(

        "div"

      );

    modal.id =

      "submittedUsersModal";

    modal.className =

      "modal-overlay";

    let html =

      "";

    // ----------------------------------------------------------

    // KHÔNG CÓ CÁN BỘ

    // ----------------------------------------------------------

    if (

      users.length === 0

    ) {

      html = `

        <div class="submitted-empty">

          📭 Chưa có cán bộ nào nhập báo cáo.

        </div>

      `;

    }

    // ----------------------------------------------------------

    // CÓ CÁN BỘ

    // ----------------------------------------------------------

    else {

      html = `

        <div class="submitted-user-list">

      `;

      users.forEach(

        ([user, count], index) => {

          html += `

            <div

              class="submitted-user-item">

              <span

                class="submitted-number">

                ${index + 1}

              </span>

              <span

                class="submitted-user-name">

                ${escapeHtml(

                  user

                )}

              </span>

              <span

                class="submitted-count">

                ${count} báo cáo

              </span>

            </div>

          `;

        }

      );

      html += `

        </div>

      `;

    }

    // ----------------------------------------------------------

    // MODAL

    // ----------------------------------------------------------

    modal.innerHTML = `

      <div class="submitted-modal">

        <div class="submitted-modal-header">

          <div>

            <h2>

              👥 CÁN BỘ ĐÃ NHẬP BÁO CÁO

            </h2>

            <p>

              Tổng số: ${users.length} cán bộ

            </p>

          </div>

          <button

            type="button"

            class="modal-close"

            id="submittedModalClose">

            ✕

          </button>

        </div>

        ${html}

      </div>

    `;

    document.body.appendChild(

      modal

    );

    document

      .getElementById(

        "submittedModalClose"

      )

      ?.addEventListener(

        "click",

        removeSubmittedUserModal

      );

    modal.addEventListener(

      "click",

      (event) => {

        if (

          event.target ===

          modal

        ) {

          removeSubmittedUserModal();

        }

      }

    );

  }

  // ============================================================

  // ĐÓNG MODAL CÁN BỘ

  // ============================================================

  function removeSubmittedUserModal() {

    document

      .getElementById(

        "submittedUsersModal"

      )

      ?.remove();

  }

  // ============================================================

  // ĐÓNG MODAL SỬA

  // ============================================================

  function removeEditModal() {

    document

      .getElementById(

        "editReportModal"

      )

      ?.remove();

  }

  // ============================================================

  // MENU

  // ============================================================

  function openMenu() {

    sideMenu?.classList.add(

      "open"

    );

    sideMenuOverlay?.classList.add(

      "show"

    );

    document.body.classList.add(

      "menu-open"

    );

  }

  function closeMenu() {

    sideMenu?.classList.remove(

      "open"

    );

    sideMenuOverlay?.classList.remove(

      "show"

    );

    document.body.classList.remove(

      "menu-open"

    );

  }

  // ============================================================

  // XUẤT EXCEL

  // ============================================================

  function exportExcel() {

    if (

      typeof XLSX ===

      "undefined"

    ) {

      alert(

        "❌ Không tìm thấy thư viện Excel."

      );

      return;

    }

    if (

      !filteredData.length

    ) {

      alert(

        "📭 Không có dữ liệu để xuất Excel."

      );

      return;

    }

    try {

      // --------------------------------------------------------

      // NGÀY XUẤT

      // --------------------------------------------------------

      const exportDate =

        new Date();

      const dateText =

        [

          exportDate.getFullYear(),

          String(

            exportDate.getMonth() + 1

          ).padStart(

            2,

            "0"

          ),

          String(

            exportDate.getDate()

          ).padStart(

            2,

            "0"

          )

        ].join("-");

      // ========================================================

      // SHEET 1

      // ========================================================

      const reportRows =

        filteredData.map(

          (row) => ({

            "Cán bộ":

              row.user_name || "",

            "Ngày field":

              toExcelDate(

                row.field_date

              ),

            "Số CIF":

              row.cif || "",

            "Tên khách hàng":

              row.customer_name || "",

            "Kết quả":

              row.result || "",

            "Kết nối":

              row.connection || "",

            "Kết quả chi tiết":

              row.detail || "",

            "Dự thu":

              parseAmount(

                row.expected_amount

              ),

            "Hướng tác động tiếp theo":

              row.next_action || ""

          })

        );

      const ws =

        XLSX.utils.json_to_sheet(

          reportRows,

          {

            skipHeader:

              false

          }

        );

      // ========================================================

      // STYLE

      // ========================================================

      const range =

        XLSX.utils.decode_range(

          ws["!ref"]

        );

      for (

        let row =

          range.s.r;

        row <=

          range.e.r;

        row++

      ) {

        for (

          let col =

            range.s.c;

          col <=

            range.e.c;

          col++

        ) {

          const cell =

            ws[

              XLSX.utils.encode_cell({

                r: row,

                c: col

              })

            ];

          if (!cell) continue;

          cell.s = {

            font: {

              name:

                "Arial",

              sz:

                10,

              bold:

                row === 0

            },

            alignment: {

              vertical:

                "center",

              horizontal:

                row === 0

                  ? "center"

                  : "left",

              wrapText:

                true

            },

            border: {

              top: {

                style:

                  "thin"

              },

              bottom: {

                style:

                  "thin"

              },

              left: {

                style:

                  "thin"

              },

              right: {

                style:

                  "thin"

              }

            }

          };

        }

      }

      // ========================================================

      // HEADER

      // ========================================================

      for (

        let col =

          range.s.c;

        col <=

          range.e.c;

        col++

      ) {

        const cell =

          ws[

            XLSX.utils.encode_cell({

              r: 0,

              c: col

            })

          ];

        if (!cell) continue;

        cell.s = {

          font: {

            name:

              "Arial",

            sz:

              11,

            bold:

              true

          },

          alignment: {

            horizontal:

              "center",

            vertical:

              "center",

            wrapText:

              true

          },

          border: {

            top: {

              style:

                "thin"

            },

            bottom: {

              style:

                "thin"

            },

            left: {

              style:

                "thin"

            },

            right: {

              style:

                "thin"

            }

          }

        };

      }

      // ========================================================

      // FORMAT NGÀY + TIỀN

      // ========================================================

      for (

        let row = 1;

        row <=

          range.e.r;

        row++

      ) {

        const dateCell =

          ws[

            XLSX.utils.encode_cell({

              r: row,

              c: 1

            })

          ];

        if (dateCell) {

          dateCell.z =

            "dd/mm/yyyy";

        }

        const moneyCell =

          ws[

            XLSX.utils.encode_cell({

              r: row,

              c: 7

            })

          ];

        if (moneyCell) {

          moneyCell.z =

            '#,##0" đ"';

        }

      }

      // ========================================================

      // ĐỘ RỘNG CỘT

      // ========================================================

      ws["!cols"] = [

        {

          wch: 18

        },

        {

          wch: 14

        },

        {

          wch: 16

        },

        {

          wch: 28

        },

        {

          wch: 12

        },

        {

          wch: 24

        },

        {

          wch: 45

        },

        {

          wch: 18

        },

        {

          wch: 45

        }

      ];

      ws["!rows"] = [

        {

          hpt: 25

        }

      ];

      // ========================================================

      // FILTER

      // ========================================================

      ws["!autofilter"] = {

        ref:

          ws["!ref"]

      };

      // ========================================================

      // FREEZE HEADER

      // ========================================================

      ws["!freeze"] = {

        xSplit:

          0,

        ySplit:

          1

      };

      // ========================================================

      // SHEET 2 - TỔNG QUAN

      // ========================================================

      const totalMoney =

        filteredData.reduce(

          (

            sum,

            row

          ) =>

            sum +

            parseAmount(

              row.expected_amount

            ),

          0

        );

      const uniqueUsers =

        new Set(

          filteredData

            .map(

              (row) =>

                String(

                  row.user_name ||

                  ""

                ).trim()

            )

            .filter(

              Boolean

            )

        );

      const summaryRows = [

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

          "Số cán bộ đã nhập",

          uniqueUsers.size

        ],

        [

          "Tổng dự thu",

          totalMoney

        ],

        [

          "Ngày xuất",

          new Date()

        ]

      ];

      const wsSummary =

        XLSX.utils.aoa_to_sheet(

          summaryRows

        );

      // --------------------------------------------------------

      // TITLE

      // --------------------------------------------------------

      if (

        wsSummary["A1"]

      ) {

        wsSummary["A1"].s = {

          font: {

            bold:

              true,

            sz:

              16

          },

          alignment: {

            horizontal:

              "center"

          }

        };

      }

      // --------------------------------------------------------

      // HEADER

      // --------------------------------------------------------

      if (

        wsSummary["A3"]

      ) {

        wsSummary["A3"].s = {

          font: {

            bold:

              true

          }

        };

      }

      if (

        wsSummary["B3"]

      ) {

        wsSummary["B3"].s = {

          font: {

            bold:

              true

          }

        };

      }

      // --------------------------------------------------------

      // MONEY

      // --------------------------------------------------------

      if (

        wsSummary["B6"]

      ) {

        wsSummary["B6"].z =

          '#,##0" đ"';

      }

      // --------------------------------------------------------

      // DATE

      // --------------------------------------------------------

      if (

        wsSummary["B7"]

      ) {

        wsSummary["B7"].z =

          "dd/mm/yyyy hh:mm";

      }

      wsSummary["!cols"] = [

        {

          wch: 30

        },

        {

          wch: 25

        }

      ];

      // ========================================================

      // WORKBOOK

      // ========================================================

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

      // ========================================================

      // TÊN FILE

      // ========================================================

      const fileName =

        `Bao_Cao_Ngay_${dateText}.xlsx`;

      // ========================================================

      // SAVE

      // ========================================================

      XLSX.writeFile(

        wb,

        fileName

      );

      if (managerMessage) {

        managerMessage.textContent =

          `✅ Đã xuất Excel: ${fileName}`;

      }

    } catch (error) {

      console.error(

        "exportExcel:",

        error

      );

      alert(

        "❌ Xuất Excel thất bại.\n\n" +

        error.message

      );

    }

  }

  // ============================================================

  // FORMAT DATE

  // ============================================================

  function formatDate(value) {

    if (!value) {

      return "";

    }

    const date =

      new Date(

        value

      );

    if (

      Number.isNaN(

        date.getTime()

      )

    ) {

      return String(

        value

      );

    }

    return [

      String(

        date.getDate()

      ).padStart(

        2,

        "0"

      ),

      String(

        date.getMonth() + 1

      ).padStart(

        2,

        "0"

      ),

      date.getFullYear()

    ].join("/");

  }

  // ============================================================

  // FORMAT DATE TIME

  // ============================================================

  function formatDateTime(value) {

    if (!value) {

      return "";

    }

    const date =

      new Date(

        value

      );

    if (

      Number.isNaN(

        date.getTime()

      )

    ) {

      return String(

        value

      );

    }

    return (

      formatDate(

        value

      ) +

      " " +

      String(

        date.getHours()

      ).padStart(

        2,

        "0"

      ) +

      ":" +

      String(

        date.getMinutes()

      ).padStart(

        2,

        "0"

      )

    );

  }

  // ============================================================

  // DATE INPUT

  // ============================================================

  function formatDateForInput(value) {

    if (!value) {

      return "";

    }

    const text =

      String(

        value

      );

    // ----------------------------------------------------------

    // ĐÃ LÀ YYYY-MM-DD

    // ----------------------------------------------------------

    if (

      /^\d{4}-\d{2}-\d{2}$/

        .test(text)

    ) {

      return text;

    }

    const date =

      new Date(

        value

      );

    if (

      Number.isNaN(

        date.getTime()

      )

    ) {

      return "";

    }

    return [

      date.getFullYear(),

      String(

        date.getMonth() + 1

      ).padStart(

        2,

        "0"

      ),

      String(

        date.getDate()

      ).padStart(

        2,

        "0"

      )

    ].join("-");

  }

  // ============================================================

  // EXCEL DATE

  // ============================================================

  function toExcelDate(value) {

    if (!value) {

      return "";

    }

    const text =

      String(

        value

      );

    // ----------------------------------------------------------

    // YYYY-MM-DD

    // ----------------------------------------------------------

    if (

      /^\d{4}-\d{2}-\d{2}$/

        .test(text)

    ) {

      const [

        y,

        m,

        d

      ] =

        text

          .split("-")

          .map(

            Number

          );

      return new Date(

        y,

        m - 1,

        d

      );

    }

    const date =

      new Date(

        value

      );

    return Number.isNaN(

      date.getTime()

    )

      ? ""

      : date;

  }

  // ============================================================

  // MONEY

  // ============================================================

  function parseAmount(value) {

    if (

      value === null ||

      value === undefined ||

      value === ""

    ) {

      return 0;

    }

    if (

      typeof value ===

      "number"

    ) {

      return Number.isFinite(

        value

      )

        ? value

        : 0;

    }

    let text =

      String(

        value

      ).trim();

    text =

      text.replace(

        /[^\d-]/g,

        ""

      );

    if (!text) {

      return 0;

    }

    const number =

      Number(

        text

      );

    return Number.isFinite(

      number

    )

      ? number

      : 0;

  }

  // ============================================================

  // FORMAT MONEY

  // ============================================================

  function formatMoney(value) {

    const number =

      parseAmount(

        value

      );

    return (

      number.toLocaleString(

        "vi-VN"

      ) +

      " đ"

    );

  }

  // ============================================================

  // FORMAT INPUT MONEY

  // ============================================================

  function formatInputMoney(value) {

    const number =

      parseAmount(

        value

      );

    if (!number) {

      return "";

    }

    return number.toLocaleString(

      "en-US"

    );

  }

  // ============================================================

  // ESCAPE HTML

  // ============================================================

  function escapeHtml(value) {

    return String(

      value ?? ""

    )

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

  // ============================================================

  // ESCAPE ATTRIBUTE

  // ============================================================

  function escapeAttr(value) {

    return escapeHtml(

      value

    );

  }

})();
