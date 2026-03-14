/**
 * calendar.js — FIXED VERSION
 * 
 * CHANGES:
 *  ✅ Added detailed console logging for debugging
 *  ✅ Improved date format handling
 *  ✅ Better error messages
 *  ✅ Handles edge cases where summaries might be empty
 *  ✅ FIX: showDateDetails now uses debts_paid from API response (PaymentHistory)
 *          instead of querying live DB.getDebtors() — so deleted debtors still appear
 */

console.log('📅 Loading calendar module...');

// =============================================================================
//  1. GLOBAL STATE
// =============================================================================

let currentYear  = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11
let calendarData = {};
let paidDebtDates = new Set(); // dates (YYYY-MM-DD) that have at least one paid debt

// =============================================================================
//  2. RENDER CALENDAR PAGE (IMPROVED)
// =============================================================================

/** Fetch the month's DailySummary data and render the header + grid. */
async function renderCalendar() {
  const content = document.getElementById('calendarContent');

  content.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <div style="font-size: 48px; animation: spin 1s linear infinite;">📅</div>
      <p style="color: #666; margin-top: 10px;">Loading calendar...</p>
    </div>
    <style>
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    </style>
  `;

  try {
    console.log(`🔄 Fetching calendar data for ${currentYear}-${String(currentMonth + 1).padStart(2, '0')}...`);
    const data = await DB.getCalendarData(currentYear, currentMonth + 1);

    console.log('📅 Raw API response:', data);

    // ✅ IMPROVED: Better data structure handling
    calendarData = {};
    paidDebtDates = new Set(data.paid_debt_dates || []);
    if (data.summaries && Array.isArray(data.summaries)) {
      data.summaries.forEach(summary => {
        let dateStr = summary.date || summary.date_str || '';
        
        if (!dateStr) {
          console.warn('⚠️ Summary missing date field:', summary);
          return;
        }

        const revenue = parseFloat(summary.total_revenue || 0);
        const profit = parseFloat(summary.total_profit || 0);
        const count = parseInt(summary.transaction_count || 0);

        calendarData[dateStr] = {
          date:              dateStr,
          total_revenue:     revenue,
          total_profit:      profit,
          transaction_count: count
        };

        if (revenue > 0) {
          console.log(`✅ ${dateStr}: ₱${revenue.toFixed(2)} (${count} tx)`);
        }
      });
    } else {
      console.warn('⚠️ No summaries array in response:', data);
    }

    const datesWithSales = Object.keys(calendarData).filter(d => calendarData[d].total_revenue > 0);
    console.log(`📊 Total dates with sales: ${datesWithSales.length}`);

    const html = `
      <div class="calendar-container">

        <!-- ── Retention Warning Banner ── -->
        <div class="calendar-retention-banner">
          <span class="retention-icon">⚠️</span>
          <span class="retention-text">
          Calendar summaries are preserved here for <strong>1 year</strong>.
            To free up space, use the <strong>Clear Month</strong> button below or the 
            <strong>Clear Transaction History</strong> button on the 📊 Sales page.
          </span>
        </div>

        <!-- ── Month Navigation ── -->
        <div class="calendar-nav">
          <button class="calendar-nav-btn" id="prevMonth"><span>←</span></button>
          <h3 class="calendar-month-title" id="monthTitle">
            ${getMonthName(currentMonth)} ${currentYear}
          </h3>
          <button class="calendar-nav-btn" id="nextMonth"><span>→</span></button>
        </div>

        <!-- ── Jump to Date ── -->
        <div class="calendar-jump-row">
          <span class="jump-label">📅 Go to:</span>
          <select id="jumpMonth" class="jump-select">
            ${['January','February','March','April','May','June',
               'July','August','September','October','November','December']
              .map((m, i) => `<option value="${i}" ${i === currentMonth ? 'selected' : ''}>${m}</option>`)
              .join('')}
          </select>
          <input id="jumpYear" class="jump-input" type="number"
                 value="${currentYear}" min="2000" max="2099" />
          <button id="jumpGoBtn" class="jump-go-btn">Go</button>
        </div>

        <!-- ── Calendar Grid ── -->
        <div class="calendar-grid-container">
          ${renderCalendarGrid()}
        </div>

        <!-- ── Legend ── -->
        <div class="calendar-legend">
          <div class="legend-item">
            <div class="legend-color" style="background: linear-gradient(135deg, #D1FAE5, #A7F3D0);"></div>
            <span>&lt; ₱500</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: linear-gradient(135deg, #A7F3D0, #6EE7B7);"></div>
            <span>₱500 – ₱2,000</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: linear-gradient(135deg, #6EE7B7, #34D399);"></div>
            <span>&gt; ₱2,000</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background: #f5f5f0; border: 1px dashed #ccc;"></div>
            <span>No Sales</span>
          </div>
          <div class="legend-item">
            <div style="font-size:14px; line-height:1;">💚</div>
            <span>Debt Paid</span>
          </div>
        </div>

        <!-- ── Clear Month Button ── -->
        <div style="text-align:center; margin-top:20px;">
          <button onclick="clearMonthSales()"
            style="padding:10px 22px; background:var(--btn-red-bg); color:var(--btn-red-text);
                   border:none; border-radius:12px; font-weight:700; font-size:13px; cursor:pointer;
                   box-shadow:var(--btn-red-shadow); transition:all 0.2s ease;">
            🗑️ Clear ${getMonthName(currentMonth)} ${currentYear} Sales Records
          </button>
        </div>

      </div>

      <style>
        /* ────────────────────────────────────────────
           Jump to date row
        ──────────────────────────────────────────── */
        .calendar-jump-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: -6px 0 20px;
          flex-wrap: wrap;
        }
        .jump-label {
          font-size: 13px;
          font-weight: 700;
          color: #5d9458;
          letter-spacing: 0.3px;
        }
        .jump-select,
        .jump-input {
          padding: 9px 14px;
          border-radius: 12px;
          border: 1.5px solid rgba(135,179,130,0.4);
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(8px);
          font-size: 13px;
          font-weight: 700;
          color: #2d4d28;
          outline: none;
          box-shadow: 0 2px 8px rgba(93,148,86,0.10);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .jump-input {
          width: 82px;
          text-align: center;
        }
        .jump-select:focus,
        .jump-input:focus {
          border-color: #87B382;
          box-shadow: 0 0 0 3px rgba(135,179,130,0.20);
        }
        .jump-go-btn {
          padding: 9px 20px;
          border-radius: 12px;
          border: none;
          background: var(--btn-green-bg);
          color: var(--btn-green-text);
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: var(--btn-green-shadow);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .jump-go-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--btn-green-shadow-hover);
          background: var(--btn-green-hover);
        }
        .jump-go-btn:active { transform: translateY(0); }
        body.dark-mode .jump-select,
        body.dark-mode .jump-input {
          background: rgba(28,44,26,0.80);
          color: #c8ecc4;
          border-color: rgba(135,179,130,0.25);
        }
        body.dark-mode .jump-label { color: #87B382; }

        /* ── Retention warning banner ── */
        .calendar-retention-banner {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 16px;
          margin-bottom: 18px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(251,191,36,0.12), rgba(245,158,11,0.08));
          border: 1.5px solid rgba(245,158,11,0.30);
          backdrop-filter: blur(8px);
        }
        .retention-icon { font-size: 18px; flex-shrink: 0; line-height: 1.4; }
        .retention-text {
          font-size: 12px;
          color: #92400e;
          line-height: 1.5;
          font-weight: 500;
        }
        .retention-text strong { font-weight: 800; }
        body.dark-mode .calendar-retention-banner {
          background: linear-gradient(135deg, rgba(120,80,0,0.25), rgba(100,60,0,0.15));
          border-color: rgba(245,158,11,0.20);
        }
        body.dark-mode .retention-text { color: #fbbf24; }
      </style>
    `;

    content.innerHTML = html;

    // ── Wire up navigation & jump controls ──────────────────────────────────
    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));

    const jumpGo    = document.getElementById('jumpGoBtn');
    const jumpYear  = document.getElementById('jumpYear');
    const jumpMonth = document.getElementById('jumpMonth');

    if (jumpGo) {
      jumpGo.addEventListener('click', () => {
        const month = parseInt(jumpMonth.value);
        const year  = parseInt(jumpYear.value);
        if (!isNaN(month) && !isNaN(year) && year >= 2000 && year <= 2099) {
          currentMonth = month;
          currentYear  = year;
          renderCalendar();
        }
      });
    }

    if (jumpYear) {
      jumpYear.addEventListener('keydown', e => {
        if (e.key === 'Enter') jumpGo?.click();
      });
    }

    // ── Attach click listeners to date cells ────────────────────────────────
    document.querySelectorAll('.calendar-date-cell').forEach(cell => {
      const dateStr = cell.dataset.date;
      if (dateStr) cell.addEventListener('click', () => showDateDetails(dateStr));
    });

  } catch (error) {
    console.error('❌ Error rendering calendar:', error);
    content.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #DC2626;">
        <h2>⚠️ Error Loading Calendar</h2>
        <p>${error.message}</p>
        <button onclick="renderCalendar()"
          style="padding: 12px 24px; background: var(--btn-green-bg); color: var(--btn-green-text); border: none;
                 border-radius: 12px; cursor: pointer; font-weight: 700; margin-top: 15px;">
          Retry
        </button>
      </div>
    `;
  }
}

// =============================================================================
//  3. RENDER CALENDAR GRID (IMPROVED)
// =============================================================================

/**
 * Build the 7-column grid. Each day cell is colour-coded by revenue.
 */
function renderCalendarGrid() {
  const firstDay       = new Date(currentYear, currentMonth, 1);
  const lastDay        = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth    = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

  let html = `
    <div class="calendar-grid">
      <div class="calendar-day-header">Sun</div>
      <div class="calendar-day-header">Mon</div>
      <div class="calendar-day-header">Tue</div>
      <div class="calendar-day-header">Wed</div>
      <div class="calendar-day-header">Thu</div>
      <div class="calendar-day-header">Fri</div>
      <div class="calendar-day-header">Sat</div>
  `;

  for (let i = 0; i < startDayOfWeek; i++) {
    html += `<div class="calendar-date-cell empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr  = `${currentYear}-${String(currentMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const summary  = calendarData[dateStr];
    const isToday  = isTodayDate(currentYear, currentMonth, day);

    let cellClass  = 'calendar-date-cell';
    let revenue    = 0;
    let salesCount = 0;
    let colorClass = '';

    if (summary) {
      revenue    = parseFloat(summary.total_revenue || 0);
      salesCount = summary.transaction_count || 0;

      if (revenue > 0) {
        cellClass += ' has-sales';
        if (revenue < 500) {
          colorClass = 'revenue-low';
        } else if (revenue < 2000) {
          colorClass = 'revenue-medium';
        } else {
          colorClass = 'revenue-high';
        }
        cellClass += ` ${colorClass}`;
      }
    }

    if (isToday) cellClass += ' today';

    const hasPaidDebt = paidDebtDates.has(dateStr);

    html += `
      <div class="${cellClass}" data-date="${dateStr}" title="Click for details">
        <div class="date-day-number">${day}</div>
        ${revenue > 0 ? `
          <div class="date-revenue-amount">
            ₱${revenue.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div class="date-transaction-count">${salesCount}</div>
        ` : ''}
        ${hasPaidDebt ? `<div class="date-debt-badge" title="Debts paid on this day">💚</div>` : ''}
      </div>
    `;
  }

  html += `</div>

  <style>
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .calendar-day-header {
      text-align: center;
      font-weight: 700;
      color: #5d7066;
      font-size: 12px;
      padding: 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      border-bottom: 2px solid rgba(93, 112, 102, 0.15);
    }
    .calendar-date-cell {
      aspect-ratio: 1;
      border-radius: 18px;
      padding: 14px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      text-align: center;
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
      background: linear-gradient(135deg, rgba(255,255,255,0.45), rgba(255,255,255,0.15));
      backdrop-filter: blur(14px) saturate(1.4);
      -webkit-backdrop-filter: blur(14px) saturate(1.4);
      border: 1.5px solid rgba(255,255,255,0.55);
      box-shadow: 0 8px 32px rgba(80,140,75,0.12), 0 2px 8px rgba(80,140,75,0.08), 0 -1px 0 rgba(255,255,255,0.8) inset, 0 1px 0 rgba(80,140,75,0.1) inset;
      color: #2d3748;
    }
    .calendar-date-cell::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1.5px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent);
      border-radius: 20px;
      z-index: 2;
      pointer-events: none;
    }
    .calendar-date-cell.empty {
      cursor: default;
      background: transparent;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: none;
      box-shadow: none;
    }
    .calendar-date-cell.revenue-low {
      background: linear-gradient(135deg, rgba(209,250,229,0.55), rgba(167,243,208,0.35));
      border-color: rgba(110,231,183,0.4);
      box-shadow: 0 8px 32px rgba(52,211,153,0.18), 0 2px 8px rgba(52,211,153,0.1), 0 -1px 0 rgba(255,255,255,0.8) inset, 0 1px 0 rgba(52,211,153,0.12) inset;
      color: #065f46;
    }
    .calendar-date-cell.revenue-medium {
      background: linear-gradient(135deg, rgba(167,243,208,0.55), rgba(110,231,183,0.35));
      border-color: rgba(52,211,153,0.4);
      box-shadow: 0 8px 32px rgba(52,211,153,0.22), 0 2px 8px rgba(52,211,153,0.12), 0 -1px 0 rgba(255,255,255,0.8) inset, 0 1px 0 rgba(52,211,153,0.14) inset;
      color: #065f46;
    }
    .calendar-date-cell.revenue-high {
      background: linear-gradient(135deg, rgba(110,231,183,0.55), rgba(52,211,153,0.35));
      border-color: rgba(16,185,129,0.45);
      box-shadow: 0 8px 32px rgba(16,185,129,0.25), 0 2px 8px rgba(16,185,129,0.14), 0 -1px 0 rgba(255,255,255,0.85) inset, 0 1px 0 rgba(16,185,129,0.16) inset;
      color: #022c22;
    }
    .calendar-date-cell.has-sales:hover {
      transform: translateY(-6px) scale(1.02);
      border-color: rgba(16,185,129,0.6);
    }
    .calendar-date-cell.revenue-low:hover { box-shadow: 0 16px 48px rgba(52,211,153,0.28), 0 4px 14px rgba(52,211,153,0.16), 0 -1px 0 rgba(255,255,255,0.9) inset; }
    .calendar-date-cell.revenue-medium:hover { box-shadow: 0 16px 48px rgba(52,211,153,0.32), 0 4px 14px rgba(52,211,153,0.18), 0 -1px 0 rgba(255,255,255,0.9) inset; }
    .calendar-date-cell.revenue-high:hover { box-shadow: 0 16px 48px rgba(16,185,129,0.35), 0 4px 14px rgba(16,185,129,0.2), 0 -1px 0 rgba(255,255,255,0.9) inset; }
    .calendar-date-cell.has-sales:active { transform: translateY(-2px) scale(0.98); }
    .calendar-date-cell.today {
      border: 2.5px solid #f59e0b;
      box-shadow: 0 0 0 3px rgba(245,158,11,0.2), 0 8px 32px rgba(245,158,11,0.25), 0 2px 8px rgba(245,158,11,0.12), 0 -1px 0 rgba(255,255,255,0.9) inset;
    }
    .calendar-date-cell.today .date-day-number::after { content: ' ●'; color: #f59e0b; font-size: 9px; margin-left: 2px; }
    .date-day-number { font-size: 15px; font-weight: 700; color: inherit; margin-bottom: 3px; line-height: 1; letter-spacing: -0.3px; }
    .date-revenue-amount { font-size: 18px; font-weight: 900; color: inherit; line-height: 1; margin: 4px 0 2px; text-shadow: 0 1px 3px rgba(255,255,255,0.6); letter-spacing: -0.5px; }
    .date-transaction-count { font-size: 12px; font-weight: 700; color: inherit; opacity: 0.75; margin-top: 3px; }
    .date-debt-badge { font-size: 11px; line-height: 1; margin-top: 3px; }
    body.dark-mode .calendar-date-cell {
      background: linear-gradient(135deg, rgba(30,50,40,0.55), rgba(20,40,30,0.35));
      backdrop-filter: blur(14px) saturate(1.2);
      -webkit-backdrop-filter: blur(14px) saturate(1.2);
      border-color: rgba(16,185,129,0.25);
      box-shadow: 0 8px 32px rgba(16,185,129,0.15), 0 2px 8px rgba(16,185,129,0.08), 0 -1px 0 rgba(255,255,255,0.1) inset, 0 1px 0 rgba(16,185,129,0.08) inset;
      color: #c8ecc4;
    }
    body.dark-mode .calendar-date-cell.empty { background: transparent; backdrop-filter: none; border: none; }
    body.dark-mode .calendar-date-cell.has-sales { border-color: rgba(16,185,129,0.35); }
    body.dark-mode .calendar-date-cell.has-sales:hover { border-color: rgba(74,222,128,0.5); }
    body.dark-mode .calendar-day-header { color: #86efac; border-color: rgba(16,185,129,0.15); }
    @media (max-width: 900px) { .calendar-grid { gap: 10px; } .calendar-date-cell { border-radius: 16px; padding: 12px; } .date-day-number { font-size: 14px; } .date-revenue-amount { font-size: 16px; } .date-transaction-count { font-size: 11px; } }
    @media (max-width: 768px) { .calendar-grid { gap: 8px; } .calendar-date-cell { border-radius: 14px; padding: 11px; } .date-day-number { font-size: 13px; } .date-revenue-amount { font-size: 15px; } .date-transaction-count { font-size: 10px; } }
    @media (max-width: 480px) { .calendar-grid { gap: 6px; } .calendar-date-cell { border-radius: 12px; padding: 9px; } .date-day-number { font-size: 12px; } .date-revenue-amount { font-size: 14px; } .date-transaction-count { font-size: 9px; } }
  </style>`;
  
  return html;
}

// =============================================================================
//  4. CHANGE MONTH
// =============================================================================

async function changeMonth(direction) {
  currentMonth += direction;
  if      (currentMonth > 11) { currentMonth = 0;  currentYear++; }
  else if (currentMonth <  0) { currentMonth = 11; currentYear--; }
  await renderCalendar();
}

// =============================================================================
//  5. SHOW DATE DETAILS (fetch)
// =============================================================================

/**
 * ✅ FIX: Now uses debts_paid from the API response (backed by PaymentHistory)
 * instead of querying live DB.getDebtors(). This means deleted debtors
 * still show up in the calendar popup correctly.
 */
async function showDateDetails(dateStr) {
  console.log('📆 Showing details for:', dateStr);

  try {
    // Show loading state immediately
    showDateModal(dateStr, null, [], true);

    // ✅ Only fetch date details — PaymentHistory is already included in the response
    const details = await DB.getDateDetails(dateStr);

    if (!details) {
      showDateModal(dateStr, null, [], false);
      return;
    }

    // ✅ Use debts_paid from the API response (persists even after debtor deletion)
    const paidDebtors = details.debts_paid || [];
    console.log(`💚 Debts paid on ${dateStr}:`, paidDebtors.length);

    showDateModal(dateStr, details, paidDebtors, false);
  } catch (error) {
    console.error('❌ Error fetching date details:', error);
    showModernAlert('Failed to load date details. Please try again.', '❌');
  }
}

// =============================================================================
//  6. DATE DETAILS MODAL
// =============================================================================

function showDateModal(dateStr, details, paidDebtors, isLoading) {
  const existing = document.getElementById('dateDetailsModal');
  if (existing) existing.remove();

  const date          = new Date(dateStr + 'T00:00:00');
  const formattedDate = date.toLocaleDateString('en-PH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const overlay = document.createElement('div');
  overlay.id    = 'dateDetailsModal';

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    overlay.innerHTML = `
      <div class="date-modal-overlay">
        <div class="date-modal-box">
          <div class="modal-loading">
            <div class="loading-spinner">⏳</div>
            <p>Loading sales data...</p>
          </div>
        </div>
      </div>
    `;

  // ── No sales on this date ──────────────────────────────────────────────────
  } else if (!details || details.transaction_count === 0) {

    const paidBlock = buildPaidDebtorsHTML(paidDebtors || []);

    overlay.innerHTML = `
      <div class="date-modal-overlay" onclick="closeModal(event)">
        <div class="date-modal-box">
          <button class="modal-close-btn" onclick="closeModal()">✕</button>
          <div class="modal-header">
            <h2 class="modal-title">📅 ${formattedDate}</h2>
          </div>
          <div class="modal-body">
            <div class="empty-state">
              <div class="empty-icon">📭</div>
              <h3>No Sales Recorded</h3>
              <p>There were no transactions on this date.</p>
            </div>
            ${paidBlock}
          </div>
        </div>
      </div>
      ${modalPaidDebtorStyles()}
    `;

  // ── Full details ───────────────────────────────────────────────────────────
  } else {
    const revenue            = parseFloat(details.total_revenue       || 0);
    const profit             = parseFloat(details.total_profit        || 0);
    const salesCount         = details.transaction_count              || 0;
    const bestByQty          = details.best_seller_by_quantity        || 'N/A';
    const bestByQtyCount     = details.best_seller_quantity           || 0;
    const bestByProfit       = details.best_seller_by_profit          || 'N/A';
    const bestByProfitAmount = parseFloat(details.best_seller_profit  || 0);
    const productsList       = details.products_sold_list             || [];

    const paidBlock = buildPaidDebtorsHTML(paidDebtors || []);

    overlay.innerHTML = `
      <div class="date-modal-overlay" onclick="closeModal(event)">
        <div class="date-modal-box">
          <button class="modal-close-btn" onclick="closeModal()">✕</button>

          <div class="modal-header">
            <h2 class="modal-title">📅 ${formattedDate}</h2>
            <p class="modal-subtitle">
              <span class="transaction-badge">
                ${salesCount} transaction${salesCount !== 1 ? 's' : ''}
              </span>
            </p>
          </div>

          <div class="modal-body">
            <div class="modal-summary-grid">
              <div class="modal-summary-card revenue">
                <div class="summary-card-icon">💰</div>
                <div class="summary-card-content">
                  <div class="summary-card-label">Total Revenue</div>
                  <div class="summary-card-value">
                    ₱${revenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div class="modal-summary-card profit">
                <div class="summary-card-icon">📈</div>
                <div class="summary-card-content">
                  <div class="summary-card-label">Total Profit</div>
                  <div class="summary-card-value">
                    ₱${profit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-section">
              <h3 class="modal-section-title">🏆 Best Sellers</h3>
              <div class="best-sellers-grid">
                <div class="best-seller-card">
                  <div class="best-seller-badge quantity">📦 By Quantity</div>
                  <div class="best-seller-name">${bestByQty}</div>
                  <div class="best-seller-stat">
                    ${bestByQtyCount} unit${bestByQtyCount !== 1 ? 's' : ''} sold
                  </div>
                </div>
                <div class="best-seller-card">
                  <div class="best-seller-badge profit">💎 By Profit</div>
                  <div class="best-seller-name">${bestByProfit}</div>
                  <div class="best-seller-stat">
                    ₱${bestByProfitAmount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} earned
                  </div>
                </div>
              </div>
            </div>

            ${productsList.length > 0 ? `
              <div class="modal-section">
                <h3 class="modal-section-title">
                  📦 Products Sold
                  <span class="count-badge">${productsList.length}</span>
                </h3>
                <div class="products-list">
                  ${productsList.map((product, index) => {
                    const pProfit = parseFloat(product.profit || 0);
                    return `
                      <div class="product-list-item">
                        <div class="product-rank">${index + 1}</div>
                        <div class="product-info">
                          <div class="product-name">${product.name || 'Unknown'}</div>
                          <div class="product-stats">
                            <span class="product-quantity">
                              📦 ${product.quantity || 0} unit${(product.quantity || 0) !== 1 ? 's' : ''}
                            </span>
                            <span class="product-profit">
                              💰 ₱${pProfit.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>`;
                  }).join('')}
                </div>
              </div>
            ` : ''}

            ${paidBlock}

          </div>
        </div>
      </div>
      ${modalPaidDebtorStyles()}
    `;
  }

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
}

// =============================================================================
//  PAID DEBTORS BLOCK BUILDER
// =============================================================================

/**
 * Build the HTML for the "Debts Paid on This Day" section.
 * ✅ Now accepts debts_paid from PaymentHistory (works even after debtor deletion).
 * Each entry has: { id, customer_name, total_amount, items[] }
 */
function buildPaidDebtorsHTML(paidDebtors) {
  if (!paidDebtors || paidDebtors.length === 0) return '';

  const totalPaid = paidDebtors.reduce((sum, d) => {
    return sum + parseFloat(d.total_amount || d.total_debt || 0);
  }, 0);

  const items = paidDebtors.map(d => {
    const name   = d.customer_name || d.name || 'Unknown';
    const amount = parseFloat(d.total_amount || d.total_debt || 0);
    const initial = name.charAt(0).toUpperCase();
    const originalTotal    = parseFloat(d.original_total || 0);
    const surchargePercent = parseFloat(d.surcharge_percent || 0);
    const surchargeAmount  = parseFloat(d.surcharge_amount || 0);
    const hasSurcharge     = surchargeAmount > 0;

    // Format date_borrowed if available
    let borrowedDateStr = '';
    if (d.date_borrowed) {
      try {
        const bd = new Date(d.date_borrowed);
        borrowedDateStr = bd.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) { /* ignore */ }
    }

    // Items list
    let itemsList = '';
    try {
      const debtItems = d.items || [];
      if (debtItems.length > 0) {
        itemsList = debtItems.map(i => {
          const iName = i.product_name || i.name || 'Unknown';
          return `${iName} (×${i.quantity || 0})`;
        }).join(', ');
      }
    } catch (e) { /* ignore */ }

    return `
      <div class="mpd-item">
        <div class="mpd-avatar">${initial}</div>
        <div class="mpd-info">
          <div class="mpd-name">${name}</div>
          ${borrowedDateStr ? `<div class="mpd-borrowed">📅 Borrowed: ${borrowedDateStr}</div>` : ''}
          ${itemsList ? `<div class="mpd-items">${itemsList}</div>` : ''}
          ${hasSurcharge ? `
            <div class="mpd-surcharge-details">
              <span class="mpd-original">Original: ₱${originalTotal.toFixed(2)}</span>
              <span class="mpd-surcharge-tag">⚡ +${surchargePercent}% (₱${surchargeAmount.toFixed(2)})</span>
            </div>
          ` : ''}
        </div>
        <div class="mpd-amount">₱${amount.toFixed(2)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="modal-section mpd-section">
      <h3 class="modal-section-title mpd-title">
        ✅ Debts Paid on This Day
        <span class="count-badge mpd-badge">${paidDebtors.length}</span>
      </h3>
      <div class="mpd-receipt-top">
        <span>- - - - - - - - - - - - - - - - - - - - -</span>
      </div>
      <div class="mpd-list">
        ${items}
      </div>
      <div class="mpd-receipt-divider"></div>
      <div class="mpd-total-row">
        <span class="mpd-total-label">Total Collected</span>
        <span class="mpd-total-value">₱${totalPaid.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </div>
  `;
}

function modalPaidDebtorStyles() {
  return `
    <style>
      .mpd-section {
        margin-top: 20px;
        background: linear-gradient(135deg, rgba(220,252,231,0.6), rgba(187,247,208,0.4));
        border: 1.5px solid rgba(74,222,128,0.35);
        border-radius: 16px;
        padding: 16px;
        backdrop-filter: blur(8px);
      }
      body.dark-mode .mpd-section { background: rgba(20,50,30,0.55); border-color: rgba(74,222,128,0.20); }
      .mpd-title { color: #166534 !important; margin-bottom: 4px !important; }
      body.dark-mode .mpd-title { color: #4ade80 !important; }
      .mpd-badge { background: linear-gradient(135deg, #4ade80, #22c55e) !important; color: #fff !important; }
      .mpd-receipt-top { text-align: center; font-size: 11px; color: #86efac; letter-spacing: 1px; margin: 8px 0 12px; overflow: hidden; white-space: nowrap; }
      body.dark-mode .mpd-receipt-top { color: #4ade80; opacity: 0.5; }
      .mpd-list { display: flex; flex-direction: column; gap: 8px; }
      .mpd-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: rgba(255,255,255,0.55); border: 1px solid rgba(74,222,128,0.25); border-radius: 12px; transition: transform 0.15s; }
      .mpd-item:hover { transform: translateX(3px); }
      body.dark-mode .mpd-item { background: rgba(20,60,30,0.55); border-color: rgba(74,222,128,0.15); }
      .mpd-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #4ade80, #22c55e); color: #fff; font-size: 15px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 8px rgba(74,222,128,0.35); }
      .mpd-info { flex: 1; min-width: 0; }
      .mpd-name { font-size: 13px; font-weight: 700; color: #14532d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      body.dark-mode .mpd-name { color: #bbf7d0; }
      .mpd-items { font-size: 11px; color: #15803d; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: 0.8; }
      body.dark-mode .mpd-items { color: #86efac; }
      .mpd-borrowed { font-size: 11px; color: #6b7280; margin-top: 2px; font-weight: 500; }
      body.dark-mode .mpd-borrowed { color: #9ca3af; }
      .mpd-surcharge-details { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 3px; align-items: center; }
      .mpd-original { font-size: 11px; color: #6b7280; font-weight: 600; }
      body.dark-mode .mpd-original { color: #9ca3af; }
      .mpd-surcharge-tag { font-size: 10px; font-weight: 700; color: #d97706; background: rgba(251,191,36,0.15); padding: 1px 6px; border-radius: 6px; border: 1px solid rgba(251,191,36,0.3); }
      body.dark-mode .mpd-surcharge-tag { color: #fbbf24; background: rgba(120,80,0,0.25); border-color: rgba(251,191,36,0.2); }
      .mpd-amount { font-size: 14px; font-weight: 800; color: #16a34a; flex-shrink: 0; }
      body.dark-mode .mpd-amount { color: #4ade80; }
      .mpd-receipt-divider { border-top: 2px dashed rgba(74,222,128,0.4); margin: 12px 0 10px; }
      .mpd-total-row { display: flex; justify-content: space-between; align-items: center; padding: 2px; }
      .mpd-total-label { font-size: 13px; font-weight: 700; color: #15803d; }
      body.dark-mode .mpd-total-label { color: #86efac; }
      .mpd-total-value { font-size: 16px; font-weight: 900; color: #166534; }
      body.dark-mode .mpd-total-value { color: #4ade80; }
    </style>
  `;
}

// =============================================================================
//  7. CLOSE MODAL
// =============================================================================

function closeModal(event) {
  if (event && event.target.className !== 'date-modal-overlay') return;
  const modal = document.getElementById('dateDetailsModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = '';
  }
}

// =============================================================================
//  8. HELPERS
// =============================================================================

function getMonthName(monthIndex) {
  return ['January','February','March','April','May','June',
          'July','August','September','October','November','December'][monthIndex];
}

function isTodayDate(year, month, day) {
  const today = new Date();
  return today.getFullYear() === year &&
         today.getMonth()    === month &&
         today.getDate()     === day;
}

// =============================================================================
//  EXPORTS
// =============================================================================

async function clearMonthSales() {
  const monthName = getMonthName(currentMonth);
  const year = currentYear;
  const month = currentMonth;

  const sales = await DB.getSales();
  const monthSales = sales.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  if (monthSales.length === 0) {
    showModernAlert(`No sales records found for ${monthName} ${year}.`, 'ℹ️');
    return;
  }

  const ok = await showModernConfirm(
    `Delete all <strong>${monthSales.length} sales record${monthSales.length !== 1 ? 's' : ''}</strong> for <strong>${monthName} ${year}</strong>?<br><br>
     ✅ <strong>PRESERVED:</strong> Calendar summary data, payment history, debtor records<br><br>
     🗑️ <strong>DELETED:</strong> ${monthSales.length} transaction record${monthSales.length !== 1 ? 's' : ''} from Recent Sales<br><br>
     This cannot be undone!`,
    '🗑️'
  );
  if (!ok) return;

  const filtered = sales.filter(s => {
    const d = new Date(s.date);
    return !(d.getFullYear() === year && d.getMonth() === month);
  });

  await DB.saveSales(filtered);

  showModernAlert(
    `✅ Done!<br><br>• ${monthSales.length} record${monthSales.length !== 1 ? 's' : ''} from ${monthName} ${year} cleared<br>• Calendar summaries preserved`,
    '✅'
  );

  await renderCalendar();
  if (typeof renderProfit === 'function') await renderProfit();
}

window.renderCalendar  = renderCalendar;
window.showDateDetails = showDateDetails;
window.closeModal      = closeModal;
window.changeMonth     = changeMonth;
window.clearMonthSales = clearMonthSales;

console.log('✅ Calendar module loaded!');