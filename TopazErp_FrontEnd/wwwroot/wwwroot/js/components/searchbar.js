
    const pages = [];

    // Collect all menu items and their links + category
    document.querySelectorAll('#main-menu-navigation a.menu-item').forEach(a => {

    // Find the closest parent menu (category)
    let category = '';
    const parentMenu = a.closest('.has-sub');

    if (parentMenu) {
    const titleEl = parentMenu.querySelector('.menu-title');
    if (titleEl) {
    category = titleEl.textContent.trim();
}
}

    pages.push({
    title: a.textContent.trim(),
    url: a.getAttribute('href'),
    category: category || 'General'
});
});

    const input = document.getElementById('pageSearchInput');
    const resultsContainer = document.getElementById('searchResults');

    input.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    resultsContainer.innerHTML = '';

    if (!query) {
    resultsContainer.style.display = 'none';
    return;
}

    const matches = pages.filter(p => p.title.toLowerCase().includes(query));

    if (matches.length === 0) {
    resultsContainer.style.display = 'none';
    return;
}

    matches.forEach(match => {
    const item = document.createElement('a');
    item.href = match.url;
    item.className = 'dropdown-item';

    item.innerHTML = `
                <div class="d-flex flex-column">
                    <div class="d-flex align-items-center">
                        <i class="la la-link mr-2"></i>
                        <strong>${match.title}</strong>
                    </div>
                    <small class="text-muted ml-4">${match.category}</small>
                </div>
            `;

    resultsContainer.appendChild(item);
});

    resultsContainer.style.display = 'block';
});

    // Hide dropdown if clicked outside
    document.addEventListener('click', function(e) {
    if (!input.contains(e.target) && !resultsContainer.contains(e.target)) {
    resultsContainer.style.display = 'none';
}
});
