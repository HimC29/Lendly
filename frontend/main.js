// ---------- Fake data (replace with fetch() later) ----------
const books = [
  { id: 1, title: 'The Lighthouse Keeper', author: 'Marta Ellison', genre: 'fiction', pages: 312, copies: 2 },
  { id: 2, title: 'A Short Map of the Cosmos', author: 'Idris Okafor', genre: 'science', pages: 290, copies: 1 },
  { id: 3, title: 'Pip and the Paper Boat', author: 'Lena Hartwell', genre: 'kids', pages: 32, copies: 3 },
];

let loans = [
  { bookId: 2, due: '2026-10-20' },
];

const $ = (id) => document.getElementById(id);
let activeFilter = 'all';
let pendingBookId = null;

// ---------- Helpers ----------
function copiesLeft(book) {
  return book.copies - loans.filter(l => l.bookId === book.id).length;
}

function loanStatus(dueDate) {
  const days = Math.ceil((new Date(dueDate) - new Date()) / 86400000);
  if (days < 0) return 'overdue';
  if (days <= 3) return 'due-soon';
  return 'borrowed';
}

function showToast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.remove('hidden');
  setTimeout(() => $('toast').classList.add('hidden'), 2500);
}

// ---------- Render books ----------
function renderBooks() {
  const q = $('search').value.toLowerCase();
  const grid = $('book-grid');
  grid.innerHTML = '';

  const shown = books.filter(b => {
    const matchesText = (b.title + ' ' + b.author).toLowerCase().includes(q);
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'available' && copiesLeft(b) > 0) ||
      b.genre === activeFilter;
    return matchesText && matchesFilter;
  });

  $('no-results').classList.toggle('hidden', shown.length > 0);

  for (const b of shown) {
    const card = $('book-template').content.cloneNode(true);
    const left = copiesLeft(b);

    card.querySelector('.book-title').textContent = b.title;
    card.querySelector('.book-author').textContent = b.author;
    card.querySelector('.book-extra').textContent = b.pages + ' pages';

    const badge = card.querySelector('.book-status');
    badge.className = 'badge book-status ' + (left > 0 ? 'available' : 'borrowed');
    badge.textContent = left > 0 ? 'Available' : 'Borrowed';

    const btn = card.querySelector('.borrow-btn');
    btn.dataset.id = b.id;
    btn.disabled = left === 0;
    btn.textContent = left > 0 ? 'Borrow' : 'Unavailable';

    grid.appendChild(card);
  }
}

// ---------- Render loans ----------
function renderLoans() {
  const list = $('loan-list');
  list.innerHTML = '';
  let soon = 0, overdue = 0;

  for (const loan of loans) {
    const book = books.find(b => b.id === loan.bookId);
    const status = loanStatus(loan.due);
    if (status === 'due-soon') soon++;
    if (status === 'overdue') overdue++;

    const row = $('loan-template').content.cloneNode(true);
    row.querySelector('.loan').classList.add(status);
    row.querySelector('.book-title').textContent = book.title;
    row.querySelector('.book-author').textContent = book.author;
    row.querySelector('.loan-due').textContent = 'Due ' + loan.due;

    const badge = row.querySelector('.loan-status');
    badge.className = 'badge loan-status ' + status;
    badge.textContent = { borrowed: 'Borrowed', 'due-soon': 'Due soon', overdue: 'Overdue' }[status];

    row.querySelector('.return-btn').dataset.id = book.id;
    list.appendChild(row);
  }

  $('stat-borrowed').textContent = loans.length;
  $('stat-soon').textContent = soon;
  $('stat-overdue').textContent = overdue;
  $('no-loans').classList.toggle('hidden', loans.length > 0);
}

// ---------- Tabs, search, filters ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
    ['browse', 'loans', 'account'].forEach(v =>
      $('view-' + v).classList.toggle('hidden', v !== tab.dataset.view));
  });
});

$('search').addEventListener('input', renderBooks);

$('filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (!chip) return;
  activeFilter = chip.dataset.filter;
  document.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c === chip));
  renderBooks();
});

// ---------- Borrow (modal) and return ----------
$('book-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('.borrow-btn');
  if (!btn) return;
  pendingBookId = Number(btn.dataset.id);
  const book = books.find(b => b.id === pendingBookId);
  $('modal-text').textContent = `"${book.title}" is yours for 2 weeks.`;
  $('borrow-modal').classList.remove('hidden');
});

$('modal-cancel').addEventListener('click', () => $('borrow-modal').classList.add('hidden'));

$('modal-confirm').addEventListener('click', () => {
  const due = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  loans.push({ bookId: pendingBookId, due });
  $('borrow-modal').classList.add('hidden');
  showToast('Book borrowed.');
  renderBooks();
  renderLoans();
});

$('loan-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.return-btn');
  if (!btn) return;
  loans = loans.filter(l => l.bookId !== Number(btn.dataset.id));
  showToast('Book returned.');
  renderBooks();
  renderLoans();
});

// ---------- Start ----------
renderBooks();
renderLoans();
