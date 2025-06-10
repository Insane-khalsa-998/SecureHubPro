class SecureHubNavbar extends HTMLElement {
  connectedCallback() {
    const currentPath = window.location.pathname;
    const currentTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    this.innerHTML = `
      <nav class="navbar mb-4">
        <div class="container">
          <div class="d-flex align-items-center">
            <a href="../../index.html" class="navbar-brand me-4">
              <i class="bi bi-shield-lock"></i> SecureHub
            </a>
            <div class="btn-group">
              <a href="../../tools/encryption/index.html" class="btn btn-outline-primary">
                <i class="bi bi-key"></i> Encryption
              </a>
              <a href="../../tools/steganography/index.html" class="btn btn-outline-primary">
                <i class="bi bi-image"></i> Steganography
              </a>
              <a href="../../tools/bruteforce/index.html" class="btn btn-outline-primary active">
                <i class="bi bi-fire"></i> Brute-force
              </a>
            </div>
          </div>
          
          <div class="nav-right">
            <span class="datetime me-3">${currentTime}</span>
            <span class="user me-3">@Insane-khalsa-998</span>
            <button id="reportIssue" class="btn btn-outline-warning me-2">
              <i class="bi bi-bug"></i> Report Issue
            </button>
            <button id="themeToggle" class="btn btn-outline-primary">
              <i class="bi bi-moon-stars"></i>
            </button>
          </div>
        </div>
      </nav>
    `;

    // Theme toggle
    const themeBtn = this.querySelector('#themeToggle');
    themeBtn?.addEventListener('click', () => {
      const html = document.documentElement;
      const currentTheme = html.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      html.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      
      const icon = themeBtn.querySelector('i');
      icon.className = `bi bi-${newTheme === 'dark' ? 'sun' : 'moon-stars'}`;
    });

    // Update datetime every second
    setInterval(() => {
      const datetime = this.querySelector('.datetime');
      if (datetime) {
        datetime.textContent = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
    }, 1000);
  }
}

// Register the custom element
customElements.define('securehub-navbar', SecureHubNavbar);