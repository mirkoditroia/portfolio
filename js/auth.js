/* Firebase Authentication Helper */
(function(){
  if(window.APP_ENV !== 'prod') return; // Only in production

  let currentUser = null;
  
  // Wait for Firebase to initialize
  const waitForAuth = () => {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (window.auth) {
          resolve(window.auth);
        } else {
          setTimeout(checkAuth, 100);
        }
      };
      checkAuth();
    });
  };

  // Initialize auth state listener
  const initAuth = async () => {
    try {
      const auth = await waitForAuth(); // compat auth instance

      // Listen for auth state changes (compat)
      auth.onAuthStateChanged((user) => {
        currentUser = user;
        updateAuthUI();

        if (user) {
          console.log('🔐 User authenticated:', user.email);
        } else {
          console.log('🔓 User signed out');
        }
      });

      // Expose auth functions globally using compat methods
      window.adminLogin = async (email, password) => {
        try {
          const userCredential = await auth.signInWithEmailAndPassword(email, password);
          return userCredential.user;
        } catch (error) {
          throw new Error('Login failed: ' + error.message);
        }
      };

      window.adminLogout = async () => {
        try {
          await auth.signOut();
        } catch (error) {
          throw new Error('Logout failed: ' + error.message);
        }
      };
      
      window.getCurrentUser = () => currentUser;
      window.isAuthenticated = () => !!currentUser;
      
    } catch (error) {
      console.error('Auth initialization failed:', error);
    }
  };

  // Update auth UI elements
  const updateAuthUI = () => {
    const authStatus = document.getElementById('auth-status');
    const loginForm = document.getElementById('login-form');
    const adminContent = document.getElementById('admin-content');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (currentUser) {
      // User is authenticated
      if (authStatus) authStatus.textContent = `Logged in as: ${currentUser.email}`;
      if (loginForm) loginForm.style.display = 'none';
      if (adminContent) adminContent.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      // User is not authenticated
      if (authStatus) authStatus.textContent = 'Not authenticated';
      if (loginForm) loginForm.style.display = 'block';
      if (adminContent) adminContent.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }
})(); 