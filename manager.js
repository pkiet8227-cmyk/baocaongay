
(() => {
  "use strict";

  function initManager() {
    /* ============================================================
       1. KẾT NỐI SUPABASE
    ============================================================ */
    const SUPABASE_URL = window.SUPABASE_URL;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

    if (!window.supabase) {
      console.error("Không tìm thấy thư viện Supabase.");
      return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY.");
      return;
    }

    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );

    /* ============================================================
       2. BIẾN DỮ LIỆU
    ============================================================ */
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    const PAGE_SIZE = 20;

    /* ============================================================
       3. DOM
    ============================================================ */
    const loginBox = document.getElementById("loginBox");
    const managerBox = document.getElementById("managerBox");
    const loginId = document.getElementById("loginId");
    const password = document.getElementById("password");
    const loginBtn = document.getElementById("loginBtn");
    const loginMessage = document.getElementById("loginMessage");

    const logoutBtn = document.getElementById("logoutBtn");
    const managerMessage = document.getElementById("managerMessage");
    const totalReports = document.getElementById("totalReports");
    const totalAmount = document.getElementById("totalAmount");

    const filterUser = document.getElementById("filterUser");
    const filterDate = document.getElementById("filterDate");
    const filterBtn = document.getElementById("filterBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const exportBtn = document.getElementById("exportBtn");
    const exportMonthBtn = document.getElementById("exportMonthBtn");

    const tableBody = document.getElementById("tableBody");
    const pagination = document.getElementById("pagination");

    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");
    const sideMenuOverlay = document.getElementById("sideMenuOverlay");
    const sideMenuClose = document.getElementById("sideMenuClose");
    const menuReportsBtn = document.getElementById("menuReportsBtn");
    const menuLogoutBtn = document.getElementById("menuLogoutBtn");

    const showSubmittedUsersBtn =
      document.getElementById("showSubmittedUsersBtn");
    const submittedUserCount =
      document.getElementById("submittedUserCount");
    const deleteAllBtn = document.getElementById("deleteAllBtn");

    /* ============================================================
       4. EVENTS
    ============================================================ */
    loginBtn?.addEventListener("click", login);

    password?.addEventListener("keydown", event => {
      if (event.key === "Enter") login();
    });

    loginId?.addEventListener("keydown", event => {
      if (event.key === "Enter") login();
    });

    logoutBtn?.addEventListener("click", logout);
    menuLogoutBtn?.addEventListener("click", logout);

    filterBtn?.addEventListener("click", () => applyFilter(true));

    refreshBtn?.addEventListener("click", async () => {
      await loadData(true);
    });

    exportBtn?.addEventListener("click", exportExcel);

    // NÚT MỚI: XUẤT TOÀN BỘ BÁO CÁO THÁNG HIỆN TẠI
    exportMonthBtn?.addEventListener("click", exportCurrentMonthExcel);

    showSubmittedUsersBtn?.addEventListener("click", showSubmittedUsers);
    deleteAllBtn?.addEventListener("click", deleteAllReports);

    filterDate?.addEventListener("change", updateSubmittedUserCount);

    menuBtn?.addEventListener("click", openSideMenu);
    sideMenuClose?.addEventListener("click", closeSideMenu);
    sideMenuOverlay?.addEventListener("click", closeSideMenu);

    menuReportsBtn?.addEventListener("click", () => {
      closeSideMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    /* ============================================================
       5. SESSION
    ============================================================ */
    checkSession();

    async function checkSession() {
      try {
        const { data, error } = await supabaseClient.auth.getSession();

        if (error) throw error;

        if (data?.session) {
          showManager();
          clearDateFilter();
          await loadData(false);
        } else {
          showLogin();
        }
      } catch (error) {
        console.error("Lỗi kiểm tra session:", error);
        showLogin();
      }
    }

    function showLogin() {
      if (loginBox) loginBox.style.display = "";
      if (managerBox) managerBox.style.display = "none";
    }

    function showManager() {
      if (loginBox) loginBox.style.display = "none";
      if (managerBox) managerBox.style.display = "";
    }

    /* ============================================================
       6. ĐĂNG NHẬP
    ============================================================ */
    async function login() {
      const email = loginId?.value?.trim() || "";
      const pass = password?.value || "";

      if (!email || !pass) {
        setLoginMessage("Vui lòng nhập Gmail và mật khẩu.", true);
        return;
      }

      if (loginBtn) loginBtn.disabled = true;
      setLoginMessage("Đang đăng nhập...", false);

      try {
        const { data, error } =
          await supabaseClient.auth.signInWithPassword({
            email,
            password: pass
          });

        if (error) throw error;

        if (!data?.session) {
          setLoginMessage("Đăng nhập không thành công.", true);
          return;
        }

        setLoginMessage("", false);
        showManager();
        clearDateFilter();
        await loadData(false);
      } catch (error) {
        console.error("Lỗi đăng nhập:", error);
        setLoginMessage(
          error?.message || "Có lỗi xảy ra khi đăng nhập.",
          true
        );
      } finally {
        if (loginBtn) loginBtn.disabled = false;
      }
    }

    /* ============================================================
       7. ĐĂNG XUẤT
    ============================================================ */
    async function logout() {
      try {
        await supabaseClient.auth.signOut();
      } catch (error) {
        console.error("Lỗi đăng xuất:", error);
      }

      allData = [];
      filteredData = [];
      currentPage = 1;

      if (tableBody) tableBody.innerHTML = "";
      if (pagination) pagination.innerHTML = "";
      if (totalReports) totalReports.textContent = "0";
      if (totalAmount) totalAmount.textContent = "0";
      if (submittedUserCount) submittedUserCount.textContent = "0";

      if (filterUser) filterUser.value = "";
      if (loginId) loginId.value = "";
      if (password) password.value = "";

      clearDateFilter();
      closeSideMenu();
      showLogin();
    }

    function clearDateFilter() {
      if (filterDate) filterDate.value = "";
    }

    /* ============================================================
       8. NGÀY HIỆN TẠI THEO GIỜ VIỆT NAM
    ============================================================ */
    function getTodayVietnamDate() {
      try {
        const parts = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).formatToParts(new Date());

        const map = {};

        parts.forEach(part => {
          if (part.type !== "literal") map[part.type] = part.value;
        });

        if (map.year && map.month && map.day) {
          return `${map.year}-${map.month}-${map.day}`;
        }
      } catch (error) {
        console.warn("Không lấy được ngày Việt Nam:", error);
      }

      const now = new Date();

      return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-");
    }

    function getTodayDateString() {
      return getTodayVietnamDate();
    }

    // Ô ngày trống vẫn được hiểu là hôm nay, không tự điền vào ô.
    function getCurrentFilterDate() {
      return filterDate?.value?.trim() || getTodayVietnamDate();
    }

    /* ============================================================
       9. TẢI DỮ LIỆU BẢNG QUẢN LÝ
    ============================================================ */
    async function loadData(preserveCurrentFilter = true) {
      if (!managerBox) return;

      setManagerMessage("Đang tải dữ liệu...", false);

      try {
        const allRows = [];
        let from = 0;
        const batchSize = 1000;

        while (true) {
          const { data, error } = await supabaseClient
            .from("bao_cao_ngay")
            .select("*")
            .order("field_date", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, from + batchSize - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          allRows.push(...data);

          if (data.length < batchSize) break;
          from += batchSize;
        }

        allData = allRows;

        if (!preserveCurrentFilter) clearDateFilter();

        currentPage = 1;
        applyFilter(false);

        setManagerMessage(`Đã tải ${allData.length} báo cáo.`, false);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setManagerMessage(
          "Tải dữ liệu thất bại: " +
            (error?.message || "Lỗi không xác định"),
          true
        );
      }
    }

    /* ============================================================
       10. CHUẨN HÓA USER VÀ NGÀY
    ============================================================ */
    function normalizeUserName(value) {
      return String(value ?? "")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\s+/g, "")
        .toLowerCase()
        .trim();
    }

    function getFieldDateKey(value) {
      if (!value) return "";

      const text = String(value).trim();
      const direct = text.match(/^(\d{4}-\d{2}-\d{2})/);

      if (direct) return direct[1];

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) return "";

      return [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
      ].join("-");
    }

    function getSubmittedUserDate() {
      return getCurrentFilterDate();
    }

    /* ============================================================
       11. ĐẾM CÁN BỘ ĐÃ NHẬP BÁO CÁO
    ============================================================ */
    function updateSubmittedUserCount() {
      if (!submittedUserCount) return;

      const targetDate = getSubmittedUserDate();
      const uniqueUsers = new Set();

      allData.forEach(row => {
        if (getFieldDateKey(row.field_date) !== targetDate) return;

        const userKey = normalizeUserName(row.user_name);
        if (userKey) uniqueUsers.add(userKey);
      });

      submittedUserCount.textContent = String(uniqueUsers.size);
    }

    /* ============================================================
       12. LỌC DỮ LIỆU
    ============================================================ */
    function applyFilter(showMessage = true) {
      const userKeyword = filterUser?.value?.trim() || "";
      const selectedDate = getCurrentFilterDate();
      const normalizedKeyword = normalizeUserName(userKeyword);

      filteredData = allData.filter(row => {
        if (normalizedKeyword) {
          const rowUser = normalizeUserName(row.user_name);
          if (!rowUser.includes(normalizedKeyword)) return false;
        }

        if (getFieldDateKey(row.field_date) !== selectedDate) {
          return false;
        }

        return true;
      });

      currentPage = 1;
      updateStats();
      render();

      if (showMessage) {
        setManagerMessage(
          `Đang hiển thị ${filteredData.length} báo cáo ngày ${formatDate(selectedDate)}.`,
          false
        );
      }
    }

    /* ============================================================
       13. THỐNG KÊ
    ============================================================ */
    function updateStats() {
      if (totalReports) {
        totalReports.textContent =
          filteredData.length.toLocaleString("vi-VN");
      }

      let total = 0;

      filteredData.forEach(row => {
        total += parseAmount(row.expected_amount);
      });

      if (totalAmount) totalAmount.textContent = formatMoney(total);

      updateSubmittedUserCount();
    }

    /* ============================================================
       14. HIỂN THỊ BẢNG
    ============================================================ */
    function render() {
      if (!tableBody) return;

      tableBody.innerHTML = "";

      const totalPages = Math.max(
        1,
        Math.ceil(filteredData.length / PAGE_SIZE)
      );

      if (currentPage > totalPages) currentPage = totalPages;

      const start = (currentPage - 1) * PAGE_SIZE;
      const pageData = filteredData.slice(start, start + PAGE_SIZE);

      if (pageData.length === 0) {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td colspan="10" style="text-align:center;padding:30px;">
            Không có dữ liệu trong ngày này.
          </td>
        `;

        tableBody.appendChild(tr);
        renderPagination();
        return;
      }

      pageData.forEach(row => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
          <td>${escapeHtml(row.user_name)}</td>
          <td>${escapeHtml(formatDate(row.field_date))}</td>
          <td>${escapeHtml(row.cif)}</td>
          <td>${escapeHtml(row.customer_name)}</td>
          <td>${escapeHtml(row.result)}</td>
          <td>${escapeHtml(row.connection)}</td>
          <td>${escapeHtml(row.detail)}</td>
          <td style="text-align:right;">${formatMoney(row.expected_amount)}</td>
          <td>${escapeHtml(row.next_action)}</td>
          <td>
            <div class="action-buttons">
              <button type="button" class="edit-btn"
                onclick="editReport('${escapeJs(row.id)}')" title="Sửa">✏️</button>
              <button type="button" class="delete-btn"
                onclick="deleteReport('${escapeJs(row.id)}')" title="Xóa">🗑️</button>
            </div>
          </td>
        `;

        tableBody.appendChild(tr);
      });

      renderPagination();
    }

    /* ============================================================
       15. PHÂN TRANG
    ============================================================ */
    function renderPagination() {
      if (!pagination) return;

      pagination.innerHTML = "";

      const totalPages = Math.max(
        1,
        Math.ceil(filteredData.length / PAGE_SIZE)
      );

      if (totalPages <= 1) return;

      const prevBtn = document.createElement("button");
      prevBtn.type = "button";
      prevBtn.textContent = "‹ Trước";
      prevBtn.disabled = currentPage <= 1;

      prevBtn.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          render();
        }
      });

      pagination.appendChild(prevBtn);

      const pageInfo = document.createElement("span");
      pageInfo.textContent = ` Trang ${currentPage} / ${totalPages} `;
      pagination.appendChild(pageInfo);

      const nextBtn = document.createElement("button");
      nextBtn.type = "button";
      nextBtn.textContent = "Sau ›";
      nextBtn.disabled = currentPage >= totalPages;

      nextBtn.addEventListener("click", () => {
        if (currentPage < totalPages) {
          currentPage++;
          render();
        }
      });

      pagination.appendChild(nextBtn);
    }

    /* ============================================================
       16. SỬA BÁO CÁO
    ============================================================ */
    window.editReport = async function(id) {
      const row = allData.find(item => String(item.id) === String(id));

      if (!row) {
        alert("Không tìm thấy báo cáo.");
        return;
      }

      openEditModal(row);
    };

    function openEditModal(row) {
      document.getElementById("editReportModal")?.remove();

      const modal = document.createElement("div");
      modal.id = "editReportModal";
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,.55);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;padding:15px;
      `;

      const box = document.createElement("div");
      box.style.cssText = `
        width:min(650px,100%);max-height:90vh;overflow-y:auto;
        background:#fff;border-radius:16px;padding:20px;
        box-shadow:0 20px 60px rgba(0,0,0,.25);
      `;

      box.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
          <h3 style="margin:0;">Sửa báo cáo</h3>
          <button type="button" id="closeEditModal"
            style="border:0;background:none;font-size:24px;cursor:pointer;">×</button>
        </div>

        <div style="display:grid;gap:12px;">
          <label><div>User cán bộ</div>
            <input id="editUserName" type="text" value="${escapeAttribute(row.user_name)}"
              style="width:100%;padding:10px;">
          </label>

          <label><div>Ngày báo cáo</div>
            <input id="editFieldDate" type="date"
              value="${escapeAttribute(formatDateForInput(row.field_date))}"
              style="width:100%;padding:10px;">
          </label>

          <label><div>CIF</div>
            <input id="editCif" type="text" value="${escapeAttribute(row.cif)}"
              style="width:100%;padding:10px;">
          </label>

          <label><div>Tên khách hàng</div>
            <input id="editCustomerName" type="text"
              value="${escapeAttribute(row.customer_name)}"
              style="width:100%;padding:10px;">
          </label>

          <label><div>Kết quả</div>
            <select id="editResult" style="width:100%;padding:10px;"></select>
          </label>

          <label><div>Quan hệ / Kết nối</div>
            <select id="editConnection" style="width:100%;padding:10px;"></select>
          </label>

          <label><div>Chi tiết</div>
            <textarea id="editDetail" rows="4"
              style="width:100%;padding:10px;">${escapeHtml(row.detail || "")}</textarea>
          </label>

          <label><div>Số tiền dự kiến</div>
            <input id="editExpectedAmount" type="text"
              value="${escapeAttribute(formatMoney(row.expected_amount))}"
              style="width:100%;padding:10px;">
          </label>

          <label><div>Hành động tiếp theo</div>
            <textarea id="editNextAction" rows="3"
              style="width:100%;padding:10px;">${escapeHtml(row.next_action || "")}</textarea>
          </label>

          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:5px;">
            <button type="button" id="cancelEditBtn"
              style="padding:10px 18px;border:1px solid #ccc;border-radius:8px;background:#fff;cursor:pointer;">
              Hủy
            </button>
            <button type="button" id="saveEditBtn"
              style="padding:10px 18px;border:0;border-radius:8px;background:#2563eb;color:#fff;cursor:pointer;">
              Lưu
            </button>
          </div>
        </div>
      `;

      modal.appendChild(box);
      document.body.appendChild(modal);

      const resultSelect = document.getElementById("editResult");
      const connectionSelect = document.getElementById("editConnection");

      ["Sống", "Chết"].forEach(option => {
        resultSelect.appendChild(createOption(option, row.result));
      });

      [
        "KH",
        "Vợ-Chồng",
        "Ba-Mẹ",
        "Con",
        "Anh-Chị",
        "Hàng xóm",
        "Chính quyền địa phương",
        "Không gặp ai",
        "Bán nhà",
        "Chưa tìm được nhà"
      ].forEach(option => {
        connectionSelect.appendChild(
          createOption(option, row.connection)
        );
      });

      const amountInput = document.getElementById("editExpectedAmount");

      amountInput?.addEventListener("input", () => {
        const raw = amountInput.value.replace(/\D/g, "");

        amountInput.value = raw
          ? Number(raw).toLocaleString("vi-VN")
          : "";
      });

      document.getElementById("closeEditModal")?.addEventListener(
        "click",
        () => modal.remove()
      );

      document.getElementById("cancelEditBtn")?.addEventListener(
        "click",
        () => modal.remove()
      );

      modal.addEventListener("click", event => {
        if (event.target === modal) modal.remove();
      });

      document.getElementById("saveEditBtn")?.addEventListener(
        "click",
        () => saveEditReport(row.id, modal)
      );
    }

    function createOption(value, selectedValue) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;

      if (String(value) === String(selectedValue ?? "")) {
        option.selected = true;
      }

      return option;
    }

    /* ============================================================
       17. LƯU SỬA BÁO CÁO
    ============================================================ */
    async function saveEditReport(id, modal) {
      const userName =
        document.getElementById("editUserName")?.value?.trim() || "";
      const fieldDate =
        document.getElementById("editFieldDate")?.value?.trim() || "";
      const cif =
        document.getElementById("editCif")?.value?.trim() || "";
      const customerName =
        document.getElementById("editCustomerName")?.value?.trim() || "";
      const result = document.getElementById("editResult")?.value || "";
      const connection =
        document.getElementById("editConnection")?.value || "";
      const detail =
        document.getElementById("editDetail")?.value?.trim() || "";
      const amountText =
        document.getElementById("editExpectedAmount")?.value || "";
      const nextAction =
        document.getElementById("editNextAction")?.value?.trim() || "";

      if (!userName) {
        alert("Vui lòng nhập User cán bộ.");
        return;
      }

      if (!fieldDate) {
        alert("Vui lòng chọn ngày báo cáo.");
        return;
      }

      if (!cif) {
        alert("Vui lòng nhập CIF.");
        return;
      }

      const saveBtn = document.getElementById("saveEditBtn");

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = "Đang lưu...";
      }

      try {
        const { error } = await supabaseClient
          .from("bao_cao_ngay")
          .update({
            user_name: userName,
            field_date: fieldDate,
            cif,
            customer_name: customerName,
            result,
            connection,
            detail,
            expected_amount: parseAmount(amountText),
            next_action: nextAction
          })
          .eq("id", id);

        if (error) throw error;

        modal?.remove();
        setManagerMessage("Đã cập nhật báo cáo.", false);
        await loadData(true);
      } catch (error) {
        console.error("Lỗi cập nhật:", error);
        alert(
          "Cập nhật thất bại:\n" +
            (error?.message || "Lỗi không xác định")
        );
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.textContent = "Lưu";
        }
      }
    }

    /* ============================================================
       18. XÓA MỘT BÁO CÁO
    ============================================================ */
    window.deleteReport = async function(id) {
      const row = allData.find(item => String(item.id) === String(id));

      const customer = row?.customer_name
        ? `\nKhách hàng: ${row.customer_name}`
        : "";

      if (!confirm("Bạn có chắc muốn xóa báo cáo này?" + customer)) {
        return;
      }

      try {
        const { error } = await supabaseClient
          .from("bao_cao_ngay")
          .delete()
          .eq("id", id);

        if (error) throw error;

        setManagerMessage("Đã xóa báo cáo.", false);
        await loadData(true);
      } catch (error) {
        console.error("Lỗi xóa báo cáo:", error);
        alert(
          "Xóa thất bại:\n" +
            (error?.message || "Lỗi không xác định")
        );
      }
    };

    /* ============================================================
       19. XÓA TOÀN BỘ BÁO CÁO
    ============================================================ */
    async function deleteAllReports() {
      if (!confirm("Bạn có chắc chắn muốn XÓA TOÀN BỘ BÁO CÁO không?")) {
        return;
      }

      const answer = prompt(
        "Để xác nhận xóa toàn bộ, hãy nhập:\n\nXOA TAT CA"
      );

      if (normalizeDeleteConfirm(answer) !== "XOATATCA") {
        alert("Xác nhận không chính xác. Đã hủy.");
        return;
      }

      if (deleteAllBtn) deleteAllBtn.disabled = true;

      try {
        const { error } = await supabaseClient
          .from("bao_cao_ngay")
          .delete()
          .not("id", "is", null);

        if (error) throw error;

        allData = [];
        filteredData = [];
        currentPage = 1;

        if (tableBody) tableBody.innerHTML = "";
        if (pagination) pagination.innerHTML = "";
        if (totalReports) totalReports.textContent = "0";
        if (totalAmount) totalAmount.textContent = "0";
        if (submittedUserCount) submittedUserCount.textContent = "0";

        clearDateFilter();
        setManagerMessage("Đã xóa toàn bộ báo cáo.", false);
      } catch (error) {
        console.error("Lỗi xóa toàn bộ:", error);
        alert(
          "Xóa toàn bộ thất bại:\n" +
            (error?.message || "Lỗi không xác định")
        );
      } finally {
        if (deleteAllBtn) deleteAllBtn.disabled = false;
      }
    }

    function normalizeDeleteConfirm(value) {
      return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
        .toUpperCase();
    }

    /* ============================================================
       20. DANH SÁCH CÁN BỘ ĐÃ NHẬP
    ============================================================ */
    function showSubmittedUsers() {
      const targetDate = getSubmittedUserDate();
      const usersMap = new Map();

      allData.forEach(row => {
        if (getFieldDateKey(row.field_date) !== targetDate) return;

        const key = normalizeUserName(row.user_name);
        if (!key) return;

        if (!usersMap.has(key)) {
          usersMap.set(key, {
            displayName: String(row.user_name ?? "").trim() || key,
            count: 1
          });
        } else {
          usersMap.get(key).count++;
        }
      });

      const users = Array.from(usersMap.values()).sort((a, b) =>
        a.displayName.localeCompare(b.displayName, "vi")
      );

      const modal = document.createElement("div");
      modal.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,.55);
        display:flex;align-items:center;justify-content:center;
        z-index:99999;padding:15px;
      `;

      const box = document.createElement("div");
      box.style.cssText = `
        width:min(500px,100%);max-height:85vh;overflow-y:auto;
        background:#fff;border-radius:16px;padding:20px;
        box-shadow:0 20px 60px rgba(0,0,0,.25);
      `;

      const dateDisplay = formatDate(targetDate);

      let listHtml = "";

      if (users.length === 0) {
        listHtml = `
          <div style="text-align:center;padding:25px;color:#666;">
            Không có cán bộ nào nhập báo cáo trong ngày
            ${escapeHtml(dateDisplay)}.
          </div>
        `;
      } else {
        listHtml = users.map((item, index) => `
          <div style="
            display:flex;align-items:center;justify-content:space-between;
            gap:10px;padding:10px 0;border-bottom:1px solid #eee;
          ">
            <div>
              <strong>${index + 1}. ${escapeHtml(item.displayName)}</strong>
            </div>
            <div style="font-size:13px;color:#666;white-space:nowrap;">
              ${item.count} báo cáo
            </div>
          </div>
        `).join("");
      }

      box.innerHTML = `
        <div style="
          display:flex;justify-content:space-between;align-items:center;
          gap:10px;margin-bottom:10px;
        ">
          <div>
            <h3 style="margin:0 0 5px 0;">Cán bộ đã nhập báo cáo</h3>
            <div style="font-size:14px;color:#666;">
              Ngày ${escapeHtml(dateDisplay)}
            </div>
          </div>
          <button type="button" id="closeSubmittedUsers"
            style="border:0;background:none;font-size:25px;cursor:pointer;">×</button>
        </div>

        <div style="
          margin:12px 0;padding:10px 12px;background:#f3f4f6;
          border-radius:10px;font-weight:600;
        ">
          Tổng số: ${users.length} cán bộ
        </div>

        <div>${listHtml}</div>
      `;

      modal.appendChild(box);
      document.body.appendChild(modal);

      document.getElementById("closeSubmittedUsers")?.addEventListener(
        "click",
        () => modal.remove()
      );

      modal.addEventListener("click", event => {
        if (event.target === modal) modal.remove();
      });
    }

    /* ============================================================
       21. MENU
    ============================================================ */
    function openSideMenu() {
      sideMenu?.classList.add("open");
      sideMenuOverlay?.classList.add("open");
    }

    function closeSideMenu() {
      sideMenu?.classList.remove("open");
      sideMenuOverlay?.classList.remove("open");
    }

    /* ============================================================
       22. XUẤT EXCEL THEO BỘ LỌC HIỆN TẠI
       GIỮ NGUYÊN CHỨC NĂNG CŨ
    ============================================================ */
    function exportExcel() {
      if (typeof XLSX === "undefined") {
        alert("Không tìm thấy thư viện XLSX.");
        return;
      }

      if (filteredData.length === 0) {
        alert("Không có dữ liệu để xuất Excel.");
        return;
      }

      try {
        const exportDate = getCurrentFilterDate();

        exportRowsToExcel(
          filteredData,
          "BaoCaoNgay",
          `Bao_Cao_Ngay_${exportDate}.xlsx`,
          "Đã xuất Excel thành công."
        );
      } catch (error) {
        console.error("Lỗi xuất Excel:", error);
        alert(
          "Xuất Excel thất bại:\n" +
            (error?.message || "Lỗi không xác định")
        );
      }
    }

    /* ============================================================
       23. XUẤT TOÀN BỘ BÁO CÁO THÁNG HIỆN TẠI
       LẤY TRỰC TIẾP TỪ SUPABASE, KHÔNG PHỤ THUỘC BỘ LỌC
    ============================================================ */
    async function exportCurrentMonthExcel() {
      if (typeof XLSX === "undefined") {
        alert("Không tìm thấy thư viện XLSX.");
        return;
      }

      if (exportMonthBtn) {
        exportMonthBtn.disabled = true;
        exportMonthBtn.textContent = "ĐANG LẤY DỮ LIỆU...";
      }

      setManagerMessage("Đang tải toàn bộ báo cáo tháng...", false);

      try {
        // Lấy tháng hiện tại theo giờ Việt Nam.
        const today = getTodayVietnamDate();
        const [year, month] = today.split("-").map(Number);

        const monthKey = `${year}-${String(month).padStart(2, "0")}`;
        const monthStart = `${monthKey}-01`;

        // Ngày đầu tháng kế tiếp, dùng làm mốc kết thúc không bao gồm.
        const nextYear = month === 12 ? year + 1 : year;
        const nextMonth = month === 12 ? 1 : month + 1;

        const nextMonthStart =
          `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

        const monthlyRows = [];
        let from = 0;
        const batchSize = 1000;

        // Tải theo từng đợt, không giới hạn ở 1.000 dòng đầu.
        while (true) {
          const { data, error } = await supabaseClient
            .from("bao_cao_ngay")
            .select("*")
            .gte("field_date", monthStart)
            .lt("field_date", nextMonthStart)
            .order("field_date", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, from + batchSize - 1);

          if (error) throw error;
          if (!data || data.length === 0) break;

          monthlyRows.push(...data);

          if (data.length < batchSize) break;
          from += batchSize;
        }

        if (monthlyRows.length === 0) {
          setManagerMessage(
            `Không có báo cáo trong tháng ${monthKey}.`,
            true
          );
          alert(`Không có báo cáo trong tháng ${monthKey}.`);
          return;
        }

        exportRowsToExcel(
          monthlyRows,
          "BaoCaoThang",
          `Bao_Cao_Thang_${monthKey}.xlsx`,
          `Đã xuất ${monthlyRows.length} báo cáo tháng ${monthKey}.`
        );
      } catch (error) {
        console.error("Lỗi xuất báo cáo tháng:", error);

        setManagerMessage(
          "Xuất báo cáo tháng thất bại: " +
            (error?.message || "Lỗi không xác định"),
          true
        );

        alert(
          "Xuất báo cáo tháng thất bại:\n" +
            (error?.message || "Lỗi không xác định")
        );
      } finally {
        if (exportMonthBtn) {
          exportMonthBtn.disabled = false;
          exportMonthBtn.textContent = "📅 XUẤT BÁO CÁO THÁNG";
        }
      }
    }

    /* ============================================================
       24. HÀM TẠO FILE EXCEL DÙNG CHUNG
       ÁP DỤNG CHO XUẤT NGÀY VÀ XUẤT THÁNG
    ============================================================ */
    function exportRowsToExcel(rows, sheetName, fileName, successMessage) {
      if (typeof XLSX === "undefined") {
        throw new Error("Không tìm thấy thư viện XLSX.");
      }

      const exportRows = rows.map(row => ({
        "User cán bộ": row.user_name || "",
        "Ngày": toExcelDate(row.field_date),
        "CIF": row.cif || "",
        "Tên khách hàng": row.customer_name || "",
        "Kết quả": row.result || "",
        "Kết nối": row.connection || "",
        "Chi tiết": row.detail || "",
        "Số tiền dự kiến": parseAmount(row.expected_amount),
        "Hành động tiếp theo": row.next_action || ""
      }));

      const ws = XLSX.utils.json_to_sheet(exportRows);

      if (ws["!ref"]) {
        const range = XLSX.utils.decode_range(ws["!ref"]);

        // Định dạng cột ngày.
        for (let r = range.s.r + 1; r <= range.e.r; r++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c: 1 })];

          if (cell && cell.v instanceof Date) {
            cell.t = "d";
            cell.z = "dd/mm/yyyy";
          }
        }

        // Định dạng cột số tiền.
        for (let r = range.s.r + 1; r <= range.e.r; r++) {
          const cell = ws[XLSX.utils.encode_cell({ r, c: 7 })];

          if (cell) cell.z = "#,##0";
        }

        ws["!autofilter"] = { ref: ws["!ref"] };
      }

      ws["!cols"] = [
        { wch: 18 },
        { wch: 13 },
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 24 },
        { wch: 45 },
        { wch: 20 },
        { wch: 35 }
      ];

      ws["!freeze"] = { xSplit: 0, ySplit: 1 };

      // Tổng hợp số cán bộ duy nhất, không phân biệt hoa/thường.
      const uniqueUsers = new Set();

      rows.forEach(row => {
        const key = normalizeUserName(row.user_name);
        if (key) uniqueUsers.add(key);
      });

      let exportTotal = 0;

      rows.forEach(row => {
        exportTotal += parseAmount(row.expected_amount);
      });

      const summaryRows = [
        {
          "Nội dung": "Tổng số báo cáo",
          "Giá trị": rows.length
        },
        {
          "Nội dung": "Số cán bộ",
          "Giá trị": uniqueUsers.size
        },
        {
          "Nội dung": "Tổng số tiền dự kiến",
          "Giá trị": exportTotal
        }
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      wsSummary["!cols"] = [
        { wch: 30 },
        { wch: 25 }
      ];

      if (wsSummary["B4"]) {
        wsSummary["B4"].z = "#,##0";
      }

      const workbook = XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      XLSX.utils.book_append_sheet(workbook, wsSummary, "TongQuan");

      XLSX.writeFile(workbook, fileName);

      setManagerMessage(successMessage, false);
    }

    /* ============================================================
       25. FORMAT NGÀY
    ============================================================ */
    function formatDate(value) {
      if (!value) return "";

      const key = getFieldDateKey(value);
      if (!key) return "";

      const parts = key.split("-");
      if (parts.length !== 3) return key;

      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    function formatDateForInput(value) {
      if (!value) return "";
      return getFieldDateKey(value) || "";
    }

    function formatDateTime(value) {
      if (!value) return "";

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      return date.toLocaleString("vi-VN");
    }

    /* ============================================================
       26. XỬ LÝ SỐ TIỀN
    ============================================================ */
    function parseAmount(value) {
      if (value === null || value === undefined || value === "") {
        return 0;
      }

      if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
      }

      const text = String(value).replace(/[^\d-]/g, "");
      if (!text) return 0;

      const number = Number(text);
      return Number.isFinite(number) ? number : 0;
    }

    function formatMoney(value) {
      return parseAmount(value).toLocaleString("vi-VN");
    }

    function toExcelDate(value) {
      if (!value) return "";

      const key = getFieldDateKey(value);

      if (key) {
        const [year, month, day] = key.split("-").map(Number);
        return new Date(year, month - 1, day);
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "";

      return date;
    }

    /* ============================================================
       27. ESCAPE HTML / ATTRIBUTE / JAVASCRIPT
    ============================================================ */
    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function escapeAttribute(value) {
      return escapeHtml(value);
    }

    function escapeJs(value) {
      return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
    }

    /* ============================================================
       28. THÔNG BÁO
    ============================================================ */
    function setLoginMessage(message, isError) {
      if (!loginMessage) return;

      loginMessage.textContent = message || "";
      loginMessage.style.color = isError ? "#dc2626" : "#16a34a";
    }

    function setManagerMessage(message, isError) {
      if (!managerMessage) return;

      managerMessage.textContent = message || "";
      managerMessage.style.color = isError ? "#dc2626" : "#16a34a";
    }
  }

  /* ============================================================
     29. CHỜ HTML TẢI XONG
  ============================================================ */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initManager, {
      once: true
    });
  } else {
    initManager();
  }
})();
