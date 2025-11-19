// public/app.js

(async function () {

  const form = document.getElementById('createForm');
  const msg = document.getElementById('msg');
  const tbody = document.getElementById('linksTbody');
  const search = document.getElementById('search');


  // ----------------------------------------------------------
  // 1. LOAD TABLE (ONLY ONCE OR WHEN SEARCHING / CREATING)
  // ----------------------------------------------------------
  async function loadLinks() {
    tbody.innerHTML = '<tr><td colspan="5" class="p-4">Loading...</td></tr>';

    try {
      const res = await fetch('/api/links?t=' + Date.now());
      const rows = await res.json();
      displayRows(rows);
    } catch (err) {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="5" class="p-4">Error loading links.</td></tr>';
    }
  }


  // ----------------------------------------------------------
  // 2. RENDER TABLE ROWS (WITH UNIQUE IDs FOR LIVE UPDATE)
  // ----------------------------------------------------------
  function displayRows(rows) {
    const q = search.value.trim().toLowerCase();
    const filtered = rows.filter(r =>
      !q ||
      r.code.toLowerCase().includes(q) ||
      r.url.toLowerCase().includes(q)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="p-4">No links found.</td></tr>';
      return;
    }

    tbody.innerHTML = ''; // clear table

    filtered.forEach(r => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td class="p-2 align-top">
          <a href="/code/${r.code}" class="font-medium text-blue-600">${r.code}</a><br/>
          <a href="${r.short_url}" target="_blank" class="text-xs text-gray-500">${r.short_url}</a>
        </td>

        <td class="p-2 align-top">
          <a href="${r.url}" target="_blank" class="block max-w-md truncate">${r.url}</a>
        </td>

        <td id="clicks-${r.code}" class="p-2 align-top">${r.clicks}</td>

        <td id="last-${r.code}" class="p-2 align-top">
          ${r.last_clicked ? new Date(r.last_clicked).toLocaleString() : '—'}
        </td>

        <td class="p-2 align-top">
          <button data-code="${r.code}" class="deleteBtn bg-red-500 text-white px-2 py-1 rounded">Delete</button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // activate delete buttons
    enableDeleteButtons();
  }



  // ----------------------------------------------------------
  // 3. ENABLE DELETE BUTTONS
  // ----------------------------------------------------------
  function enableDeleteButtons() {
    document.querySelectorAll('.deleteBtn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        const code = ev.target.dataset.code;

        if (!confirm('Delete ' + code + '?')) return;

        const res = await fetch('/api/links/' + code, { method: 'DELETE' });

        if (res.ok) {
          msg.textContent = 'Deleted ' + code;
          await loadLinks(); // reload table
        } else {
          const j = await res.json();
          msg.textContent = 'Failed: ' + (j.error || res.statusText);
        }
      });
    });
  }



  // ----------------------------------------------------------
  // 4. UPDATE ONLY CLICK COUNTS + LAST CLICKED (NO BLINKING)
  // ----------------------------------------------------------
  async function updateClickCounts() {
    try {
      const res = await fetch('/api/links?t=' + Date.now());
      const rows = await res.json();

      rows.forEach(r => {
        const clicksCell = document.querySelector(`#clicks-${r.code}`);
        const lastCell = document.querySelector(`#last-${r.code}`);

        if (clicksCell) clicksCell.textContent = r.clicks;
        if (lastCell)
          lastCell.textContent = r.last_clicked
            ? new Date(r.last_clicked).toLocaleString()
            : '—';
      });
    } catch (err) {
      console.error("Live update failed:", err);
    }
  }



  // ----------------------------------------------------------
  // 5. CREATE NEW SHORT LINK
  // ----------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';

    const url = document.getElementById('url').value.trim();
    const code = document.getElementById('code').value.trim();

    if (!url) {
      msg.textContent = 'Please enter a URL';
      return;
    }

    const payload = { url };
    if (code) payload.code = code;

    const btn = e.submitter || form.querySelector('button[type="submit"]');
    btn.disabled = true;

    try {
      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.status === 201) {
        msg.textContent = 'Created: ' + data.short_url;
        form.reset();
        await loadLinks();
      } else {
        msg.textContent = 'Error: ' + (data.error || JSON.stringify(data));
      }

    } catch (err) {
      console.error(err);
      msg.textContent = 'Network error';
    }

    btn.disabled = false;
  });



  // ----------------------------------------------------------
  // 6. SEARCH FILTER
  // ----------------------------------------------------------
  search.addEventListener('input', () => loadLinks());



  // ----------------------------------------------------------
  // 7. INITIAL TABLE LOAD
  // ----------------------------------------------------------
  loadLinks();



  // ----------------------------------------------------------
  // 8. REAL-TIME UPDATE FOR CLICKS ONLY (NO BLINKING)
  // ----------------------------------------------------------
  setInterval(updateClickCounts, 1000);


})();
